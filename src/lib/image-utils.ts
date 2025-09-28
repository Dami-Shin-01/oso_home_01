/**
 * Supabase Storage 이미지 URL 생성 유틸리티
 */

export function getSupabaseImageUrl(imagePath: string, bucket: string = 'facility-images'): string | null {
  if (!imagePath) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

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

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${imagePath}`;
}

export function getFacilityImageUrl(imagePath: string): string | null {
  if (!imagePath) return null;

  // 정적 파일 경로 처리 (/images/로 시작하는 경우)
  if (imagePath.startsWith('/images/')) {
    // 정적 이미지의 경우 그대로 반환하되, 실제 접근 가능성은 클라이언트에서 처리
    return imagePath;
  }

  // Supabase Storage 경로 처리
  return getSupabaseImageUrl(imagePath, 'facility-images');
}

/**
 * 이미지 배열에서 대표 이미지 URL 가져오기
 */
export function getFeaturedImageUrl(images: string[] | null | undefined): string | null {
  if (!images || images.length === 0) return null;
  return getFacilityImageUrl(images[0]);
}

/**
 * 이미지 배열에서 모든 유효한 이미지 URL 가져오기
 */
export function getAllImageUrls(images: string[] | null | undefined): string[] {
  if (!images || images.length === 0) return [];

  return images
    .map(imagePath => getFacilityImageUrl(imagePath))
    .filter((url): url is string => url !== null);
}