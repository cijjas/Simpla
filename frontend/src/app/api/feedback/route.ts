import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY ?? '');

export async function POST(req: Request) {
  try {
    const { message = '', origin = 'webapp' } = await req.json();

    if (message.trim().length < 3) {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
    }

    const feedbackEmail = process.env.FEEDBACK_EMAIL;
    const domain = process.env.DOMAIN;

    if (!feedbackEmail || !domain) {
      const missing = !feedbackEmail ? 'FEEDBACK_EMAIL' : 'DOMAIN';
      return NextResponse.json(
        { error: `Missing env var: ${missing}` },
        { status: 500 },
      );
    }

    const response = await resend.emails.send({
      from: `Feedback <feedback@${domain}>`,
      to: feedbackEmail,
      subject: `Nuevo feedback (${origin})`,
      text: message,
    });

    console.log('📨 Resend API response:', response);

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[Resend error]', error);

    const maybeResendError = error as { response?: Response };
    if (maybeResendError?.response) {
      try {
        const data = await maybeResendError.response.json();
        console.error('[Resend error details]', data);
        return NextResponse.json(data, { status: 500 });
      } catch (parseError) {
        console.error('[Resend response parse error]', parseError);
      }
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 },
    );
  }
}
