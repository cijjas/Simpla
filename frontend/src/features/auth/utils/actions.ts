'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignupFormSchema } from '@/features/auth/utils/validation';
import { generateToken, sendVerificationEmail } from './email';

export async function signup(_: unknown, formData: FormData) {
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
    return {
      redirect:
        '/iniciar-sesion?autoLogin=true&email=' + encodeURIComponent(email),
    };
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

  return { redirect: `/verificar?email=${encodeURIComponent(email)}` };
}
