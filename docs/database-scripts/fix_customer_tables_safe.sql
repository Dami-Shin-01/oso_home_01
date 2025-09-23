-- ========================================
-- 고객 테이블 안전 수정 스크립트
-- 실행일: 2025-09-22
-- 목적: 기존 데이터 보존하면서 RLS 정책 오류 수정
-- ========================================

-- 1단계: 현재 생성된 테이블 확인
SELECT 'Checking existing tables...' as step;

SELECT table_name,
       CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('customers', 'customer_profiles', 'reservation_payments');

-- 2단계: 테이블부터 먼저 생성 (정책 삭제는 나중에)
SELECT 'Creating tables first...' as step;

-- 3단계: 누락된 테이블 생성 (없는 경우에만)

-- customers 테이블이 없으면 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') THEN
        CREATE TABLE customers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
        );

        ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'Created customers table';
    ELSE
        RAISE NOTICE 'customers table already exists';
    END IF;
END
$$;

-- customer_profiles 테이블이 없으면 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_profiles') THEN
        CREATE TABLE customer_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
          birth_date DATE,
          address TEXT,
          marketing_consent BOOLEAN DEFAULT false,
          preferred_contact VARCHAR(20) DEFAULT 'email',
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'Created customer_profiles table';
    ELSE
        RAISE NOTICE 'customer_profiles table already exists';
    END IF;
END
$$;

-- reservation_payments 테이블이 없으면 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reservation_payments') THEN
        CREATE TABLE reservation_payments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          payment_method VARCHAR(20) NOT NULL,
          payment_status VARCHAR(20) DEFAULT 'pending',
          transaction_id VARCHAR(100),
          paid_at TIMESTAMPTZ,
          refunded_at TIMESTAMPTZ,
          refund_amount DECIMAL(10,2),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE reservation_payments ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'Created reservation_payments table';
    ELSE
        RAISE NOTICE 'reservation_payments table already exists';
    END IF;
END
$$;

-- 4단계: 기존 RLS 정책 삭제 (테이블이 생성된 후)
SELECT 'Removing existing policies...' as step;

-- customers 테이블 정책 삭제
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Customers can update own data" ON customers;
DROP POLICY IF EXISTS "Allow customer registration" ON customers;
DROP POLICY IF EXISTS "Admins can access all customers" ON customers;

CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Customers can update own data" ON customers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow customer registration" ON customers
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can access all customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'MANAGER')
    )
  );

-- customer_profiles 테이블 정책
DROP POLICY IF EXISTS "Customers can view own profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Customers can update own profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Admins can access all customer profiles" ON customer_profiles;

CREATE POLICY "Customers can view own profiles" ON customer_profiles
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update own profiles" ON customer_profiles
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "Admins can access all customer profiles" ON customer_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'MANAGER')
    )
  );

-- reservation_payments 테이블 정책 (수정된 버전)
DROP POLICY IF EXISTS "Admins can access all payments" ON reservation_payments;

-- 올바른 컬럼명 사용: guest_email
CREATE POLICY "Customers can view own payments" ON reservation_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
      AND (r.user_id = auth.uid() OR r.guest_email = auth.email())
    )
  );

CREATE POLICY "Admins can access all payments" ON reservation_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'MANAGER')
    )
  );

-- 5단계: 인덱스 생성 (없는 경우에만)
SELECT 'Creating indexes if needed...' as step;

DO $$
BEGIN
    -- customers 테이블 인덱스
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_customers_email') THEN
        CREATE INDEX idx_customers_email ON customers(email);
        RAISE NOTICE 'Created index on customers.email';
    END IF;

    -- customer_profiles 테이블 인덱스
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_customer_profiles_customer_id') THEN
        CREATE INDEX idx_customer_profiles_customer_id ON customer_profiles(customer_id);
        RAISE NOTICE 'Created index on customer_profiles.customer_id';
    END IF;

    -- reservation_payments 테이블 인덱스
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_reservation_payments_reservation_id') THEN
        CREATE INDEX idx_reservation_payments_reservation_id ON reservation_payments(reservation_id);
        RAISE NOTICE 'Created index on reservation_payments.reservation_id';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_reservation_payments_status') THEN
        CREATE INDEX idx_reservation_payments_status ON reservation_payments(payment_status);
        RAISE NOTICE 'Created index on reservation_payments.payment_status';
    END IF;
END
$$;

-- 6단계: 최종 확인
SELECT 'Final verification...' as step;

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name) as policy_count,
  '✅ READY' as status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name IN ('customers', 'customer_profiles', 'reservation_payments')
ORDER BY t.table_name;