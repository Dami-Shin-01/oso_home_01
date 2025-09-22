-- ========================================
-- 고객 시스템 테이블 추가
-- 실행일: 2025-09-22
-- 목적: 고객 인증 및 예약 시스템 구현을 위한 테이블 생성
-- ========================================

-- 고객 테이블 (회원가입한 고객 정보)
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Supabase Auth 사용시 NULL 가능
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 고객 프로필 테이블 (추가 정보)
CREATE TABLE customer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  birth_date DATE,
  address TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  preferred_contact VARCHAR(20) DEFAULT 'email', -- email, phone, both
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 예약 결제 테이블
CREATE TABLE reservation_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL, -- card, transfer, cash, etc
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  transaction_id VARCHAR(100),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정 (고객용)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_payments ENABLE ROW LEVEL SECURITY;

-- 고객은 자신의 정보만 조회/수정 가능
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Customers can update own data" ON customers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow customer registration" ON customers
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 고객 프로필 정책
CREATE POLICY "Customers can view own profiles" ON customer_profiles
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update own profiles" ON customer_profiles
  FOR ALL USING (auth.uid() = customer_id);

-- 결제 정보 정책 (고객은 자신의 예약 결제만 조회)
CREATE POLICY "Customers can view own payments" ON reservation_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
      AND (r.user_id = auth.uid() OR r.customer_email = auth.email())
    )
  );

-- 관리자는 모든 테이블에 접근 가능
CREATE POLICY "Admins can access all customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "Admins can access all customer profiles" ON customer_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'MANAGER')
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

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customer_profiles_customer_id ON customer_profiles(customer_id);
CREATE INDEX idx_reservation_payments_reservation_id ON reservation_payments(reservation_id);
CREATE INDEX idx_reservation_payments_status ON reservation_payments(payment_status);