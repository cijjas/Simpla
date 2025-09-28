'use client';
import { Suspense } from 'react';
import VerifyPage from '@/features/auth/components/verify-page';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPage />
    </Suspense>
  );
}
