-- =====================================================
-- Supabase Storage 설정 스크립트 (수정됨)
-- 시설 이미지 업로드 및 관리를 위한 Storage 설정
-- =====================================================

-- 1. facility-images 버킷 생성 안내
-- Supabase 대시보드 → Storage → New Bucket
-- 버킷명: facility-images
-- Public: true (고객이 이미지 조회 가능)
-- File Size Limit: 5MB
-- Allowed MIME Types: image/jpeg, image/png, image/webp, image/svg+xml

-- 2. Storage RLS 정책 설정 (수정된 버전)
-- storage.objects 테이블에 대한 정책 생성

-- 관리자만 이미지 업로드 가능
CREATE POLICY "Admin can upload facility images" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'facility-images' AND
  (auth.jwt() ->> 'role' = 'ADMIN' OR auth.jwt() ->> 'role' = 'MANAGER')
);

-- 관리자만 이미지 수정 가능
CREATE POLICY "Admin can update facility images" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'facility-images' AND
  (auth.jwt() ->> 'role' = 'ADMIN' OR auth.jwt() ->> 'role' = 'MANAGER')
)
WITH CHECK (
  bucket_id = 'facility-images' AND
  (auth.jwt() ->> 'role' = 'ADMIN' OR auth.jwt() ->> 'role' = 'MANAGER')
);

-- 관리자만 이미지 삭제 가능
CREATE POLICY "Admin can delete facility images" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'facility-images' AND
  (auth.jwt() ->> 'role' = 'ADMIN' OR auth.jwt() ->> 'role' = 'MANAGER')
);

-- 모든 사용자가 이미지 조회 가능 (Public 읽기)
CREATE POLICY "Anyone can view facility images" ON storage.objects
FOR SELECT
USING (bucket_id = 'facility-images');

-- 3. 기존 facilities 테이블에 대표 이미지 컬럼 추가 (선택사항)
-- ALTER TABLE facilities ADD COLUMN featured_image_index INTEGER DEFAULT 0;

-- 4. 이미지 URL 헬퍼 함수 생성 (개선된 버전)
CREATE OR REPLACE FUNCTION get_facility_image_url(image_path TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT
        CASE
            WHEN image_path IS NULL OR image_path = '' THEN NULL
            ELSE 'https://nrblnfmknolgsqpcqite.supabase.co/storage/v1/object/public/facility-images/' || image_path
        END;
$$;

-- 주의: 실제 사용 시 'your-project'를 실제 Supabase 프로젝트 ID로 변경해야 함

-- 5. 이미지 최적화 URL 헬퍼 함수 생성 (수정된 버전)
CREATE OR REPLACE FUNCTION get_facility_image_optimized_url(
    image_path TEXT,
    width INTEGER DEFAULT NULL,
    height INTEGER DEFAULT NULL,
    quality INTEGER DEFAULT 75
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    base_url TEXT;
    params TEXT := '';
BEGIN
    IF image_path IS NULL OR image_path = '' THEN
        RETURN NULL;
    END IF;

    base_url := 'https://nrblnfmknolgsqpcqite.supabase.co/storage/v1/object/public/facility-images/' || image_path;

    -- 변환 파라미터가 있는 경우만 추가
    IF width IS NOT NULL OR height IS NOT NULL THEN
        params := '?';

        IF width IS NOT NULL THEN
            params := params || 'width=' || width;
        END IF;

        IF height IS NOT NULL THEN
            IF params != '?' THEN
                params := params || '&';
            END IF;
            params := params || 'height=' || height;
        END IF;

        -- quality는 항상 추가
        IF params != '?' THEN
            params := params || '&';
        END IF;
        params := params || 'quality=' || quality;

        RETURN base_url || params;
    ELSE
        RETURN base_url;
    END IF;
END;
$$;

-- 6. 시설 이미지 통계 뷰 생성 (개선된 버전)
CREATE OR REPLACE VIEW facility_image_stats AS
SELECT
    f.id,
    f.name,
    f.type,
    f.is_active,
    COALESCE(array_length(f.images, 1), 0) as image_count,
    f.images,
    CASE
        WHEN f.images IS NOT NULL AND array_length(f.images, 1) > 0
        THEN get_facility_image_url(f.images[1])
        ELSE NULL
    END as featured_image_url,
    CASE
        WHEN f.images IS NOT NULL AND array_length(f.images, 1) > 0
        THEN get_facility_image_optimized_url(f.images[1], 300, 200, 80)
        ELSE NULL
    END as thumbnail_url
FROM facilities f;

-- 7. 이미지 업로드 감사 로그 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS facility_image_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('upload', 'delete')),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE facility_image_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 로그 조회 가능
CREATE POLICY "Admin can view image logs" ON facility_image_logs
FOR SELECT USING (auth.jwt() ->> 'role' IN ('ADMIN', 'MANAGER'));

-- 로그 삽입은 시스템에서만 수행 (트리거로 처리)
CREATE POLICY "System can insert image logs" ON facility_image_logs
FOR INSERT WITH CHECK (true);

-- 8. 간소화된 이미지 변경 로그 트리거 함수
CREATE OR REPLACE FUNCTION log_facility_image_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 이미지 배열이 변경된 경우에만 로그 기록
    IF TG_OP = 'UPDATE' AND (
        (OLD.images IS NULL AND NEW.images IS NOT NULL) OR
        (OLD.images IS NOT NULL AND NEW.images IS NULL) OR
        (OLD.images != NEW.images)
    ) THEN
        INSERT INTO facility_image_logs (facility_id, image_path, action, user_id)
        VALUES (
            NEW.id,
            CASE
                WHEN NEW.images IS NULL THEN 'all_images_removed'
                WHEN OLD.images IS NULL THEN 'first_images_added'
                ELSE 'images_modified'
            END,
            CASE
                WHEN COALESCE(array_length(NEW.images, 1), 0) > COALESCE(array_length(OLD.images, 1), 0) THEN 'upload'
                WHEN COALESCE(array_length(NEW.images, 1), 0) < COALESCE(array_length(OLD.images, 1), 0) THEN 'delete'
                ELSE 'update'
            END,
            auth.uid()
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 트리거 생성 (기존 트리거 제거 후 재생성)
DROP TRIGGER IF EXISTS facility_image_change_trigger ON facilities;
CREATE TRIGGER facility_image_change_trigger
    AFTER UPDATE OF images ON facilities
    FOR EACH ROW
    EXECUTE FUNCTION log_facility_image_change();

-- =====================================================
-- 설치 완료 확인 쿼리 (업데이트됨)
-- =====================================================

-- 1. 설치된 Storage 정책 확인
SELECT
    policyname as policy_name,
    cmd as command,
    qual as condition
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname LIKE '%facility image%';

-- 2. 설치된 함수 확인
SELECT
    proname as function_name,
    provolatile as volatility,
    prosrc as source_snippet
FROM pg_proc
WHERE proname LIKE '%facility_image%'
ORDER BY proname;

-- 3. 설치된 뷰 확인
SELECT
    viewname as view_name,
    schemaname as schema_name
FROM pg_views
WHERE viewname = 'facility_image_stats';

-- 4. facility_image_logs 테이블 확인
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'facility_image_logs'
ORDER BY ordinal_position;

-- 5. 기능 테스트 쿼리 (샘플)
-- 실제 이미지가 있는 시설에 대한 URL 생성 테스트
SELECT
    f.name,
    f.images[1] as first_image,
    get_facility_image_url(f.images[1]) as image_url,
    get_facility_image_optimized_url(f.images[1], 300, 200) as thumbnail_url
FROM facilities f
WHERE f.images IS NOT NULL AND array_length(f.images, 1) > 0
LIMIT 3;

-- =====================================================
-- 주의사항 및 다음 단계
-- =====================================================

-- 🔧 실행 전 수정 필요사항:
-- 1. 'your-project'를 실제 Supabase 프로젝트 ID로 변경
-- 2. Supabase 대시보드에서 facility-images 버킷 생성
-- 3. 기존 정책과 충돌하지 않는지 확인

-- 🚀 다음 구현 단계:
-- 1. 백엔드 이미지 업로드 API 개발
-- 2. 관리자 UI 이미지 업로드 컴포넌트 구현
-- 3. 고객 UI 이미지 표시 기능 구현