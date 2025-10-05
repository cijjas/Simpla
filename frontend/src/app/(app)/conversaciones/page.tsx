'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new conversation
    router.replace('/conversaciones/new');
  }, [router]);

  return null;
}
