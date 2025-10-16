// app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lora } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/features/auth/context/auth-context';
import { ThemeProvider } from 'next-themes';
import { Analytics } from '@vercel/analytics/react';
import { CommandProvider } from '@/features/command-center/context/command-provider';

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
  metadataBase: new URL('https://www.simplar.com.ar'),
  openGraph: {
    title: 'Simpla — Una manera simple de navegar las leyes.',
    description:
      'Simpla te permite buscar, entender y compartir normas jurídicas argentinas de forma rápida y clara.',
    url: '/',
    siteName: 'Simpla',
    images: [
      {
        url: 'https://www.simplar.com.ar/images/preview.png',
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
    images: ['https://www.simplar.com.ar/images/preview.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='es' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${loraSerif.variable} min-h-screen flex flex-col antialiased`}
      >
        <AuthProvider>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <CommandProvider>
              {children}
            </CommandProvider>
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
