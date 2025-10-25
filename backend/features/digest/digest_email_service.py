"""Email service for sending weekly digests to users."""

import resend
import time
from typing import List, Dict, Any
from datetime import date
from core.config.config import settings
from core.utils.logging_config import get_logger

logger = get_logger(__name__)


def send_weekly_digest_email(
    email: str,
    user_name: str,
    week_start: date,
    week_end: date,
    normas_summaries: List[Dict[str, Any]]
) -> bool:
    """
    Send a personalized weekly digest email to a user.
    
    Args:
        email: User's email address
        user_name: User's name for personalization
        week_start: Start date of the week
        week_end: End date of the week
        normas_summaries: List of norma summaries filtered for this user
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return False
    
    resend.api_key = settings.RESEND_API_KEY
    
    # Format dates for display
    week_start_str = week_start.strftime("%d/%m/%Y")
    week_end_str = week_end.strftime("%d/%m/%Y")
    
    # Build the normas list HTML
    normas_html = ""
    for norma in normas_summaries:
        tipo_norma = norma.get('tipo_norma', 'Norma')
        numero = norma.get('numero', '')
        titulo = norma.get('titulo', 'Sin título')
        summary = norma.get('summary', '')
        infoleg_id = norma.get('infoleg_id', '')
        publicacion = norma.get('publicacion')
        
        # Format publication date
        pub_date_str = ""
        if publicacion:
            if isinstance(publicacion, date):
                pub_date_str = publicacion.strftime("%d/%m/%Y")
            else:
                pub_date_str = str(publicacion)
        
        # Build norma card
        normas_html += f"""
        <div class="norma-card">
            <div class="norma-header">
                <h3 class="norma-title">{tipo_norma} {numero}</h3>
                {f'<span class="norma-date">{pub_date_str}</span>' if pub_date_str else ''}
            </div>
            <p class="norma-subtitle">{titulo}</p>
            <p class="norma-summary">{summary}</p>
            <a href="{settings.FRONTEND_SITE_URL}/normas/{infoleg_id}" class="norma-link">Ver norma completa →</a>
        </div>
        """
    
    # If no normas match user preferences
    if not normas_summaries:
        normas_html = """
        <div class="no-normas">
            <p>Esta semana no se publicaron normas que coincidan con tus preferencias de filtrado.</p>
            <p>Podés actualizar tus preferencias en tu perfil para recibir más contenido.</p>
        </div>
        """
    
    greeting = f"Hola {user_name}" if user_name else "Hola"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resumen Semanal de Normas - Simpla</title>
        <style>
            body {{
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
                font-family: Arial, sans-serif;
                line-height: 1.6;
            }}
            
            .email-container {{
                max-width: 700px;
                margin: 0 auto;
                background-color: #ffffff;
                border: 1px solid #e5e5e5;
            }}
            
            .header {{
                background-color: #333333;
                padding: 30px;
                text-align: center;
            }}
            
            .brand-name {{
                font-size: 28px;
                font-weight: bold;
                margin: 0;
                color: #ffffff;
            }}
            
            .subtitle {{
                font-size: 14px;
                color: #cccccc;
                margin: 5px 0 0 0;
            }}
            
            .content {{
                padding: 30px;
            }}
            
            .title {{
                font-size: 24px;
                font-weight: bold;
                color: #333333;
                margin: 0 0 10px 0;
            }}
            
            .week-range {{
                font-size: 14px;
                color: #666666;
                margin-bottom: 20px;
            }}
            
            .intro-message {{
                font-size: 16px;
                color: #666666;
                margin-bottom: 30px;
                padding: 15px;
                background-color: #f8f8f8;
                border-left: 4px solid #333333;
            }}
            
            .norma-card {{
                margin-bottom: 30px;
                padding: 20px;
                border: 1px solid #e5e5e5;
                border-left: 4px solid #333333;
                background-color: #fafafa;
            }}
            
            .norma-header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }}
            
            .norma-title {{
                font-size: 18px;
                font-weight: bold;
                color: #333333;
                margin: 0;
            }}
            
            .norma-date {{
                font-size: 12px;
                color: #999999;
            }}
            
            .norma-subtitle {{
                font-size: 14px;
                color: #666666;
                font-weight: 600;
                margin: 5px 0 10px 0;
            }}
            
            .norma-summary {{
                font-size: 14px;
                color: #666666;
                margin: 10px 0;
                line-height: 1.5;
            }}
            
            .norma-link {{
                display: inline-block;
                color: #333333;
                text-decoration: none;
                font-size: 14px;
                font-weight: bold;
                margin-top: 10px;
            }}
            
            .norma-link:hover {{
                text-decoration: underline;
            }}
            
            .no-normas {{
                padding: 30px;
                text-align: center;
                background-color: #f8f8f8;
                border: 1px solid #e5e5e5;
            }}
            
            .no-normas p {{
                margin: 10px 0;
                color: #666666;
            }}
            
            .footer {{
                padding: 20px 30px;
                background-color: #f8f8f8;
                text-align: center;
                border-top: 1px solid #e5e5e5;
            }}
            
            .footer p {{
                margin: 5px 0;
                font-size: 14px;
                color: #666666;
            }}
            
            .footer a {{
                color: #333333;
                text-decoration: none;
            }}
            
            .footer a:hover {{
                text-decoration: underline;
            }}
            
            .cta-button {{
                display: inline-block;
                background-color: #333333;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                font-weight: bold;
                font-size: 14px;
                text-align: center;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1 class="brand-name">SIMPLA</h1>
                <p class="subtitle">Resumen Semanal de Normas</p>
            </div>
            
            <div class="content">
                <h2 class="title">Resumen Semanal de Normas</h2>
                <p class="week-range">Semana del {week_start_str} al {week_end_str}</p>
                
                <div class="intro-message">
                    <p>{greeting},</p>
                    <p>Te compartimos el resumen de las normas publicadas esta semana que coinciden con tus preferencias.</p>
                </div>
                
                {normas_html}
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{settings.FRONTEND_SITE_URL}/normas" class="cta-button">Ver todas las normas</a>
                </div>
            </div>
            
            <div class="footer">
                <p>Este correo fue enviado desde Simpla</p>
                <p><a href="{settings.FRONTEND_SITE_URL}">simplar.com.ar</a> • <a href="{settings.FRONTEND_SITE_URL}/perfil">Actualizar preferencias</a></p>
                <p style="font-size: 12px; margin-top: 15px;">Si no deseás recibir más estos correos, podés desactivarlos desde tu perfil.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        resend.Emails.send({
            "from": f"Simpla <{settings.EMAIL_FROM or 'no-reply@simplar.com.ar'}>",
            "to": [email],
            "subject": f"Resumen Semanal de Normas ({week_start_str} - {week_end_str})",
            "html": html_content,
        })
        logger.info(f"Successfully sent weekly digest email to {email}")
        return True
    except Exception as e:
        logger.error(f"Error sending weekly digest email to {email}: {str(e)}", exc_info=True)
        return False


def send_digest_to_users(
    users_with_preferences: List[tuple],
    week_start: date,
    week_end: date,
    normas_with_summaries: List[Dict[str, Any]],
    digest_service
) -> int:
    """
    Send personalized digests to all users based on their preferences.
    
    Includes rate limiting to respect Resend's 2 requests per second limit.
    
    Args:
        users_with_preferences: List of (User, preferences_dict) tuples
        week_start: Start date of the week
        week_end: End date of the week
        normas_with_summaries: All normas with summaries from the digest
        digest_service: DigestService instance for filtering
    
    Returns:
        int: Number of emails successfully sent
    """
    emails_sent = 0
    
    for user, preferences in users_with_preferences:
        try:
            # Filter normas for this user (returns all if no preferences)
            filtered_normas = digest_service.filter_normas_for_user(
                preferences,
                normas_with_summaries
            )
            
            # Only send email if there are normas to send
            if filtered_normas:
                success = send_weekly_digest_email(
                    email=user.email,
                    user_name=user.name,
                    week_start=week_start,
                    week_end=week_end,
                    normas_summaries=filtered_normas
                )
                
                if success:
                    emails_sent += 1
                
                # Rate limiting: Resend allows 2 requests per second
                # Sleep for 0.6 seconds to stay safely under the limit
                time.sleep(0.6)
            else:
                logger.info(f"Skipping user {user.email} - no normas match their preferences")
                
        except Exception as e:
            logger.error(f"Error processing digest for user {user.email}: {str(e)}", exc_info=True)
            # Still sleep on error to maintain rate limit
            time.sleep(0.6)
            continue
    
    logger.info(f"Sent {emails_sent} digest emails to users")
    return emails_sent

