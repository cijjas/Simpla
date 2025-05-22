'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignupFormSchema } from '@/features/auth/utils/validation';
import { generateToken, sendVerificationEmail } from './email';
import { signIn } from 'next-auth/react';

export async function signup(_: any, formData: FormData) {
  const parsed = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      errors: { email: ['El correo ya está registrado.'] },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
    },
  });

  if (process.env.EMAIL_VERIFICATION_DISABLED === 'true') {
    await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    return { redirect: '/inicio' };
  }

  const { raw, hash } = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hash,
      expires: new Date(Date.now() + 86400000),
    },
  });
  await sendVerificationEmail({ email, token: raw });

  return { redirect: `/verify?email=${encodeURIComponent(email)}` };
}
