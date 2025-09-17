-- ========================================
-- 누락된 테이블 추가: notices, faqs
-- ========================================
-- 실행 방법: Supabase SQL Editor에서 실행

-- 1. notices 테이블 생성 (공지사항)
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

-- 2. faqs 테이블 생성 (자주 묻는 질문)
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

-- 3. RLS 정책 설정 (Row Level Security)

-- notices 테이블 RLS 활성화
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- notices 읽기 정책 (모든 사용자가 공개된 공지사항 조회 가능)
CREATE POLICY "notices_select_policy" ON notices
    FOR SELECT
    USING (is_published = true);

-- notices 쓰기 정책 (관리자만 작성 가능)
CREATE POLICY "notices_insert_policy" ON notices
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- notices 수정 정책 (관리자만 수정 가능)
CREATE POLICY "notices_update_policy" ON notices
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- faqs 테이블 RLS 활성화
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- faqs 읽기 정책 (모든 사용자가 공개된 FAQ 조회 가능)
CREATE POLICY "faqs_select_policy" ON faqs
    FOR SELECT
    USING (is_published = true);

-- faqs 쓰기 정책 (관리자만 작성 가능)
CREATE POLICY "faqs_insert_policy" ON faqs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- faqs 수정 정책 (관리자만 수정 가능)
CREATE POLICY "faqs_update_policy" ON faqs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices(is_published);
CREATE INDEX IF NOT EXISTS idx_notices_important ON notices(is_important);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(is_published);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(order_index);

-- 5. 샘플 데이터 삽입 (테스트용)
INSERT INTO notices (title, content, is_important, author_id) VALUES
('바베큐장 이용 안내', '바베큐장 이용에 대한 기본 안내사항입니다.', true, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)),
('예약 시 주의사항', '예약 시 확인해야 할 주의사항들을 안내드립니다.', false, (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO faqs (question, answer, category, order_index) VALUES
('예약은 어떻게 하나요?', '홈페이지에서 원하는 날짜와 시간을 선택하여 예약할 수 있습니다.', 'reservation', 1),
('취소는 언제까지 가능한가요?', '예약일 1일 전까지 취소 가능합니다.', 'reservation', 2),
('주차는 가능한가요?', '네, 무료 주차장을 이용하실 수 있습니다.', 'facility', 3)
ON CONFLICT DO NOTHING;

-- 실행 완료 메시지
SELECT 'notices와 faqs 테이블 생성이 완료되었습니다.' as result;