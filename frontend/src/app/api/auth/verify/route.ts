import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  if (!token || !email)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const hash = createHash('sha256').update(token).digest('hex');
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: hash } },
  });
  if (!record || record.expires < new Date()) {
    return NextResponse.redirect('/login?error=ExpiredToken');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: hash } },
    }),
  ]);

  return NextResponse.redirect(
    `${
      process.env.NEXT_PUBLIC_SITE_URL
    }/verify?success=true&email=${encodeURIComponent(email)}`,
  );
}
