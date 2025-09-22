-- ========================================
-- 바베큐장 예약 시스템 - 완전한 데이터베이스 재구성
-- ========================================
-- 목적: 사용자 친화적인 시설 기반 예약 시스템 구축
-- 실행 방법: Supabase SQL Editor에서 단계별 실행

-- ⚠️ 주의: 이 스크립트는 기존 데이터를 모두 삭제합니다!
-- 실행 전 필요한 데이터는 반드시 백업하세요.

-- ========================================
-- 1단계: 기존 데이터 백업 (선택사항)
-- ========================================

-- 중요한 예약 데이터가 있다면 주석을 해제하고 백업
-- CREATE TABLE backup_reservations AS SELECT * FROM reservations;
-- CREATE TABLE backup_admin_profiles AS SELECT * FROM admin_profiles;

-- ========================================
-- 2단계: 기존 테이블 및 정책 완전 삭제
-- ========================================

-- RLS 정책 먼저 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON reservations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON reservations;
DROP POLICY IF EXISTS "Enable update for users based on email" ON reservations;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON reservations;

-- 외래키 제약조건으로 인한 순서 고려하여 삭제
DROP TABLE IF EXISTS reservation_add_ons CASCADE;
DROP TABLE IF EXISTS "reservation_add-ons" CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS admin_profiles CASCADE;
DROP TABLE IF EXISTS resource_catalog CASCADE;
DROP TABLE IF EXISTS sku_catalog CASCADE;
DROP TABLE IF EXISTS time_slot_catalog CASCADE;

-- 기존에 있을 수 있는 테이블들도 정리
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS site_types CASCADE;

-- ========================================
-- 3단계: 새로운 스키마 구축 (사용자 친화적)
-- ========================================

-- users 테이블 (회원 정보)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- 소셜 로그인 시 NULL 허용
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'MANAGER', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    provider TEXT NOT NULL DEFAULT 'email' CHECK (provider IN ('email', 'kakao')),
    provider_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- facilities 테이블 (시설 정보 - 프라이빗룸, 텐트동 등)
CREATE TABLE facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL, -- private, tent, outdoor_sofa, outdoor_table, vip
    capacity INTEGER NOT NULL,
    weekday_price INTEGER NOT NULL,
    weekend_price INTEGER NOT NULL,
    amenities TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- sites 테이블 (각 시설의 개별 사이트)
CREATE TABLE sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
    site_number TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(facility_id, site_number)
);

-- reservations 테이블 (예약 정보 - 회원/비회원 모두 지원)
CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- 회원 예약
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- 비회원 예약
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,

    -- 예약 기본 정보
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
    reservation_date DATE NOT NULL,
    time_slots INTEGER[] NOT NULL, -- [1,2,3] 형태: 1부/2부/3부
    total_amount INTEGER NOT NULL,

    -- 상태 관리
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    payment_status TEXT NOT NULL DEFAULT 'WAITING'
        CHECK (payment_status IN ('WAITING', 'COMPLETED', 'REFUNDED')),

    -- 추가 정보
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

-- notices 테이블 (공지사항)
CREATE TABLE notices (
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

-- faqs 테이블 (자주 묻는 질문)
CREATE TABLE faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- 4단계: 성능 최적화 인덱스 생성
-- ========================================

-- users 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- facilities 인덱스
CREATE INDEX idx_facilities_type ON facilities(type);
CREATE INDEX idx_facilities_active ON facilities(is_active);

-- sites 인덱스
CREATE INDEX idx_sites_facility ON sites(facility_id);
CREATE INDEX idx_sites_active ON sites(is_active);

-- reservations 인덱스 (예약 조회 최적화)
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_guest_phone ON reservations(guest_phone);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_facility_site ON reservations(facility_id, site_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_date_time ON reservations(reservation_date, time_slots);

-- notices 인덱스
CREATE INDEX idx_notices_published ON notices(is_published, created_at DESC);
CREATE INDEX idx_notices_important ON notices(is_important, created_at DESC);

-- faqs 인덱스
CREATE INDEX idx_faqs_published ON faqs(is_published, order_index);
CREATE INDEX idx_faqs_category ON faqs(category, order_index);

-- ========================================
-- 5단계: RLS (Row Level Security) 정책 설정
-- ========================================

-- users 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "user_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "service_role_all_users" ON users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- facilities 테이블 RLS (모든 사용자 읽기 가능)
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facilities_select_all" ON facilities
    FOR SELECT USING (is_active = true);

CREATE POLICY "facilities_service_role" ON facilities
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- sites 테이블 RLS
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sites_select_all" ON sites
    FOR SELECT USING (is_active = true);

CREATE POLICY "sites_service_role" ON sites
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- reservations 테이블 RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservation_select_own" ON reservations
    FOR SELECT USING (
        user_id = auth.uid() OR user_id IS NULL  -- 자신의 예약 + 비회원 예약 조회 허용
    );

CREATE POLICY "reservation_insert_all" ON reservations
    FOR INSERT WITH CHECK (true);  -- API에서 검증

CREATE POLICY "reservation_update_own" ON reservations
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "reservation_service_role" ON reservations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- notices 테이블 RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices_select_published" ON notices
    FOR SELECT USING (is_published = true);

CREATE POLICY "notices_service_role" ON notices
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- faqs 테이블 RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faqs_select_published" ON faqs
    FOR SELECT USING (is_published = true);

CREATE POLICY "faqs_service_role" ON faqs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ========================================
-- 6단계: 트리거 함수 및 트리거 생성
-- ========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON facilities FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notices_updated_at
    BEFORE UPDATE ON notices FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON faqs FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 중복 예약 방지 함수
CREATE OR REPLACE FUNCTION check_reservation_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- 같은 사이트, 같은 날짜, 겹치는 시간대에 이미 예약이 있는지 확인
    IF EXISTS (
        SELECT 1 FROM reservations
        WHERE site_id = NEW.site_id
        AND reservation_date = NEW.reservation_date
        AND time_slots && NEW.time_slots  -- 배열 교집합 연산자
        AND status != 'CANCELLED'
        AND (TG_OP = 'INSERT' OR id != NEW.id)  -- INSERT이거나 자기 자신이 아닌 경우
    ) THEN
        RAISE EXCEPTION '중복 예약이 발생했습니다. 선택한 시간대에 이미 예약이 있습니다.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 중복 예약 방지 트리거 적용
CREATE TRIGGER check_reservation_conflict_trigger
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_reservation_conflict();

-- ========================================
-- 7단계: 초기 데이터 삽입
-- ========================================

-- 기본 시설 데이터
INSERT INTO facilities (name, description, type, capacity, weekday_price, weekend_price, amenities, images) VALUES
('프라이빗룸 A', '독립적인 가족 공간으로 프라이버시가 보장되는 바베큐장입니다.', 'private', 6, 50000, 70000,
 ARRAY['화로대', '테이블', '의자', '주차공간'], ARRAY['/images/private-a-1.jpg', '/images/private-a-2.jpg']),
('텐트동 B', '자연과 함께하는 캠핑 느낌의 바베큐 공간입니다.', 'tent', 8, 40000, 60000,
 ARRAY['텐트', '화로대', '테이블', '의자'], ARRAY['/images/tent-b-1.jpg', '/images/tent-b-2.jpg']),
('야외 소파테이블 C', '편안한 소파에서 즐기는 야외 바베큐 공간입니다.', 'outdoor_sofa', 4, 35000, 50000,
 ARRAY['소파', '테이블', '화로대'], ARRAY['/images/sofa-c-1.jpg']),
('VIP동 D', '최고급 시설을 갖춘 프리미엄 바베큐 공간입니다.', 'vip', 10, 80000, 120000,
 ARRAY['프리미엄 화로대', '고급 테이블', '소파', '음향시설', '전용 주차'], ARRAY['/images/vip-d-1.jpg', '/images/vip-d-2.jpg']);

-- 각 시설의 사이트 생성
INSERT INTO sites (facility_id, site_number, name, description, capacity)
SELECT
    f.id,
    f.type || '-' || generate_series(1,
        CASE
            WHEN f.type = 'private' THEN 3
            WHEN f.type = 'tent' THEN 2
            WHEN f.type = 'outdoor_sofa' THEN 4
            WHEN f.type = 'vip' THEN 1
            ELSE 2
        END
    ),
    f.name || ' - 사이트 ' || generate_series(1,
        CASE
            WHEN f.type = 'private' THEN 3
            WHEN f.type = 'tent' THEN 2
            WHEN f.type = 'outdoor_sofa' THEN 4
            WHEN f.type = 'vip' THEN 1
            ELSE 2
        END
    ),
    f.description,
    f.capacity
FROM facilities f;

-- 기본 FAQ 데이터
INSERT INTO faqs (question, answer, category, order_index) VALUES
('예약은 어떻게 하나요?', '홈페이지 상단의 "예약하기" 버튼을 클릭하여 원하는 날짜와 시간대를 선택하시면 됩니다.', 'reservation', 1),
('예약 취소는 어떻게 하나요?', '마이페이지에서 예약 내역을 확인하고 취소하실 수 있습니다. 예약일 3일 전까지는 무료 취소가 가능합니다.', 'reservation', 2),
('시설 이용 시간은 어떻게 되나요?', '1부: 10:00-14:00, 2부: 14:00-18:00, 3부: 18:00-22:00 입니다.', 'facility', 3),
('주차 공간은 있나요?', '네, 충분한 주차 공간을 제공하고 있습니다.', 'facility', 4),
('비회원도 예약이 가능한가요?', '네, 회원가입 없이도 이름과 연락처만으로 간편하게 예약하실 수 있습니다.', 'reservation', 5);

-- 완료 알림
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '🎉 바베큐장 예약 시스템 데이터베이스 재구성 완료!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ 생성된 테이블: users, facilities, sites, reservations, notices, faqs';
    RAISE NOTICE '✅ 설정된 기능: RLS 정책, 인덱스, 트리거, 초기 데이터';
    RAISE NOTICE '✅ 사용자 친화적 구조: 시설 기반 직관적 예약 시스템';
    RAISE NOTICE '================================================';
    RAISE NOTICE '다음 단계: TypeScript 타입 정의 업데이트 필요';
END $$;