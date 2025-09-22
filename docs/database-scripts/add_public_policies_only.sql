-- ========================================
-- 공개 조회 정책만 추가하는 안전한 스크립트
-- ========================================
-- 기존 관리자 정책은 건드리지 않고 누락된 공개 정책만 추가

-- 일반 사용자(비로그인 포함)가 발행된 공지사항을 조회할 수 있도록 허용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notices' AND policyname = 'notices_public_select'
  ) THEN
    CREATE POLICY "notices_public_select" ON notices
      FOR SELECT USING (is_published = true);
    RAISE NOTICE 'Created policy: notices_public_select';
  ELSE
    RAISE NOTICE 'Policy already exists: notices_public_select';
  END IF;
END $$;

-- 일반 사용자(비로그인 포함)가 발행된 FAQ를 조회할 수 있도록 허용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'faqs' AND policyname = 'faqs_public_select'
  ) THEN
    CREATE POLICY "faqs_public_select" ON faqs
      FOR SELECT USING (is_published = true);
    RAISE NOTICE 'Created policy: faqs_public_select';
  ELSE
    RAISE NOTICE 'Policy already exists: faqs_public_select';
  END IF;
END $$;

-- 활성화된 시설을 모든 사용자가 조회할 수 있도록 허용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'facilities' AND policyname = 'facilities_public_select'
  ) THEN
    CREATE POLICY "facilities_public_select" ON facilities
      FOR SELECT USING (is_active = true);
    RAISE NOTICE 'Created policy: facilities_public_select';
  ELSE
    RAISE NOTICE 'Policy already exists: facilities_public_select';
  END IF;
END $$;

-- 시설과 연결된 활성 구역을 모든 사용자가 조회할 수 있도록 허용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sites' AND policyname = 'sites_public_select'
  ) THEN
    CREATE POLICY "sites_public_select" ON sites
      FOR SELECT USING (is_active = true);
    RAISE NOTICE 'Created policy: sites_public_select';
  ELSE
    RAISE NOTICE 'Policy already exists: sites_public_select';
  END IF;
END $$;

-- ========================================
-- 실행 완료 확인
-- ========================================
-- 이 스크립트 실행 후:
-- 1. 홈페이지에서 발행된 공지사항만 표시되는지 확인
-- 2. 홈페이지에서 발행된 FAQ만 표시되는지 확인
-- 3. 홈페이지에서 활성화된 시설만 표시되는지 확인
-- 4. 비공개 콘텐츠가 홈페이지에 노출되지 않는지 확인