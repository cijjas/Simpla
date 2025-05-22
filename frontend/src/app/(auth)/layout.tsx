import { auth } from '@/features/auth/utils';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session) redirect('/inicio');

  return <main>{children}</main>;
}
