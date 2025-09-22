-- ========================================
-- 바베큐장 예약 시스템 데이터베이스 수정 스크립트
-- ========================================
-- 실행 방법: Supabase SQL Editor에서 전체 스크립트 실행

-- 1. 기존 문제 있는 RLS 정책 확인 및 수정
-- ========================================

-- 현재 정책 상태 확인 (참고용 - 실행 시 주석 해제)
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('users', 'reservations');

-- 문제가 있는 정책들만 선별적으로 교체
-- (DROP 후 즉시 CREATE로 안전하게 교체)

-- 2. 누락된 테이블 생성
-- ========================================

-- users 테이블 생성 (회원 정보)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- 소셜 로그인을 위해 NULL 허용
    name TEXT NOT NULL,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'MANAGER', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    provider TEXT NOT NULL DEFAULT 'email' CHECK (provider IN ('email', 'kakao', 'naver')),
    provider_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ
);

-- reservations 테이블 생성 (예약 정보)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 회원 예약 시
    guest_name TEXT, -- 비회원 예약 시
    guest_phone TEXT, -- 비회원 예약 시
    guest_email TEXT, -- 비회원 예약 시
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
    reservation_date DATE NOT NULL,
    time_slots INTEGER[] NOT NULL, -- [1,2,3] 형태로 시간대 저장
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    payment_status TEXT NOT NULL DEFAULT 'WAITING' CHECK (payment_status IN ('WAITING', 'COMPLETED', 'REFUNDED')),
    special_requests TEXT,
    admin_memo TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- 회원 또는 비회원 정보 중 하나는 반드시 있어야 함
    CONSTRAINT check_user_or_guest CHECK (
        (user_id IS NOT NULL) OR
        (guest_name IS NOT NULL AND guest_phone IS NOT NULL)
    )
);

-- notices 테이블 생성 (공지사항)
CREATE TABLE IF NOT EXISTS notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- faqs 테이블 생성 (자주 묻는 질문)
CREATE TABLE IF NOT EXISTS faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 개선된 RLS 정책 설정 (무한 재귀 방지)
-- ========================================

-- users 테이블 RLS 정책 (재귀 방지)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 후 개선된 정책 생성
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- 단순한 정책: 자신의 정보만 조회 (무한 재귀 방지)
CREATE POLICY "user_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

-- 자신의 정보만 수정
CREATE POLICY "user_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Service Role에게 모든 권한 부여 (API에서 사용)
CREATE POLICY "service_role_all_access" ON users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 회원가입 허용
CREATE POLICY "enable_insert_for_authenticated_users" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- reservations 테이블 RLS 정책 (무한 재귀 방지)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON reservations;

-- 단순한 정책: 자신의 예약만 조회 (users 테이블 참조 없이)
CREATE POLICY "reservation_select_own" ON reservations
    FOR SELECT USING (
        user_id = auth.uid() OR user_id IS NULL  -- 비회원 예약도 허용
    );

-- 예약 생성 허용 (로그인 사용자 + 비회원)
CREATE POLICY "reservation_insert_allowed" ON reservations
    FOR INSERT WITH CHECK (true);  -- API에서 검증하므로 여기서는 허용

-- 자신의 예약만 수정
CREATE POLICY "reservation_update_own" ON reservations
    FOR UPDATE USING (user_id = auth.uid());

-- Service Role에게 모든 권한 부여 (API에서 관리자 권한 체크)
CREATE POLICY "reservation_service_role_access" ON reservations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- notices 테이블 RLS 정책
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공개된 공지사항을 볼 수 있음
CREATE POLICY "Everyone can view published notices" ON notices
    FOR SELECT USING (is_published = true);

-- 관리자만 공지사항을 관리할 수 있음
CREATE POLICY "Admins can manage notices" ON notices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- faqs 테이블 RLS 정책
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공개된 FAQ를 볼 수 있음
CREATE POLICY "Everyone can view published faqs" ON faqs
    FOR SELECT USING (is_published = true);

-- 관리자만 FAQ를 관리할 수 있음
CREATE POLICY "Admins can manage faqs" ON faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- 4. 기존 테이블들 RLS 설정 확인
-- ========================================

-- facilities는 모든 사용자가 읽을 수 있어야 함
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view facilities" ON facilities;
CREATE POLICY "Everyone can view facilities" ON facilities
    FOR SELECT USING (is_active = true);

-- 관리자만 facilities를 관리할 수 있음
DROP POLICY IF EXISTS "Admins can manage facilities" ON facilities;
CREATE POLICY "Admins can manage facilities" ON facilities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- sites는 모든 사용자가 읽을 수 있어야 함
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view sites" ON sites;
CREATE POLICY "Everyone can view sites" ON sites
    FOR SELECT USING (is_active = true);

-- 관리자만 sites를 관리할 수 있음
DROP POLICY IF EXISTS "Admins can manage sites" ON sites;
CREATE POLICY "Admins can manage sites" ON sites
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- 5. 트리거 함수 생성 (updated_at 자동 업데이트)
-- ========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_notices_updated_at ON notices;
CREATE TRIGGER update_notices_updated_at
    BEFORE UPDATE ON notices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 6. 인덱스 생성 (성능 최적화)
-- ========================================

-- notices 인덱스
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_important ON notices(is_important, created_at DESC);

-- faqs 인덱스
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(is_published, order_index);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category, order_index);

-- reservations 인덱스
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_facility_site ON reservations(facility_id, site_id);

-- 7. 초기 데이터 삽입 (필요시)
-- ========================================

-- 기본 FAQ 데이터
INSERT INTO faqs (question, answer, category, order_index) VALUES
('예약은 어떻게 하나요?', '홈페이지 상단의 "예약하기" 버튼을 클릭하여 원하는 날짜와 시간대를 선택하시면 됩니다.', 'reservation', 1),
('예약 취소는 어떻게 하나요?', '마이페이지에서 예약 내역을 확인하고 취소하실 수 있습니다. 예약일 3일 전까지는 무료 취소가 가능합니다.', 'reservation', 2),
('시설 이용 시간은 어떻게 되나요?', '1부: 10:00-14:00, 2부: 14:00-18:00, 3부: 18:00-22:00 입니다.', 'facility', 3),
('주차 공간은 있나요?', '네, 충분한 주차 공간을 제공하고 있습니다.', 'facility', 4)
ON CONFLICT DO NOTHING;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE '데이터베이스 수정이 완료되었습니다!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '수정된 내용:';
    RAISE NOTICE '1. RLS 정책 무한 재귀 문제 해결';
    RAISE NOTICE '2. notices, faqs 테이블 생성';
    RAISE NOTICE '3. 안전한 RLS 정책 재설정';
    RAISE NOTICE '4. 성능 최적화 인덱스 추가';
    RAISE NOTICE '5. 기본 FAQ 데이터 삽입';
    RAISE NOTICE '====================================';
END $$;