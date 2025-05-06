import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lora } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import { ThemeProvider } from 'next-themes';
import { Footer } from '@/components/layout/Footer';
import { FeedbackContact } from '@/features/feedback/FeedbackContact';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const loraSerif = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='es' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${loraSerif.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <Header />
          <main className='flex-1'>{children}</main>
          <Footer />
          <FeedbackContact />
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
