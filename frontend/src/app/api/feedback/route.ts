import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY ?? '');

export async function POST(req: Request) {
  try {
    const { message = '', origin = 'webapp' } = await req.json();

    if (message.trim().length < 3) {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
    }
    const feedbackEmails = process.env.FEEDBACK_EMAILS?.split(',').map(email =>
      email.trim(),
    );

    if (!feedbackEmails || feedbackEmails.length === 0) {
      return NextResponse.json(
        { error: `Missing env var: FEEDBACK_EMAILS` },
        { status: 500 },
      );
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
      to: feedbackEmails,
      subject: `Nuevo feedback (${origin})`,
      text: message,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    const maybeResendError = error as { response?: Response };
    if (maybeResendError?.response) {
      try {
        const data = await maybeResendError.response.json();
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
