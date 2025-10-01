-- 매장 설정 관리 테이블
-- 환경변수 대신 데이터베이스에서 설정을 관리합니다

CREATE TABLE IF NOT EXISTS store_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('store', 'operation', 'payment', 'policy', 'marketing', 'social')),
  description TEXT,
  data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  is_required BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- 클라이언트에서 접근 가능한지 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_store_settings_key ON store_settings(key);
CREATE INDEX IF NOT EXISTS idx_store_settings_category ON store_settings(category);
CREATE INDEX IF NOT EXISTS idx_store_settings_public ON store_settings(is_public);

-- RLS 정책 설정
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- 공개 설정은 모든 사용자가 읽기 가능
CREATE POLICY "Public settings are viewable by everyone"
ON store_settings FOR SELECT
USING (is_public = true);

-- 관리자만 모든 설정 조회 가능
CREATE POLICY "Admins can view all settings"
ON store_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'MANAGER')
  )
);

-- 관리자만 설정 수정 가능
CREATE POLICY "Admins can modify settings"
ON store_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'MANAGER')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'MANAGER')
  )
);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_store_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_store_settings_updated_at();

-- 기본 설정값들 삽입
INSERT INTO store_settings (key, value, category, description, data_type, is_required, is_public) VALUES
-- 매장 기본 정보
('STORE_NAME', '오소 바베큐장', 'store', '매장 이름', 'string', true, true),
('STORE_PHONE', '02-1234-5678', 'store', '매장 전화번호', 'string', true, true),
('STORE_EMAIL', 'info@osobbq.com', 'store', '매장 이메일', 'string', true, true),
('STORE_NOREPLY_EMAIL', 'noreply@osobbq.com', 'store', '자동 발송 이메일 주소', 'string', true, false),
('STORE_ADMIN_EMAIL', 'admin@osobbq.com', 'store', '관리자 이메일', 'string', true, false),

-- 매장 위치 및 운영 정보
('STORE_ADDRESS', '서울특별시 강남구 테헤란로 123', 'store', '매장 주소', 'string', true, true),
('STORE_DETAILED_ADDRESS', '서울특별시 강남구 역삼동 123-45', 'store', '매장 상세 주소', 'string', false, true),
('STORE_BUSINESS_HOURS', '오전 10시 - 오후 10시', 'store', '영업 시간', 'string', true, true),
('STORE_CLOSED_DAY', '매주 월요일', 'store', '정기 휴무일', 'string', false, true),

-- 시간대 설정
('TIME_SLOT_1', '10:00-14:00', 'operation', '1시간대 (예: 10:00-14:00)', 'string', true, true),
('TIME_SLOT_2', '14:00-18:00', 'operation', '2시간대 (예: 14:00-18:00)', 'string', true, true),
('TIME_SLOT_3', '18:00-22:00', 'operation', '3시간대 (예: 18:00-22:00)', 'string', true, true),
('TIME_SLOT_4', '22:00-02:00', 'operation', '4시간대 (예: 22:00-02:00)', 'string', false, true),
('TIME_SLOT_1_NAME', '1부', 'operation', '1시간대 이름 (예: 1부)', 'string', true, true),
('TIME_SLOT_2_NAME', '2부', 'operation', '2시간대 이름 (예: 2부)', 'string', true, true),
('TIME_SLOT_3_NAME', '3부', 'operation', '3시간대 이름 (예: 3부)', 'string', true, true),
('TIME_SLOT_4_NAME', '4부', 'operation', '4시간대 이름 (예: 4부)', 'string', false, true),

-- 은행 계좌 정보
('BANK_NAME', '국민은행', 'payment', '은행명', 'string', true, true),
('BANK_ACCOUNT_NUMBER', '123456-78-901234', 'payment', '계좌번호', 'string', true, true),
('BANK_ACCOUNT_HOLDER', '오소바베큐장', 'payment', '예금주', 'string', true, true),

-- 비즈니스 정책
('CANCELLATION_POLICY', '예약일 1일 전까지 취소 가능합니다', 'policy', '취소 정책', 'string', true, true),
('REFUND_POLICY', '취소 시점에 따라 환불 정책이 적용됩니다', 'policy', '환불 정책', 'string', true, true),
('MAX_ADVANCE_BOOKING_DAYS', '30', 'policy', '최대 예약 가능 일수', 'number', true, false),
('MIN_ADVANCE_BOOKING_HOURS', '2', 'policy', '최소 예약 선행 시간', 'number', true, false),

-- SEO 및 마케팅
('SITE_TITLE', '오소 바베큐장 예약 시스템', 'marketing', '사이트 제목', 'string', true, true),
('SITE_DESCRIPTION', '바베큐장 시설 대여를 위한 간편한 예약 시스템', 'marketing', '사이트 설명', 'string', true, true),
('SITE_KEYWORDS', '바베큐,예약,바베큐장,가족모임,야외활동', 'marketing', '사이트 키워드', 'string', false, true),

-- 소셜 미디어
('SOCIAL_INSTAGRAM_URL', 'https://instagram.com/osobbq', 'social', '인스타그램 URL', 'string', false, true),
('SOCIAL_FACEBOOK_URL', 'https://facebook.com/osobbq', 'social', '페이스북 URL', 'string', false, true),
('SOCIAL_BLOG_URL', 'https://blog.naver.com/osobbq', 'social', '블로그 URL', 'string', false, true),

-- 정책 URL
('TERMS_OF_SERVICE_URL', '/terms', 'policy', '이용약관 페이지 URL', 'string', true, true),
('PRIVACY_POLICY_URL', '/privacy', 'policy', '개인정보처리방침 페이지 URL', 'string', true, true),

-- SEO 및 마케팅 (추가)
('SITE_OG_IMAGE_URL', '/images/og-image.jpg', 'marketing', 'Open Graph 이미지 URL', 'string', false, true),

-- 분석 도구 (민감 정보이므로 is_public = false)
('GOOGLE_ANALYTICS_ID', '', 'marketing', 'Google Analytics ID', 'string', false, false),
('GOOGLE_TAG_MANAGER_ID', '', 'marketing', 'Google Tag Manager ID', 'string', false, false)

ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();