"""New authentication router with JWT-based authentication."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from core.utils.logging_config import get_logger
from core.utils.db_logging import log_database_operation, log_database_error

from core.database.base import get_db
from features.auth.models.user import User, RefreshToken
from features.auth.utils.auth import (
    get_password_hash, 
    verify_password, 
    verify_google_token,
    get_current_user,
    get_current_user_optional,
    create_user_id,
    create_refresh_token_id
)
from core.utils.jwt_utils import create_access_token, create_refresh_token, verify_token
from core.config.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])
logger = get_logger(__name__)

# Request/Response models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    id_token: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    provider: str
    email_verified: bool
    created_at: datetime

class RefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    password: str

class RegisterResponse(BaseModel):
    message: str
    email: str
    email_verified: bool


@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Register a new user with email and password."""
    logger.info(f"Registration attempt for email: {request.email}")
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            logger.warning(f"Registration failed: email {request.email} already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
        # Generate verification token
        import secrets
        import hashlib
        from features.auth.services.email_service import send_verification_email
        
        raw_token = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires = datetime.now(timezone.utc) + timedelta(hours=24)  # Token expires in 24 hours
        
        # Create new user (unverified)
        user = User(
            id=create_user_id(),
            email=request.email,
            name=request.name,
            hashed_password=get_password_hash(request.password),
            provider="email",
            email_verified=False,  # User must verify email before login
            verification_token=token_hash,
            verification_token_expires=expires
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        log_database_operation("INSERT", "users", user.id, {"email": user.email, "provider": user.provider})
        logger.info(f"User registered successfully: {user.email} (ID: {user.id}) - Email verification required")
        
        # Send verification email
        try:
            send_verification_email(email=request.email, token=raw_token)
            logger.info(f"Verification email sent to: {user.email}")
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            # Don't fail registration if email sending fails, but log the error
        
        return {
            "message": "Registration successful. Please check your email to verify your account before logging in.",
            "email": user.email,
            "email_verified": False
        }
    
    except Exception as e:
        log_database_error("user_registration", e, "users")
        logger.error(f"Registration failed for {request.email}: {str(e)}")
        raise


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login with email and password."""
    logger.info(f"Login attempt for email: {request.email}")
    
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user has a password (not OAuth-only user)
    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please login with Google or reset your password"
        )
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if email is verified
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please verify your email before logging in"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token_str = create_refresh_token(data={"sub": str(user.id)})
    
    # Store refresh token in database
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token_record = RefreshToken(
        id=create_refresh_token_id(),
        user_id=user.id,
        token=refresh_token_str,
        expires_at=expires_at
    )
    db.add(refresh_token_record)
    db.commit()
    
    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        secure=False,  # Set to False for local development, True in production with HTTPS
        samesite="lax",
        path="/",  # Ensure cookie is accessible from all paths
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "provider": user.provider,
            "email_verified": user.email_verified
        }
    )


@router.post("/google", response_model=TokenResponse)
async def google_login(
    request: GoogleLoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login with Google ID token."""
    # Verify Google token
    google_user = verify_google_token(request.id_token)
    if not google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    # Find or create user
    user = db.query(User).filter(User.email == google_user["email"]).first()
    
    if not user:
        # Create new user
        user = User(
            id=create_user_id(),
            email=google_user["email"],
            name=google_user["name"],
            avatar_url=google_user.get("picture"),
            provider="google",
            email_verified=google_user["email_verified"]
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update existing user if needed
        if user.provider != "google":
            user.provider = "google"
        if not user.email_verified and google_user["email_verified"]:
            user.email_verified = True
        if user.name != google_user["name"]:
            user.name = google_user["name"]
        if google_user.get("picture") and user.avatar_url != google_user["picture"]:
            user.avatar_url = google_user["picture"]
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token_str = create_refresh_token(data={"sub": str(user.id)})
    
    # Store refresh token in database
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token_record = RefreshToken(
        id=create_refresh_token_id(),
        user_id=user.id,
        token=refresh_token_str,
        expires_at=expires_at
    )
    db.add(refresh_token_record)
    db.commit()
    
    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        secure=False,  # Set to False for local development, True in production with HTTPS
        samesite="lax",
        path="/",  # Ensure cookie is accessible from all paths
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "provider": user.provider,
            "email_verified": user.email_verified
        }
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token from cookie."""
    # Get refresh token from cookie
    refresh_token_str = request.cookies.get("refresh_token")
    if not refresh_token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    # Verify refresh token
    payload = verify_token(refresh_token_str, "refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if refresh token exists in database and is not revoked
    refresh_token_record = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token_str,
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not refresh_token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or not found"
        )
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # Optionally rotate refresh token (recommended for security)
    # Revoke old refresh token
    refresh_token_record.revoked = True
    refresh_token_record.revoked_at = datetime.now(timezone.utc)
    
    # Create new refresh token
    new_refresh_token_str = create_refresh_token(data={"sub": str(user.id)})
    new_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token_record = RefreshToken(
        id=create_refresh_token_id(),
        user_id=user.id,
        token=new_refresh_token_str,
        expires_at=new_expires_at
    )
    db.add(new_refresh_token_record)
    db.commit()
    
    # Set new refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token_str,
        httponly=True,
        secure=False,  # Set to False for local development, True in production with HTTPS
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "provider": user.provider,
            "email_verified": user.email_verified
        }
    )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Logout user and revoke refresh token."""
    # Get refresh token from cookie
    refresh_token_str = request.cookies.get("refresh_token")
    
    if refresh_token_str and current_user:
        # Revoke refresh token in database
        refresh_token_record = db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token_str,
            RefreshToken.user_id == current_user.id
        ).first()
        
        if refresh_token_record:
            refresh_token_record.revoked = True
            refresh_token_record.revoked_at = datetime.now(timezone.utc)
            db.commit()
            logger.info(f"Refresh token revoked for user: {current_user.email}")
    elif refresh_token_str:
        # If we have a refresh token but no current user, try to revoke it anyway
        refresh_token_record = db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token_str
        ).first()
        
        if refresh_token_record:
            refresh_token_record.revoked = True
            refresh_token_record.revoked_at = datetime.now(timezone.utc)
            db.commit()
            logger.info("Refresh token revoked (user not authenticated)")
    
    # Clear refresh token cookie
    response.delete_cookie(key="refresh_token", path="/")
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        provider=current_user.provider,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at
    )


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Send password reset email."""
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.email_verified:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a reset link has been sent."}
    
    # Generate reset token
    import secrets
    import hashlib
    from features.auth.services.email_service import send_reset_password_email
    
    raw_token = secrets.token_hex(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store token in database
    user.reset_token = token_hash
    user.reset_token_expires = expires
    db.commit()
    
    # Send email
    try:
        send_reset_password_email(email=request.email, token=raw_token)
        return {"message": "If the email exists, a reset link has been sent."}
    except Exception as e:
        # Log the error but don't reveal it to the user
        print(f"Email sending error: {e}")
        return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using token."""
    import hashlib
    
    try:
        # Hash the provided token
        token_hash = hashlib.sha256(request.token.encode()).hexdigest()
        
        # Find user with matching reset token
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        if not user.reset_token or not user.reset_token_expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Check if token matches and hasn't expired
        if user.reset_token != token_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        if user.reset_token_expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Update password
        user.hashed_password = get_password_hash(request.password)
        user.reset_token = None  # Clear the reset token
        user.reset_token_expires = None  # Clear the reset token expiration
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        return {"message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/verify")
async def verify_email(
    token: str,
    email: str,
    db: Session = Depends(get_db)
):
    """Verify user email with token."""
    import hashlib
    
    try:
        # Hash the provided token
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Find user with matching verification token
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification link"
            )
        
        if not user.verification_token or not user.verification_token_expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification link"
            )
        
        # Check if token matches and hasn't expired
        if user.verification_token != token_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification link"
            )
        
        if user.verification_token_expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification link has expired. Please register again."
            )
        
        # Verify the user
        user.email_verified = True
        user.verification_token = None  # Clear the verification token
        user.verification_token_expires = None  # Clear the verification token expiration
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        logger.info(f"Email verified successfully for user: {user.email}")
        
        return {
            "message": "Email verified successfully! You can now log in.",
            "email": user.email,
            "email_verified": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/resend")
async def resend_verification_email(
    email: str,
    db: Session = Depends(get_db)
):
    """Resend verification email for unverified users."""
    logger.info(f"Resend verification request for email: {email}")
    
    try:
        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if email exists or not for security
            return {"message": "If the email exists and is unverified, a new verification email has been sent."}
        
        # Check if user is already verified
        if user.email_verified:
            return {"message": "Email is already verified."}
        
        # Generate new verification token
        import secrets
        import hashlib
        from features.auth.services.email_service import send_verification_email
        
        raw_token = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires = datetime.now(timezone.utc) + timedelta(hours=24)  # Token expires in 24 hours
        
        # Update user with new verification token
        user.verification_token = token_hash
        user.verification_token_expires = expires
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        log_database_operation("UPDATE", "users", user.id, {"email": user.email, "action": "resend_verification"})
        logger.info(f"New verification token generated for user: {user.email}")
        
        # Send verification email
        try:
            send_verification_email(email=email, token=raw_token)
            logger.info(f"Verification email resent to: {user.email}")
            return {"message": "If the email exists and is unverified, a new verification email has been sent."}
        except Exception as e:
            logger.error(f"Failed to resend verification email to {user.email}: {str(e)}")
            # Don't fail the request if email sending fails, but log the error
            return {"message": "If the email exists and is unverified, a new verification email has been sent."}
    
    except Exception as e:
        log_database_error("resend_verification", e, "users")
        logger.error(f"Resend verification failed for {email}: {str(e)}")
        return {"message": "If the email exists and is unverified, a new verification email has been sent."}


@router.get("/debug-reset-token/{email}")
async def debug_reset_token(email: str, db: Session = Depends(get_db)):
    """Debug endpoint to see reset token info (remove in production)."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"error": "User not found"}
    
    return {
        "email": user.email,
        "has_reset_token": bool(user.reset_token),
        "reset_token_expires": user.reset_token_expires.isoformat() if user.reset_token_expires else None
    }
