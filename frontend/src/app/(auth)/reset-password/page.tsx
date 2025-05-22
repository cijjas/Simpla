import AuthLayout from '@/features/auth/components/auth-layout';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
