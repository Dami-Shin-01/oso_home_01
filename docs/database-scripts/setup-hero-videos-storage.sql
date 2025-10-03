-- =====================================================
-- Supabase Storage 설정 스크립트 - Hero Videos
-- 메인 페이지 히어로 영상 업로드 및 관리를 위한 Storage 설정
-- =====================================================

-- 1. hero-videos 버킷 생성 안내
-- Supabase 대시보드 → Storage → New Bucket
-- 버킷명: hero-videos
-- Public: true (모든 사용자가 영상 조회 가능)
-- File Size Limit: 100MB
-- Allowed MIME Types: video/mp4, video/webm, video/quicktime

-- 2. Storage RLS 정책 설정
-- storage.objects 테이블에 대한 정책 생성

-- 관리자만 영상 업로드 가능
CREATE POLICY "Admin can upload hero videos" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hero-videos' AND
  (auth.jwt() ->> 'role' = 'ADMIN' OR auth.jwt() ->> 'role' = 'MANAGER')
);

-- 관리자만 영상 수정 가능
CREATE POLICY "Admin can update hero videos" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'hero-videos' AND
  (auth.jwt() ->> 'role' = 'ADMIN' OR auth.jwt() ->> 'role' = 'MANAGER')
)
WITH CHECK (
  bucket_id = 'hero-videos' AND
  (auth.jwt() ->> 'role' = 'ADMIN' OR auth.jwt() ->> 'role' = 'MANAGER')
);

-- 관리자만 영상 삭제 가능
CREATE POLICY "Admin can delete hero videos" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hero-videos' AND
  (auth.jwt() ->> 'role' = 'ADMIN' OR auth.jwt() ->> 'role' = 'MANAGER')
);

-- 모든 사용자가 영상 조회 가능 (Public 읽기)
CREATE POLICY "Anyone can view hero videos" ON storage.objects
FOR SELECT
USING (bucket_id = 'hero-videos');

-- 3. 영상 URL 헬퍼 함수 생성
CREATE OR REPLACE FUNCTION get_hero_video_url(video_path TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT
        CASE
            WHEN video_path IS NULL OR video_path = '' THEN NULL
            ELSE 'https://nrblnfmknolgsqpcqite.supabase.co/storage/v1/object/public/hero-videos/' || video_path
        END;
$$;

-- 4. 영상 파일 존재 확인 함수
CREATE OR REPLACE FUNCTION hero_video_exists()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM storage.objects
        WHERE bucket_id = 'hero-videos'
        AND name LIKE '%.mp4' OR name LIKE '%.webm' OR name LIKE '%.mov'
    );
$$;

-- 5. 영상 업로드 감사 로그 테이블 생성
CREATE TABLE IF NOT EXISTS hero_video_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_path TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('upload', 'delete', 'replace')),
    file_size BIGINT,
    mime_type TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE hero_video_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 로그 조회 가능
CREATE POLICY "Admin can view video logs" ON hero_video_logs
FOR SELECT USING (auth.jwt() ->> 'role' IN ('ADMIN', 'MANAGER'));

-- 로그 삽입은 시스템에서만 수행
CREATE POLICY "System can insert video logs" ON hero_video_logs
FOR INSERT WITH CHECK (true);

-- =====================================================
-- 설치 완료 확인 쿼리
-- =====================================================

-- 1. 설치된 Storage 정책 확인
SELECT
    policyname as policy_name,
    cmd as command,
    qual as condition
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname LIKE '%hero video%';

-- 2. 설치된 함수 확인
SELECT
    proname as function_name,
    provolatile as volatility,
    prosrc as source_snippet
FROM pg_proc
WHERE proname LIKE '%hero_video%'
ORDER BY proname;

-- 3. hero_video_logs 테이블 확인
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'hero_video_logs'
ORDER BY ordinal_position;

-- 4. 버킷 내 영상 파일 확인
SELECT
    name,
    metadata,
    created_at,
    updated_at
FROM storage.objects
WHERE bucket_id = 'hero-videos'
ORDER BY created_at DESC;

-- =====================================================
-- 주의사항 및 사용법
-- =====================================================

-- 🔧 실행 전 필수 작업:
-- 1. Supabase 대시보드에서 hero-videos 버킷을 먼저 생성해야 함
-- 2. 버킷 설정: Public = true, File Size Limit = 100MB
-- 3. Allowed MIME types: video/mp4, video/webm, video/quicktime

-- 📹 영상 업로드 가이드:
-- 1. 권장 포맷: MP4 (H.264 codec)
-- 2. 권장 해상도: 1920x1080 (Full HD)
-- 3. 권장 파일 크기: 10-30MB
-- 4. 파일명: hero-video.mp4 (간단하게 유지)

-- 🚀 다음 구현 단계:
-- 1. video-utils.ts: 영상 URL 생성 유틸리티
-- 2. HeroVideo.tsx: 영상 재생 컴포넌트 (fallback 포함)
-- 3. VideoUploadSection.tsx: 관리자 영상 업로드 UI
