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