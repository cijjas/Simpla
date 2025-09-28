"""Email service for contact functionality."""

import time
import resend
from core.config.config import settings


def send_contact_email(name: str, email: str, phone: str = None, message: str = None) -> None:
    """
    Send contact email to configured contact recipients.
    
    Args:
        name: The contact's full name
        email: The contact's email address
        phone: The contact's phone number (optional)
        message: The contact message
    """
    if not settings.RESEND_API_KEY:
        return
    
    # Use contact emails if configured, otherwise fall back to feedback emails
    if settings.CONTACT_EMAILS:
        contact_emails = [email_addr.strip() for email_addr in settings.CONTACT_EMAILS.split(',')]
    elif settings.FEEDBACK_EMAILS:
        contact_emails = [email_addr.strip() for email_addr in settings.FEEDBACK_EMAILS.split(',')]
    else:
        return
    
    if not contact_emails:
        return
        
    resend.api_key = settings.RESEND_API_KEY
    
    # Prepare email content
    phone_info = f"<p><strong>Teléfono:</strong> {phone}</p>" if phone else ""
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nuevo mensaje de contacto - Simpla</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">Información del contacto:</h3>
            <p><strong>Nombre:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            {phone_info}
        </div>
        
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #1e293b;">Mensaje:</h3>
            <p style="white-space: pre-wrap;">{message}</p>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <p>Este mensaje fue enviado desde el formulario de contacto de Simpla.</p>
        </div>
    </div>
    """
    
    # Retry logic for reliability
    for attempt in range(3):
        try:
            resend.Emails.send({
                "from": f"Contacto Simpla <{settings.EMAIL_FROM or 'no-reply@simplar.com.ar'}>",
                "to": contact_emails,
                "subject": f"Nuevo mensaje de contacto de {name}",
                "html": html_content,
            })
            return
        except Exception as e:
            if attempt == 2:  # Last attempt
                raise e
            # Small delay between attempts
            time.sleep(0.5)
