import { prisma } from '@/lib/prisma';
import { generateToken, sendResetPasswordEmail } from '@/lib/auth/email';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.emailVerified) {
    return NextResponse.json({}, { status: 200 }); // don’t reveal if email exists
  }

  const { raw, hash } = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hash,
      expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    },
  });

  await sendResetPasswordEmail({ email, token: raw });

  return NextResponse.json({ success: true });
}
