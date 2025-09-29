/**
 * Supabase Storage 이미지 URL 생성 유틸리티
 * 성능 최적화 버전
 */

// 이미지 최적화 설정
const IMAGE_OPTIMIZATION_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  bucket: 'facility-images',
  // 반응형 이미지 크기 정의
  sizes: {
    thumb: 'w=200,h=150',
    small: 'w=400,h=300', 
    medium: 'w=800,h=600',
    large: 'w=1200,h=900'
  },
  // 이미지 품질 설정
  quality: 85,
  q_auto: 'good'
};

export function getSupabaseImageUrl(imagePath: string, bucket: string = IMAGE_OPTIMIZATION_CONFIG.bucket): string | null {
  if (!imagePath) return null;

  const { supabaseUrl, sizes, quality } = IMAGE_OPTIMIZATION_CONFIG;

  if (!supabaseUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not defined');
    }
    return null;
  }

  try {
    // URL 검증
    new URL(supabaseUrl);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Invalid NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
    }
    return null;
  }

  // 쿼리 변수를 사용한 이미지 최적화
  const optimizedParams = new URLSearchParams({
    width: 'auto',
    quality: quality.toString(),
    format: 'webp'
  });

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${imagePath}?${optimizedParams.toString()}`;
}

/**
 * 반응형 이미지 URL 생성
 */
export function getResponsiveImageUrl(imagePath: string, size: 'thumb' | 'small' | 'medium' | 'large' = 'medium'): string | null {
  if (!imagePath) return null;

  const supabaseUrl = IMAGE_OPTIMIZATION_CONFIG.supabaseUrl;
  const bucket = IMAGE_OPTIMIZATION_CONFIG.bucket;

  if (!supabaseUrl) return null;

  // Supabase Transform을 사용한 이미지 최적화
  const params = new URLSearchParams({
    width: size === 'thumb' ? '200' : size === 'small' ? '400' : size === 'medium' ? '800' : '1200',
    quality: '85',
    format: 'webp'
  });

  try {
    return `${supabaseUrl}/storage/v1/object/sign/${bucket}/${imagePath}?${params.toString()}`;
  } catch (error) {
    console.error('Error generating responsive image URL:', error);
    return getSupabaseImageUrl(imagePath);
  }
}

export function getFacilityImageUrl(imagePath: string): string | null {
  if (!imagePath) return null;

  // 정적 파일 경로 처리 (/images/로 시작하는 경우)
  if (imagePath.startsWith('/images/')) {
    return imagePath;
  }

  // Supabase Storage 경로 처리 (최적화 버전 사용)
  return getSupabaseImageUrl(imagePath, IMAGE_OPTIMIZATION_CONFIG.bucket);
}

/**
 * 이미지 배열에서 대표 이미지 URL 가져오기 (최적화 버전)
 */
export function getFeaturedImageUrl(images: string[] | null | undefined, size: 'thumb' | 'small' | 'medium' | 'large' = 'medium'): string | null {
  if (!images || images.length === 0) return null;

  // 대표 이미지를 반응형으로 반환
  const firstImage = images[0];
  
  // 정적 이미지인 경우 그대로 반환
  if (firstImage.startsWith('/images/')) {
    return firstImage;
  }

  // Supabase 이미지는 최적화된 버전 반환
  return getResponsiveImageUrl(firstImage, size);
}

/**
 * 이미지 배열에서 모든 유효한 이미지 URL 가져오기 (최적화 버전)
 */
export function getAllImageUrls(images: string[] | null | undefined, size: 'thumb' | 'small' | 'medium' | 'large' = 'small'): string[] {
  if (!images || images.length === 0) return [];

  return images
    .map(imagePath => {
      if (imagePath.startsWith('/images/')) {
        return imagePath; // 정적 이미지는 그대로 반환
      }
      return getResponsiveImageUrl(imagePath, size);
    })
    .filter((url): url is string => url !== null);
}

/**
 * 이미지 로딩 최적화를 위한 preload URL 생성
 */
export function getPreloadImageUrls(images: string[] | null | undefined): string[] {
  if (!images || images.length === 0) return [];

  // 가장 중요한 이미지들만 preload
  return images
    .slice(0, 3) // 최대 3개까지만 preload
    .map(imagePath => getResponsiveImageUrl(imagePath, 'small'))
    .filter((url): url is string => url !== null);
}

/**
 * 이미지 캐시 키 생성
 */
export function generateImageCacheKey(imagePath: string, size: string): string {
  return `img_${size}_${imagePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

/**
 * 이미지 타입 감지
 */
export function getImageType(imagePath: string): 'static' | 'supabase' | 'unknown' {
  if (!imagePath) return 'unknown';
  
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/public/')) {
    return 'static';
  }
  
  if (imagePath.includes('supabase') || imagePath.includes('storage')) {
    return 'supabase';
  }
  
  return 'unknown';
}