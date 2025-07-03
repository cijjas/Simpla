import AuthLayout from '@/features/auth/components/auth-layout';
import { SignupForm } from '@/features/auth/components/signup-form';

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
