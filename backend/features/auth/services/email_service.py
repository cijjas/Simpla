import hashlib
import resend
from core.config.config import settings


def _generate_token_pair() -> tuple[str, str]:
    raw = hashlib.sha256(hashlib.token_bytes(32)).hexdigest()
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    return raw, token_hash


def send_verification_email(email: str, token: str) -> None:
    if not settings.RESEND_API_KEY:
        return
    
    resend.api_key = settings.RESEND_API_KEY
    url = f"{settings.FRONTEND_SITE_URL}/verificar?token={token}&email={email}"
    
    # Retry logic for consistency
    for attempt in range(3):
        try:
            resend.Emails.send({
                "from": f"Simpla <{settings.EMAIL_FROM or 'no-reply@simplar.com.ar'}>",
                "to": [email],
                "subject": "Confirmá tu cuenta en Simpla",
                "html": f"""
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Confirmá tu cuenta en Simpla</title>
                    <style>
                        body {{
                            margin: 0;
                            padding: 20px;
                            background-color: #ffffff;
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                        }}
                        
                        .email-container {{
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            border: 1px solid #e5e5e5;
                        }}
                        
                        .header {{
                            background-color: #f8f8f8;
                            padding: 30px;
                            text-align: center;
                            border-bottom: 1px solid #e5e5e5;
                        }}
                        
                        .brand-name {{
                            font-size: 24px;
                            font-weight: bold;
                            margin: 0;
                            color: #333333;
                        }}
                        
                        .content {{
                            padding: 30px;
                        }}
                        
                        .title {{
                            font-size: 20px;
                            font-weight: bold;
                            color: #333333;
                            margin: 0 0 20px 0;
                        }}
                        
                        .message {{
                            font-size: 16px;
                            color: #666666;
                            margin-bottom: 30px;
                        }}
                        
                        .cta-button {{
                            display: inline-block;
                            background-color: #333333;
                            text-color: white;
                            color: white;
                            text-decoration: none;
                            padding: 12px 24px;
                            font-weight: bold;
                            font-size: 16px;
                            text-align: center;
                        }}
                        
                        .cta-container {{
                            text-align: center;
                            margin: 30px 0;
                        }}
                        
                        .fallback-link {{
                            margin-top: 20px;
                            padding: 15px;
                            background-color: #f8f8f8;
                            border: 1px solid #e5e5e5;
                        }}
                        
                        .fallback-link p {{
                            margin: 0 0 10px 0;
                            font-size: 14px;
                            color: #666666;
                        }}
                        
                        .fallback-link a {{
                            color: #333333;
                            word-break: break-all;
                            font-size: 14px;
                            text-decoration: none;
                            text-color: white;
                        }}
                        
                        .footer {{
                            padding: 20px 30px;
                            background-color: #f8f8f8;
                            text-align: center;
                            border-top: 1px solid #e5e5e5;
                        }}
                        
                        .footer p {{
                            margin: 0;
                            font-size: 14px;
                            color: #666666;
                        }}
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <h1 class="brand-name">SIMPLA</h1>
                        </div>
                        
                        <div class="content">
                            <h2 class="title">Confirmación de cuenta</h2>
                            
                            <div class="message">
                                <p>Hola,</p>
                                <p>Gracias por registrarte en Simpla. Para activar tu cuenta, hacé click en el botón de abajo:</p>
                            </div>
                            
                            <div class="cta-container">
                                <a href="{url}" class="cta-button">Confirmar mi cuenta</a>
                            </div>
                            
                            <div class="fallback-link">
                                <p><strong>¿No funciona el botón?</strong> Copiá y pegá este enlace en tu navegador:</p>
                                <a href="{url}">{url}</a>
                            </div>
                            
                            <div class="message">
                                <p>Si no creaste una cuenta en Simpla, podés ignorar este correo.</p>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>Este correo fue enviado desde Simpla • <a href="{settings.FRONTEND_SITE_URL}" style="color: #333333;">simplar.com.ar</a></p>
                        </div>
                    </div>
                </body>
                </html>
                """,
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
    
    # Retry logic for consistency
    for attempt in range(3):
        try:
            resend.Emails.send({
                "from": f"Simpla <{settings.EMAIL_FROM or 'no-reply@simplar.com.ar'}>",
                "to": [email],
                "subject": "Restablecé tu contraseña de Simpla",
                "html": f"""
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Restablecé tu contraseña de Simpla</title>
                    <style>
                        body {{
                            margin: 0;
                            padding: 20px;
                            background-color: #ffffff;
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                        }}
                        
                        .email-container {{
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            border: 1px solid #e5e5e5;
                        }}
                        
                        .header {{
                            background-color: #f8f8f8;
                            padding: 30px;
                            text-align: center;
                            border-bottom: 1px solid #e5e5e5;
                        }}
                        
                        .brand-name {{
                            font-size: 24px;
                            font-weight: bold;
                            margin: 0;
                            color: #333333;
                        }}
                        
                        .content {{
                            padding: 30px;
                        }}
                        
                        .title {{
                            font-size: 20px;
                            font-weight: bold;
                            color: #333333;
                            margin: 0 0 20px 0;
                        }}
                        
                        .message {{
                            font-size: 16px;
                            color: #666666;
                            margin-bottom: 30px;
                        }}
                        
                        .cta-button {{
                            display: inline-block;
                            background-color: #333333;
                            text-color: white;
                            color: white;
                            text-decoration: none;
                            padding: 12px 24px;
                            font-weight: bold;
                            font-size: 16px;
                            text-align: center;
                        }}
                        
                        .cta-container {{
                            text-align: center;
                            margin: 30px 0;
                        }}
                        
                        .fallback-link {{
                            margin-top: 20px;
                            padding: 15px;
                            background-color: #f8f8f8;
                            border: 1px solid #e5e5e5;
                        }}
                        
                        .fallback-link p {{
                            margin: 0 0 10px 0;
                            font-size: 14px;
                            color: #666666;
                        }}
                        
                        .fallback-link a {{
                            color: #333333;
                            word-break: break-all;
                            font-size: 14px;
                            text-decoration: none;
                            text-color: white;
                        }}
                        
                        .security-notice {{
                            margin-top: 20px;
                            padding: 15px;
                            background-color: #f0f0f0;
                            border: 1px solid #d0d0d0;
                        }}
                        
                        .security-notice p {{
                            margin: 0;
                            font-size: 14px;
                            color: #666666;
                        }}
                        
                        .footer {{
                            padding: 20px 30px;
                            background-color: #f8f8f8;
                            text-align: center;
                            border-top: 1px solid #e5e5e5;
                        }}
                        
                        .footer p {{
                            margin: 0;
                            font-size: 14px;
                            color: #666666;
                        }}
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <h1 class="brand-name">SIMPLA</h1>
                        </div>
                        
                        <div class="content">
                            <h2 class="title">Restablecer contraseña</h2>
                            
                            <div class="message">
                                <p>Hola,</p>
                                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Simpla.</p>
                                <p>Si fuiste vos quien solicitó este cambio, hacé click en el botón de abajo:</p>
                            </div>
                            
                            <div class="cta-container">
                                <a href="{url}" class="cta-button">Restablecer contraseña</a>
                            </div>
                            
                            <div class="fallback-link">
                                <p><strong>¿No funciona el botón?</strong> Copiá y pegá este enlace en tu navegador:</p>
                                <a href="{url}">{url}</a>
                            </div>
                            
                            <div class="security-notice">
                                <p><strong>Importante:</strong> Este enlace expirará en 24 horas por razones de seguridad.</p>
                            </div>
                            
                            <div class="message">
                                <p><strong>¿No solicitaste este cambio?</strong></p>
                                <p>Si no fuiste vos quien solicitó restablecer la contraseña, podés ignorar este correo. Tu cuenta permanecerá protegida.</p>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>Este correo fue enviado desde Simpla • <a href="{settings.FRONTEND_SITE_URL}" style="color: #333333;">simplar.com.ar</a></p>
                        </div>
                    </div>
                </body>
                </html>
                """,
            })
            return
        except Exception as e:
            if attempt == 2:  # Last attempt
                raise e
            # Small delay between attempts
            import time
            time.sleep(0.5)


