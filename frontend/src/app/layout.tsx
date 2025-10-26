// app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lora } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/features/auth/context/auth-context';
import { Analytics } from '@vercel/analytics/react';
import { CommandProvider } from '@/features/command-center/context/command-provider';
import { Toaster } from '@/components/ui/sonner';

// ⟵ fonts
const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});
const loraSerif = Lora({ subsets: ['latin'], variable: '--font-lora' });

export const metadata: Metadata = {
  title: 'Simpla',
  description:
    'Simpla te permite buscar, entender y compartir normas jurídicas argentinas de forma rápida y clara.',
  metadataBase: new URL('https://www.simplalegal.com'),
  openGraph: {
    title: 'Simpla — Una manera simple de navegar las leyes.',
    description:
      'Simpla te permite buscar, entender y compartir normas jurídicas argentinas de forma rápida y clara.',
    url: '/',
    siteName: 'Simpla',
    images: [
      {
        url: 'https://www.simplalegal.com/images/preview.png',
        width: 1200,
        height: 630,
        alt: 'Vista previa de Simpla',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simpla — Una manera simple de navegar las leyes.',
    description:
      'Simpla te permite buscar, entender y compartir normas jurídicas argentinas de forma rápida y clara.',
    images: ['https://www.simplalegal.com/images/preview.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='es' suppressHydrationWarning>
      <head>
        {/* Force light mode on initial load for public pages */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Only force light mode if no theme is explicitly stored (public pages)
                const storedTheme = localStorage.getItem('theme');
                if (!storedTheme) {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${loraSerif.variable} min-h-screen flex flex-col antialiased`}
      >
        <AuthProvider>
          <CommandProvider>{children}</CommandProvider>
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
