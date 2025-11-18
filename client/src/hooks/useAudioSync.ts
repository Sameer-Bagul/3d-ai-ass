import { useState, useCallback, useRef } from 'react';
import { playAudio, stopAudio, getCurrentTime } from '../lib/audioPlayer';
import AvatarController from '../components/AvatarController';

interface PhonemeTimeline {
  phoneme: string;
  start: number;
  end: number;
}

export function useAudioSync(avatarController: AvatarController | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioStartTime, setAudioStartTime] = useState(0);
  const animationFrameRef = useRef<number>();

  const playWithSync = useCallback(async (
    audioUrl: string,
    phonemeTimeline: PhonemeTimeline[]
  ) => {
    if (!avatarController) {
      console.warn('Avatar controller not ready');
      return;
    }

    try {
      const startTime = await playAudio(audioUrl);
      setAudioStartTime(startTime);
      setIsPlaying(true);

      avatarController.applyPhonemeTimeline(phonemeTimeline, startTime);

      console.log(`🎵 Audio sync started at ${startTime}`);
    } catch (error) {
      console.error('Failed to play audio with sync:', error);
      setIsPlaying(false);
    }
  }, [avatarController]);

  const stop = useCallback(() => {
    stopAudio();
    setIsPlaying(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (avatarController) {
      avatarController.reset();
    }
  }, [avatarController]);

  return {
    isPlaying,
    audioStartTime,
    playWithSync,
    stop
  };
}
