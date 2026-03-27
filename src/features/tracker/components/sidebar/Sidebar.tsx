import { CircleUser, LogIn, LogOut, FolderOpen } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProfile } from '@/actions/profile.actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../../model/sidebarStore';
import TabButton from './TabButton';
import TabList from './TabList';

export default function Sidebar() {
  const isOpen = useSidebarStore((store) => store.isOpen);
  const router = useRouter();
  const isMounted = useSidebarStore((store) => store.isMounted);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getProfile>>>(null);

  const finishClosing = useSidebarStore((store) => store.finishClosing);

  const handleSignOut = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('로그아웃 실패:', error);
      return;
    }

    setProfile(null);
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  return (
    <aside
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (!isOpen) finishClosing();
      }}
      className={cn(
        'z-20 w-[300px] h-dvh',
        'flex flex-col',
        'fixed top-0 left-0',
        'bg-[#faf9f4] text-custom-black border-r border-gray-300',
        isMounted ? 'transition-transform duration-300' : 'transition-none',
        isMounted ? (isOpen ? 'translate-x-0' : '-translate-x-full') : '-translate-x-full md:translate-x-0',
      )}>
      {/* 사이트 로고 */}
      <div className={cn('w-full h-[40px]', 'flex justify-between items-center', 'mb-[30px] px-[15px] py-[25px]')}>
        <div
          className={cn('w-[120px]', 'flex items-center gap-[8px]', 'cursor-pointer')}
          onClick={() => window.location.reload()}>
          <h1 className={cn('typo-second')}>Carokann</h1>
        </div>
      </div>
      {/* 탭 추가 */}
      <div className={cn('w-full max-w-[299px] min-h-0', 'flex flex-col flex-1', 'pl-[10px]')}>
        <div
          className={cn(
            'w-full max-w-[275px]',
            'flex justify-between items-center',
            'px-[5px] py-[5px] mb-[8px] rounded-lg hover:bg-custom-sidebar-hover',
          )}>
          <div className={cn('flex gap-[8px] items-center', 'text-custom-black-light')}>
            <FolderOpen className={cn('w-[20px] h-[20px]')} />
            <p className={cn('typo-common')}>탭 목록</p>
          </div>
          <TabButton />
        </div>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <TabList />
          </ScrollArea>
        </div>
      </div>

      {/* 로그인 정보 */}
      <div
        className={cn(
          'w-full h-[64px]',
          'flex justify-between items-center',
          'border-t border-gray-300 shrink-0 px-[15px]',
        )}>
        <div className={cn('flex gap-[8px] items-center')}>
          {profile ? (
            <>
              <figure className={cn('relative w-[40px] h-[40px] rounded-full overflow-hidden')}>
                <Image
                  src={profile.avatarUrl}
                  alt="profile image"
                  sizes="40px"
                  fill
                  priority
                  className="object-cover"
                />
              </figure>
            </>
          ) : (
            <figure className={cn('relative w-[40px] h-[40px] rounded-full overflow-hidden')}>
              <CircleUser className={cn('w-[40px] h-[40px] text-custom-black-light')} />
            </figure>
          )}

          <div className={cn('flex flex-col gap-[6px]', 'typo-common text-custom-black-light')}>
            {profile ? (
              <>
                <span className={cn('text-[14px]')}>{profile.name ?? profile.email}</span>
                <span className={cn('text-[12px] text-gray-400')}>{profile.plan ?? 'free'}</span>
              </>
            ) : (
              <>
                <span className={cn('text-[14px]')}>비로그인 상태</span>
                <span className={cn('text-[12px] text-gray-400')}>free</span>
              </>
            )}
          </div>
        </div>
        {profile ? (
          // 로그아웃 버튼
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              'cursor-pointer w-[30px] h-[30px]',
              'flex justify-center items-center',
              'hover:bg-custom-sidebar-hover rounded-lg',
            )}>
            <LogOut className={cn('w-[20px] h-[20px] text-custom-black-light')} />
          </button>
        ) : (
          // 로그인 버튼
          <div
            onClick={() => router.push('/login')}
            className={cn(
              'cursor-pointer w-[30px] h-[30px]',
              'flex justify-center items-center',
              'hover:bg-custom-sidebar-hover rounded-lg',
            )}>
            <LogIn className={cn('w-[20px] h-[20px] text-custom-black-light')} />
          </div>
        )}
      </div>
    </aside>
  );
}
