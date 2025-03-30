
import { useState, useEffect, useRef } from 'react';

interface UseYouTubePlayerProps {
  videoId: string | null;
  isPlaying: boolean;
}

export const useYouTubePlayer = ({ videoId, isPlaying }: UseYouTubePlayerProps) => {
  const [player, setPlayer] = useState<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const playerElementId = 'youtube-player';

  // Initialize YouTube API
  useEffect(() => {
    // Create player container if it doesn't exist
    if (!document.getElementById(playerElementId)) {
      const playerContainer = document.createElement('div');
      playerContainer.id = playerElementId;
      playerContainer.style.display = 'none';
      document.body.appendChild(playerContainer);
    }

    if (!window.YT) {
      // Load YouTube API if not already loaded
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else if (window.YT.Player) {
      // If API is already loaded, initialize player
      initializePlayer();
    }

    return () => {
      if (player) {
        player.destroy();
      }
      
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const initializePlayer = () => {
    console.info('Initializing YouTube player');
    const newPlayer = new window.YT.Player(playerElementId, {
      height: '0',
      width: '0',
      videoId: videoId || undefined,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
    
    setPlayer(newPlayer);
  };

  const onPlayerReady = (event: { target: YT.Player }) => {
    console.info('YouTube player ready');
    setIsReady(true);
    setVolumeState(event.target.getVolume());
    setIsMuted(event.target.isMuted());
  };

  const onPlayerStateChange = (event: { target: YT.Player; data: number }) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setDuration(event.target.getDuration());
      
      // Start tracking current time
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      
      intervalRef.current = window.setInterval(() => {
        setCurrentTime(event.target.getCurrentTime());
      }, 1000);
    } else if (event.data === window.YT.PlayerState.PAUSED || 
              event.data === window.YT.PlayerState.ENDED) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  // Handle video ID changes
  useEffect(() => {
    if (isReady && player && videoId) {
      player.loadVideoById(videoId);
      if (!isPlaying) {
        player.pauseVideo();
      }
    }
  }, [isReady, videoId, player]);

  // Handle play/pause
  useEffect(() => {
    if (isReady && player && videoId) {
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }, [isReady, isPlaying, player, videoId]);

  const seekTo = (seconds: number) => {
    if (player && isReady) {
      player.seekTo(seconds, true);
    }
  };

  const setVolume = (newVolume: number) => {
    if (player && isReady) {
      player.setVolume(newVolume);
      setVolumeState(newVolume);
      
      if (newVolume === 0) {
        player.mute();
        setIsMuted(true);
      } else if (isMuted) {
        player.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (player && isReady) {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    }
  };

  return {
    currentTime,
    duration,
    volume,
    isMuted,
    isReady,
    setVolume,
    toggleMute,
    seekTo,
  };
};
