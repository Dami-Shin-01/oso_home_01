-- 고객 시스템용 데이터베이스 테이블 생성 스크립트
-- 작성일: 2025-09-22
-- 목적: MVP 고객 시스템 기반 테이블 구축

-- 1. 고객 테이블 생성
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  birth_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. 고객 프로필 테이블 생성
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  address TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  preferred_contact VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact IN ('email', 'sms', 'both')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 예약 결제 테이블 생성
CREATE TABLE IF NOT EXISTS reservation_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('card', 'bank_transfer', 'on_site')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 고객 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- 5. 고객 프로필 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customer_profiles_customer_id ON customer_profiles(customer_id);

-- 6. 예약 결제 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reservation_payments_reservation_id ON reservation_payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_status ON reservation_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_method ON reservation_payments(payment_method);

-- 7. RLS (Row Level Security) 정책 설정
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_payments ENABLE ROW LEVEL SECURITY;

-- 8. 고객 테이블 RLS 정책
CREATE POLICY "Users can view own customer data" ON customers
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own customer data" ON customers
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own customer data" ON customers
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- 9. 고객 프로필 테이블 RLS 정책
CREATE POLICY "Users can view own profile" ON customer_profiles
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can update own profile" ON customer_profiles
  FOR UPDATE USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can insert own profile" ON customer_profiles
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid()::text = id::text
    )
  );

-- 10. 예약 결제 테이블 RLS 정책
CREATE POLICY "Users can view own payments" ON reservation_payments
  FOR SELECT USING (
    reservation_id IN (
      SELECT id FROM reservations
      WHERE user_id IS NOT NULL
      AND auth.uid()::text = user_id::text
    )
  );

-- 11. 관리자는 모든 데이터 접근 가능
CREATE POLICY "Admins can access all customer data" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can access all customer profiles" ON customer_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can access all payments" ON reservation_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- 12. 함수: 고객 정보 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. 트리거: updated_at 자동 갱신
CREATE TRIGGER trigger_update_customer_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_updated_at();

-- 14. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '고객 시스템 데이터베이스 테이블 생성 완료!';
  RAISE NOTICE '생성된 테이블: customers, customer_profiles, reservation_payments';
  RAISE NOTICE 'RLS 정책, 인덱스, 트리거 모두 설정 완료';
END $$;