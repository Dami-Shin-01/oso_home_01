'use client'

import { useState } from 'react';

export default function VideoPlayButton() {
  const [isPlaying, setIsPlaying] = useState(true);

  const handleVideoToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const video = e.currentTarget.parentElement?.querySelector('video');
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <button
      className="absolute top-4 right-4 z-30 btn btn-circle btn-ghost text-white opacity-50 hover:opacity-100 hidden md:flex"
      onClick={handleVideoToggle}
      aria-label="영상 재생/일시정지"
    >
      {isPlaying ? '⏸️' : '▶️'}
    </button>
  );
}