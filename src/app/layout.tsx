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
  title: 'Carokann',
  description:
    '탭별로 루틴과 반복 작업을 정리하고, 매일·매주·매월·매년 혹은 커스텀 주기에 맞춰 자동으로 다시 시작하는 개인용 작업 리셋 트래커.',
  verification: {
    google: 'KjPEoW3dDAV__bk3baW6Zb8lZW81wimVzu5tDiJL2Hc',
    other: {
      'naver-site-verification': '5587d60ce0f399389f76d05db48c693390fa770e',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${geist.variable}`}>
      <body className="antialiased bg-custom-main-bg">
        {children}
        <Toaster position="bottom-left" richColors />
      </body>
    </html>
  );
}
