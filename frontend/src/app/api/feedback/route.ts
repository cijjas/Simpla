import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY ?? '');

async function trySendEmail(
  options: Parameters<typeof resend.emails.send>[0],
  retries = 3,
): Promise<ReturnType<typeof resend.emails.send>> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await resend.emails.send(options);
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt} to send feedback email failed.`, err);

      if (attempt < retries) {
        await new Promise(res => setTimeout(res, 500)); // small delay between attempts
      }
    }
  }

  throw lastError;
}

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
        { error: 'Missing or empty FEEDBACK_EMAILS environment variable' },
        { status: 500 },
      );
    }

    const response = await trySendEmail({
      from: `Feedback <${process.env.EMAIL_FROM!}>`,
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
