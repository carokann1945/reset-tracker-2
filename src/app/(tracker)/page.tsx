import { Metadata } from 'next';
import TrackerShell from '@/features/tracker/components/TrackerShell';

export const metadata: Metadata = {
  title: 'Carokann',
  description:
    '탭별로 루틴과 반복 작업을 정리하고, 매일·매주·매월·매년 혹은 커스텀 주기에 맞춰 자동으로 다시 시작하는 개인용 작업 리셋 트래커.',
  keywords: [
    'Carokann',
    '루틴 관리',
    '반복 작업',
    '작업 트래커',
    '체크리스트',
    '습관 관리',
    '일정 리셋',
    '루틴 앱',
    '개인 생산성',
    '반복 체크리스트',
    '숙제 관리',
    '게임 숙제 관리',
    '투두리스트',
  ],

  // 2. 오픈 그래프 (Facebook, 카카오톡, Discord 등 공유 시)
  openGraph: {
    title: 'Carokann',
    description:
      '반복 작업을 탭별로 나누고, 매일·매주·매월 주기에 맞춰 자동으로 리셋하며 관리할 수 있는 개인용 작업 트래커입니다.',
    images: ['/images/metaImage.png'],
  },

  // 3. 트위터(X) 카드 설정
  twitter: {
    card: 'summary_large_image',
    title: 'Carokann',
    description:
      '반복 작업을 탭별로 나누고, 매일·매주·매월 주기에 맞춰 자동으로 리셋하며 관리할 수 있는 개인용 작업 트래커입니다.',
    images: ['/images/metaImage.png'],
  },

  // 4. 기타 설정 (파비콘, 로봇 설정 등)
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <>
      <TrackerShell />
    </>
  );
}
