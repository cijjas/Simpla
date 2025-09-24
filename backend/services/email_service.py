import hashlib
import resend
from config import settings


def _generate_token_pair() -> tuple[str, str]:
    raw = hashlib.sha256(hashlib.token_bytes(32)).hexdigest()
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    return raw, token_hash


def send_verification_email(email: str, token: str) -> None:
    if not settings.RESEND_API_KEY:
        return
    
    resend.api_key = settings.RESEND_API_KEY
    url = f"{settings.BACKEND_URL or 'http://localhost:8000'}/auth/verify?token={token}&email={email}"
    
    # Retry logic for consistency
    for attempt in range(3):
        try:
            resend.Emails.send({
                "from": f"Simpla <{settings.EMAIL_FROM or 'no-reply@simplar.com.ar'}>",
                "to": [email],
                "subject": "Confirmá tu cuenta en Simpla",
                "html": f"<p>Verificá tu cuenta: <a href='{url}'>link</a></p>",
            })
            return
        except Exception as e:
            if attempt == 2:  # Last attempt
                raise e
            # Small delay between attempts
            import time
            time.sleep(0.5)


def send_reset_password_email(email: str, token: str) -> None:
    if not settings.RESEND_API_KEY:
        return
    
    resend.api_key = settings.RESEND_API_KEY
    url = f"{settings.FRONTEND_SITE_URL}/restablecer-contrasena?token={token}&email={email}"
    
    # Retry logic similar to send_feedback_email
    for attempt in range(3):
        try:
            resend.Emails.send({
                "from": f"Simpla <{settings.EMAIL_FROM or 'no-reply@simplar.com.ar'}>",
                "to": [email],
                "subject": "Restablecé tu contraseña de Simpla",
                "html": f"<p>Restablecé tu contraseña: <a href='{url}'>link</a></p>",
            })
            return
        except Exception as e:
            if attempt == 2:  # Last attempt
                raise e
            # Small delay between attempts
            import time
            time.sleep(0.5)


def send_feedback_email(message: str, origin: str = 'webapp') -> None:
    if not settings.RESEND_API_KEY or not settings.FEEDBACK_EMAILS:
        return
    
    feedback_emails = [email.strip() for email in settings.FEEDBACK_EMAILS.split(',')]
    if not feedback_emails:
        return
        
    resend.api_key = settings.RESEND_API_KEY
    
    # Retry logic similar to frontend
    for attempt in range(3):
        try:
            resend.Emails.send({
                "from": f"Feedback <{settings.EMAIL_FROM or 'no-reply@simplar.com.ar'}>",
                "to": feedback_emails,
                "subject": f"Nuevo feedback ({origin})",
                "text": message,
            })
            return
        except Exception as e:
            if attempt == 2:  # Last attempt
                raise e
            # Small delay between attempts
            import time
            time.sleep(0.5)


