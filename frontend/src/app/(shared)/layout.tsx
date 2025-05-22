import { auth } from '@/features/auth/utils';
import AppLayout from '../(app)/layout';
import PublicLayout from '../(public)/layout';

export default async function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) {
    return <AppLayout>{children}</AppLayout>;
  }

  return <PublicLayout>{children}</PublicLayout>;
}
