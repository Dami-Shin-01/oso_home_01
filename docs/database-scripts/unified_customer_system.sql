-- ========================================
-- 통합 고객 시스템 구축
-- 실행일: 2025-09-22
-- 목적: users 테이블 확장 + customer_profiles 분리 구조
-- ========================================

-- 1단계: 현재 상태 확인
SELECT 'Checking current database state...' as step;

-- 기존 users 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2단계: users 테이블에 CUSTOMER role 추가 (있는 경우에만)
SELECT 'Updating users table for customer support...' as step;

-- role enum에 CUSTOMER 추가 (이미 있으면 무시됨)
DO $$
BEGIN
    -- role 타입 확인 및 CUSTOMER 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'CUSTOMER'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'CUSTOMER';
        RAISE NOTICE '✅ Added CUSTOMER role to user_role enum';
    ELSE
        RAISE NOTICE 'ℹ️ CUSTOMER role already exists in user_role enum';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠️ Could not modify user_role enum: %', SQLERRM;
END
$$;

-- 3단계: customer_profiles 테이블 생성
SELECT 'Creating customer_profiles table...' as step;

CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    birth_date DATE,
    address TEXT,
    marketing_consent BOOLEAN DEFAULT false,
    preferred_contact VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone', 'both')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- customer_id는 users 테이블에서 role='CUSTOMER'인 사용자만 참조
    CONSTRAINT customer_profiles_customer_id_unique UNIQUE(customer_id)
);

-- RLS 활성화
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- 4단계: reservation_payments 테이블 생성
SELECT 'Creating reservation_payments table...' as step;

CREATE TABLE IF NOT EXISTS reservation_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('card', 'transfer', 'cash', 'kakao_pay', 'naver_pay')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    transaction_id VARCHAR(100),
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    refund_amount DECIMAL(10,2) CHECK (refund_amount >= 0),
    refund_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE reservation_payments ENABLE ROW LEVEL SECURITY;

-- 5단계: RLS 정책 생성
SELECT 'Creating RLS policies...' as step;

-- customer_profiles 정책
DROP POLICY IF EXISTS "Customers can manage own profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Admins can access all customer profiles" ON customer_profiles;

-- 고객은 자신의 프로필만 관리
CREATE POLICY "Customers can manage own profiles" ON customer_profiles
    FOR ALL USING (
        auth.uid() = customer_id
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'CUSTOMER'
        )
    );

-- 관리자는 모든 고객 프로필 접근 가능
CREATE POLICY "Admins can access all customer profiles" ON customer_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'MANAGER')
        )
    );

-- reservation_payments 정책
DROP POLICY IF EXISTS "Users can view own payments" ON reservation_payments;
DROP POLICY IF EXISTS "Admins can access all payments" ON reservation_payments;

-- 사용자는 자신의 결제 정보만 조회 (회원/비회원 구분)
CREATE POLICY "Users can view own payments" ON reservation_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reservations r
            WHERE r.id = reservation_id
            AND (
                (r.user_id = auth.uid()) OR                    -- 회원 예약
                (r.guest_email = auth.email())                 -- 비회원 예약
            )
        )
    );

-- 관리자는 모든 결제 정보 관리 가능
CREATE POLICY "Admins can access all payments" ON reservation_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'MANAGER')
        )
    );

-- 6단계: 인덱스 생성
SELECT 'Creating performance indexes...' as step;

-- customer_profiles 인덱스
CREATE INDEX IF NOT EXISTS idx_customer_profiles_customer_id ON customer_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_marketing ON customer_profiles(marketing_consent) WHERE marketing_consent = true;

-- reservation_payments 인덱스
CREATE INDEX IF NOT EXISTS idx_reservation_payments_reservation_id ON reservation_payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_status ON reservation_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_method ON reservation_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_paid_at ON reservation_payments(paid_at) WHERE paid_at IS NOT NULL;

-- users 테이블 고객 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_users_role_customer ON users(role) WHERE role = 'CUSTOMER';
CREATE INDEX IF NOT EXISTS idx_users_email_customer ON users(email) WHERE role = 'CUSTOMER';

-- 7단계: 테이블 관계 및 제약조건 확인
SELECT 'Verifying table relationships...' as step;

-- customer_profiles가 CUSTOMER role 사용자만 참조하는지 확인하는 함수
CREATE OR REPLACE FUNCTION check_customer_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.customer_id
        AND role = 'CUSTOMER'
    ) THEN
        RAISE EXCEPTION 'customer_id must reference a user with CUSTOMER role';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (customer_profiles 삽입/수정 시 role 확인)
DROP TRIGGER IF EXISTS check_customer_role_trigger ON customer_profiles;
CREATE TRIGGER check_customer_role_trigger
    BEFORE INSERT OR UPDATE ON customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_customer_role();

-- 8단계: 최종 확인 및 상태 리포트
SELECT 'Final verification and status report...' as step;

-- 생성된 테이블 확인
SELECT
    t.table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name) as policy_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name AND schemaname = 'public') as index_count,
    '✅ READY' as status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name IN ('users', 'customer_profiles', 'reservation_payments')
ORDER BY t.table_name;

-- role enum 확인
SELECT
    'user_role enum values' as info,
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) as available_roles
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

SELECT '🎉 Unified customer system setup completed successfully!' as result;

-- 9단계: 사용 예시 및 안내
SELECT 'Usage examples and guidance...' as step;

/*
고객 회원가입 시 실행 순서:
1. Supabase Auth로 사용자 생성
2. users 테이블에 role='CUSTOMER'로 삽입
3. customer_profiles 테이블에 추가 정보 삽입 (선택사항)

예약 시:
- 회원: reservations.user_id에 users.id 저장
- 비회원: reservations.guest_email에 이메일 저장

결제 시:
- reservation_payments 테이블에 결제 정보 저장
- RLS 정책으로 자동으로 권한 제어
*/