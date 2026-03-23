import { useRef, useEffect } from 'react';

export function useSoundEffect(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(src);
  }, [src]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  return play;
}
