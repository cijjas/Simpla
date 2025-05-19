import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, token, password } = await req.json();
  if (!email || !token || !password) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  const hash = createHash('sha256').update(token).digest('hex');

  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email,
        token: hash,
      },
    },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { hashedPassword: await bcrypt.hash(password, 12) },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: hash,
        },
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
