"""Email service for feedback functionality."""

import time
import resend
from core.config.config import settings


def send_feedback_email(message: str, origin: str = 'webapp') -> None:
    """
    Send feedback email to configured feedback recipients.
    
    Args:
        message: The feedback message content
        origin: The origin of the feedback (e.g., 'webapp', 'mobile')
    """
    if not settings.RESEND_API_KEY or not settings.FEEDBACK_EMAILS:
        return
    
    feedback_emails = [email.strip() for email in settings.FEEDBACK_EMAILS.split(',')]
    if not feedback_emails:
        return
        
    resend.api_key = settings.RESEND_API_KEY
    
    # Retry logic for reliability
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
            time.sleep(0.5)
