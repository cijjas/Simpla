// src/components/auth/AuthLayout.tsx
import SvgEstampa from '@/../public/svgs/estampa.svg';
import Link from 'next/link';
import SvgLogin from '@/../public/svgs/login.svg';
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-svh overflow-hidden lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <SvgEstampa className="h-[2.3rem] w-auto" fill="currentColor" />
            <span className="font-serif text-3xl font-bold">SIMPLA</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block overflow-hidden">
        <SvgLogin 
          className="absolute inset-0 w-full h-full" 
          fill="currentColor"
          preserveAspectRatio="xMidYMid slice"
        />
      </div>
    </div>
  );
}