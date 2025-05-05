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
  description: 'El lugar donde entendés todo.',
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
