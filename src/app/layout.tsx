import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from 'sonner';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
});

export const metadata: Metadata = {
  title: 'Reset Tracker2',
  description: '리팩토링',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${geist.variable}`}>
      <body className="antialiased bg-silver-custom">
        {children}
        <Toaster position="bottom-left" richColors />
      </body>
    </html>
  );
}
