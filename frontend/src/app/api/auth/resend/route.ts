import { prisma } from '@/lib/prisma';
import {
  generateToken,
  sendVerificationEmail,
} from '@/features/auth/utils/email';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get('email');
  if (!email)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) {
    return NextResponse.redirect('/iniciar-sesion');
  }

  /* wipe previous tokens */
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const { raw, hash } = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hash,
      expires: new Date(Date.now() + 86400000),
    },
  });
  await sendVerificationEmail({ email, token: raw });

  return NextResponse.redirect(
    `${
      process.env.NEXT_PUBLIC_SITE_URL
    }/verificar?success=true&email=${encodeURIComponent(email)}`,
  );
}
