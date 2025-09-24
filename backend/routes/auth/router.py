import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from config import settings
from services.email_service import send_verification_email, send_reset_password_email, send_feedback_email

router = APIRouter(prefix="/auth", tags=["auth"])

def get_engine() -> Engine:
    if not settings.DATABASE_URL:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
    return create_engine(settings.DATABASE_URL, pool_pre_ping=True)

######################### BODIES ################################

class ResetRequestBody(BaseModel):
    email: str

class ResetPasswordBody(BaseModel):
    email: str
    token: str
    password: str

class FeedbackBody(BaseModel):
    message: str
    origin: str = 'webapp'

######################### ROUTES ################################

@router.get("/verify")
def verify(email: str = Query(...), token: str = Query(...), engine: Engine = Depends(get_engine)):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with engine.begin() as conn:
        rec = conn.execute(
            text(
                """
                select identifier, token, expires from "VerificationToken"
                where identifier=:email and token=:token
                """
            ),
            {"email": email, "token": token_hash},
        ).mappings().first()
        if not rec or rec["expires"] < datetime.utcnow():
            return {"redirect": "/iniciar-sesion?error=ExpiredToken"}

        conn.execute(
            text('update "User" set "emailVerified"=:now where email=:email'),
            {"now": datetime.utcnow(), "email": email},
        )
        conn.execute(
            text(
                'delete from "VerificationToken" where identifier=:email and token=:token'
            ),
            {"email": email, "token": token_hash},
        )

    return {
        "redirect": f"{settings.FRONTEND_SITE_URL}/verificar?success=true&email={email}",
    }


@router.get("/resend")
def resend(email: str = Query(...), engine: Engine = Depends(get_engine)):
    with engine.begin() as conn:
        user = conn.execute(
            text('select id, "emailVerified" from "User" where email=:email'),
            {"email": email},
        ).mappings().first()
        if not user or user["emailVerified"] is not None:
            return {"redirect": "/iniciar-sesion"}

        conn.execute(
            text('delete from "VerificationToken" where identifier=:email'),
            {"email": email},
        )

        raw = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw.encode()).hexdigest()
        expires = datetime.utcnow() + timedelta(days=1)
        conn.execute(
            text(
                'insert into "VerificationToken" (identifier, token, expires) values (:email, :token, :expires)'
            ),
            {"email": email, "token": token_hash, "expires": expires},
        )

    send_verification_email(email=email, token=raw)
    return {
        "redirect": f"{settings.FRONTEND_SITE_URL}/verificar?success=true&email={email}",
    }


@router.post("/reset-request")
def reset_request(body: ResetRequestBody, engine: Engine = Depends(get_engine)):
    email = body.email
    with engine.begin() as conn:
        user = conn.execute(
            text('select id, "emailVerified" from "User" where email=:email'),
            {"email": email},
        ).mappings().first()
        if not user or user["emailVerified"] is None:
            return {"success": True}

        raw = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw.encode()).hexdigest()
        expires = datetime.utcnow() + timedelta(hours=1)
        conn.execute(
            text(
                'insert into "VerificationToken" (identifier, token, expires) values (:email, :token, :expires)'
            ),
            {"email": email, "token": token_hash, "expires": expires},
        )

    send_reset_password_email(email=email, token=raw)
    return {"success": True}


@router.post("/reset-password")
def reset_password(body: ResetPasswordBody, engine: Engine = Depends(get_engine)):
    email = body.email
    token = body.token
    password = body.password
    if not email or not token or not password:
        raise HTTPException(status_code=400, detail="Missing data")

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with engine.begin() as conn:
        rec = conn.execute(
            text(
                'select identifier, token, expires from "VerificationToken" where identifier=:email and token=:token'
            ),
            {"email": email, "token": token_hash},
        ).mappings().first()
        if not rec or rec["expires"] < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Token inválido o expirado")

        import bcrypt

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        conn.execute(
            text('update "User" set "hashedPassword"=:pwd where email=:email'),
            {"pwd": hashed, "email": email},
        )
        conn.execute(
            text(
                'delete from "VerificationToken" where identifier=:email and token=:token'
            ),
            {"email": email, "token": token_hash},
        )

    return {"success": True}
