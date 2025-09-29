'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { getResponsiveImageUrl } from '@/lib/image-utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  placeholder?: 'blur' | 'empty';
}

// 스켈레톤 로더 컴포넌트
function ImageSkeleton() {
  return (
    <div className="animate-pulse bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-gray-400">📸</div>
    </div>
  );
}

// 이미지 에러 상태 컴포넌트
function ImageError() {
  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-2xl mb-1">🖼️</div>
        <span className="text-xs">이미지 로딩 실패</span>
      </div>
    </div>
  );
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes = '100vw',
  className = '',
  placeholder = 'empty'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 이미지 URL 최적화 (반응형 크기 적용)
  const optimizedSrc = getResponsiveImageUrl(src, 
    width && width < 400 ? 'small' : 
    width && width < 800 ? 'medium' : 'large'
  );

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // 에러 발생 시 기본 이미지 표시
  if (hasError) {
    return <ImageError />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 로딩 상태 */}
      {isLoading && (
        <ImageSkeleton />
      )}

      {/* 실제 이미지 */}
      <Suspense fallback={<ImageSkeleton />}>
        <Image
          src={optimizedSrc || src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          quality={85}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
        />
      </Suspense>
    </div>
  );
}
