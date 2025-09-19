-- ========================================
-- 콘텐츠 발행 관련 RLS 정책 수정
-- ========================================
-- 공지사항 및 FAQ 발행 로직 문제 해결을 위한 정책 추가

-- ========================================
-- 1. 공지사항(notices) 테이블 정책 수정
-- ========================================

-- 관리자(ADMIN/MANAGER)가 모든 공지사항을 조회할 수 있도록 허용
CREATE POLICY "notices_admin_select" ON notices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- 관리자(ADMIN/MANAGER)가 공지사항을 생성할 수 있도록 허용
CREATE POLICY "notices_admin_insert" ON notices
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- 관리자(ADMIN/MANAGER)가 공지사항을 수정할 수 있도록 허용
CREATE POLICY "notices_admin_update" ON notices
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- 관리자(ADMIN/MANAGER)가 공지사항을 삭제할 수 있도록 허용
CREATE POLICY "notices_admin_delete" ON notices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- ========================================
-- 2. FAQ 테이블 정책 수정
-- ========================================

-- 관리자(ADMIN/MANAGER)가 모든 FAQ를 조회할 수 있도록 허용
CREATE POLICY "faqs_admin_select" ON faqs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- 관리자(ADMIN/MANAGER)가 FAQ를 생성할 수 있도록 허용
CREATE POLICY "faqs_admin_insert" ON faqs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- 관리자(ADMIN/MANAGER)가 FAQ를 수정할 수 있도록 허용
CREATE POLICY "faqs_admin_update" ON faqs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- 관리자(ADMIN/MANAGER)가 FAQ를 삭제할 수 있도록 허용
CREATE POLICY "faqs_admin_delete" ON faqs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'MANAGER')
        )
    );

-- ========================================
-- 3. 기본값 확인 및 수정
-- ========================================

-- 공지사항의 기본 발행 상태를 false로 변경 (관리자가 명시적으로 발행하도록)
ALTER TABLE notices ALTER COLUMN is_published SET DEFAULT false;

-- FAQ의 기본 발행 상태를 false로 변경 (관리자가 명시적으로 발행하도록)
ALTER TABLE faqs ALTER COLUMN is_published SET DEFAULT false;

-- ========================================
-- 실행 완료 확인
-- ========================================
-- 이 스크립트를 실행한 후 다음을 확인하세요:
-- 1. 관리자 페이지에서 공지사항/FAQ 생성 시 발행 상태가 올바르게 저장되는지
-- 2. 발행된 콘텐츠가 공개 페이지에 표시되는지
-- 3. 비공개 콘텐츠가 공개 페이지에 표시되지 않는지