import { Resend } from 'resend';
import crypto from 'node:crypto';

const resend = new Resend(process.env.RESEND_API_KEY!);

/** Returns the *raw* token (to e‑mail) and the SHA‑256 hash (to DB). */
export function generateToken() {
  const raw = crypto.randomBytes(32).toString('hex'); // 64‑char
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export async function sendVerificationEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify?token=${token}&email=${email}`;

  await resend.emails.send({
    from: 'Simpla <no-reply@simplar.com.ar>',
    to: email,
    subject: 'Confirmá tu cuenta en Simpla',
    html: `
    <div style="max-width: 480px; margin: auto; padding: 20px; background-color: #fff; color: #111; font-family: 'Geist', sans-serif;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Geist&family=Lora:ital,wght@0,400;0,700;1,400&display=swap');
        h1, h2, .brand {
          font-family: 'Lora', serif !important;
        }
        body, p, a, div, span {
          font-family: 'Geist', sans-serif !important;
        }
      </style>

      <div style="text-align: center; margin-bottom: 24px;">
        <img
          src="https://www.simplar.com.ar/images/estampa.png"
          alt="Simpla"
          width="96"
          style="display: block; margin: 0 auto 12px;"
        />
        <h1 class="brand" style="margin: 0; font-size: 24px;">SIMPLA</h1>
      </div>

      <h2 style="text-align: center; font-size: 20px;">Confirmación de cuenta</h2>

      <p>Hola,</p>
      <p>Gracias por registrarte en <strong>Simpla</strong>. Para activar tu cuenta, hacé click en el botón de abajo:</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${url}" style="display: inline-block; padding: 12px 20px; background-color: #111827; color: white; text-decoration: none; border-radius: 6px;">
          Verificar cuenta
        </a>
      </div>

      <p>O copiá este enlace en tu navegador:</p>
      <p style="font-size: 14px; word-break: break-all;"><a href="${url}">${url}</a></p>

      <p style="font-size: 12px; color: #999;">Si no fuiste vos, podés ignorar este correo.</p>
    </div>
  `,
  });
}

export async function sendResetPasswordEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}&email=${email}`;

  await resend.emails.send({
    from: 'Simpla <no-reply@simplar.com.ar>',
    to: email,
    subject: 'Restablecé tu contraseña de Simpla',
    html: `
      <div style="max-width: 480px; margin: auto; padding: 20px; background-color: #fff; color: #111; font-family: 'Geist', sans-serif;">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Geist&family=Lora:ital,wght@0,400;0,700;1,400&display=swap');
          h1, h2, .brand {
            font-family: 'Lora', serif !important;
          }
          body, p, a, div, span {
            font-family: 'Geist', sans-serif !important;
          }
        </style>

        <div style="text-align: center; margin-bottom: 24px;">
          <img
            src="https://www.simplar.com.ar/images/estampa.png"
            alt="Simpla"
            width="96"
            style="display: block; margin: 0 auto 12px;"
          />
          <h1 class="brand" style="margin: 0; font-size: 24px;">SIMPLA</h1>
        </div>

        <h2 style="text-align: center; font-size: 20px;">Restablecer tu contraseña</h2>

        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Simpla</strong>.</p>
        <p>Hacé click en el botón de abajo para establecer una nueva contraseña:</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${url}" style="display: inline-block; padding: 12px 20px; background-color: #111827; color: white; text-decoration: none; border-radius: 6px;">
            Cambiar contraseña
          </a>
        </div>

        <p>Si no realizaste esta solicitud, podés ignorar este mensaje.</p>
        <p style="font-size: 14px; color: #555;">También podés copiar y pegar este enlace en tu navegador:</p>
        <p style="font-size: 14px; color: #555; word-break: break-all;"><a href="${url}">${url}</a></p>
      </div>
    `,
  });
}
