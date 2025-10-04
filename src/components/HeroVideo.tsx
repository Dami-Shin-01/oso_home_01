'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getHeroVideoUrls, getHeroPosterUrl, checkVideoExists } from '@/lib/video-utils';

interface HeroVideoProps {
  /** 비디오 기본 파일명 (확장자 제외, 기본값: hero-video) */
  baseName?: string;
  /** 포스터 이미지 경로 (기본값: /images/hero-poster.jpg) */
  posterUrl?: string;
  /** 비디오가 없을 때 표시할 클래스 */
  className?: string;
}

/**
 * Hero Video 컴포넌트
 * - Supabase Storage에서 영상을 불러옴
 * - 영상이 없으면 자동으로 포스터 이미지 표시
 * - MP4, WebM 포맷 자동 지원
 */
export default function HeroVideo({
  baseName = 'hero-video',
  posterUrl,
  className = ''
}: HeroVideoProps) {
  const [hasVideo, setHasVideo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const videoUrls = getHeroVideoUrls(baseName);
  const poster = posterUrl || getHeroPosterUrl();

  useEffect(() => {
    // 영상 존재 여부 확인
    const checkVideo = async () => {
      setIsLoading(true);

      // MP4 먼저 확인
      const mp4Exists = await checkVideoExists(videoUrls.mp4);

      if (mp4Exists) {
        setHasVideo(true);
      } else {
        // WebM 확인
        const webmExists = await checkVideoExists(videoUrls.webm);
        setHasVideo(webmExists);
      }

      setIsLoading(false);
    };

    checkVideo();
  }, [videoUrls.mp4, videoUrls.webm]);

  // 로딩 중이거나 영상이 없으면 포스터 이미지 표시
  if (isLoading || !hasVideo) {
    return (
      <div className={`absolute inset-0 w-full h-full ${className}`} suppressHydrationWarning>
        <Image
          src={poster}
          alt="BBQ 히어로 이미지"
          fill
          className="object-cover"
          priority
          quality={90}
        />
      </div>
    );
  }

  // 영상이 있으면 video 태그 표시
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className={`absolute inset-0 w-full h-full object-cover z-0 ${className}`}
      poster={poster}
    >
      {videoUrls.mp4 && (
        <source src={videoUrls.mp4} type="video/mp4" />
      )}
      {videoUrls.webm && (
        <source src={videoUrls.webm} type="video/webm" />
      )}
      {/* Fallback: 비디오를 지원하지 않는 브라우저 */}
      <Image
        src={poster}
        alt="BBQ 히어로 이미지"
        fill
        className="object-cover"
        priority
        quality={90}
      />
    </video>
  );
}
