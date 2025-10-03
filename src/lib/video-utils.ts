/**
 * Supabase Storage 영상 URL 생성 유틸리티
 * Hero Video 관리 및 URL 생성
 */

const VIDEO_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  bucket: 'hero-videos',
  defaultVideoName: 'hero-video.mp4',
  fallbackPoster: '/images/hero-poster.jpg'
};

/**
 * Hero 영상 URL 가져오기
 * @param videoName - 영상 파일명 (기본값: hero-video.mp4)
 * @returns 영상 URL 또는 null
 */
export function getHeroVideoUrl(videoName: string = VIDEO_CONFIG.defaultVideoName): string | null {
  const { supabaseUrl, bucket } = VIDEO_CONFIG;

  if (!supabaseUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not defined');
    }
    return null;
  }

  if (!videoName) {
    return null;
  }

  try {
    // URL 검증
    new URL(supabaseUrl);
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${videoName}`;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Invalid NEXT_PUBLIC_SUPABASE_URL or video name:', supabaseUrl, videoName);
    }
    return null;
  }
}

/**
 * Hero 영상 여러 포맷 URL 가져오기 (MP4, WebM)
 * @param baseName - 기본 파일명 (확장자 제외, 기본값: hero-video)
 * @returns 포맷별 URL 객체
 */
export function getHeroVideoUrls(baseName: string = 'hero-video'): {
  mp4: string | null;
  webm: string | null;
} {
  return {
    mp4: getHeroVideoUrl(`${baseName}.mp4`),
    webm: getHeroVideoUrl(`${baseName}.webm`)
  };
}

/**
 * Hero 영상 존재 여부 확인 (클라이언트 측)
 * @param videoUrl - 확인할 영상 URL
 * @returns Promise<boolean>
 */
export async function checkVideoExists(videoUrl: string | null): Promise<boolean> {
  if (!videoUrl) return false;

  try {
    const response = await fetch(videoUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error checking video existence:', error);
    }
    return false;
  }
}

/**
 * Fallback 포스터 이미지 URL 가져오기
 * @returns 포스터 이미지 URL
 */
export function getHeroPosterUrl(): string {
  return VIDEO_CONFIG.fallbackPoster;
}

/**
 * 영상 타입 감지
 * @param filename - 파일명
 * @returns video MIME type 또는 null
 */
export function getVideoMimeType(filename: string): string | null {
  if (!filename) return null;

  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    default:
      return null;
  }
}

/**
 * 영상 파일 크기 검증
 * @param fileSize - 파일 크기 (bytes)
 * @param maxSizeMB - 최대 허용 크기 (MB, 기본값: 100)
 * @returns 유효성 여부
 */
export function validateVideoFileSize(fileSize: number, maxSizeMB: number = 100): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize > 0 && fileSize <= maxSizeBytes;
}

/**
 * 영상 파일 확장자 검증
 * @param filename - 파일명
 * @returns 유효성 여부
 */
export function validateVideoFileType(filename: string): boolean {
  const allowedExtensions = ['mp4', 'webm', 'mov'];
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
}

/**
 * 영상 업로드 경로 생성
 * @param filename - 원본 파일명
 * @returns 저장할 경로
 */
export function generateVideoUploadPath(filename: string): string {
  // 간단한 파일명 유지 (타임스탬프 추가하지 않음 - 항상 hero-video로 교체)
  const extension = filename.split('.').pop()?.toLowerCase();
  return `hero-video.${extension}`;
}

/**
 * 영상 URL 캐시 키 생성
 * @param videoName - 영상 파일명
 * @returns 캐시 키
 */
export function generateVideoCacheKey(videoName: string): string {
  return `hero_video_${videoName.replace(/[^a-zA-Z0-9]/g, '_')}`;
}
