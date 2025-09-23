-- ========================================
-- USER 역할을 CUSTOMER로 마이그레이션
-- 실행일: 2025-09-22
-- 목적: 역할 체계 단순화 (ADMIN, MANAGER, CUSTOMER)
-- ========================================

-- 1단계: 현재 상태 확인
SELECT 'Checking current role distribution...' as step;

-- 현재 users 테이블의 role 분포 확인
SELECT
    role,
    COUNT(*) as count,
    string_agg(DISTINCT email, ', ') as sample_emails
FROM users
GROUP BY role
ORDER BY role;

-- 2단계: USER 역할을 CUSTOMER로 변경
SELECT 'Migrating USER role to CUSTOMER...' as step;

-- 기존 USER 역할을 모두 CUSTOMER로 변경
UPDATE users
SET
    role = 'CUSTOMER',
    updated_at = NOW()
WHERE role = 'USER';

-- 변경 결과 확인
SELECT 'Migration completed. Updated rows:' as info, ROW_COUNT() as updated_count;

-- 3단계: 마이그레이션 결과 확인
SELECT 'Verifying migration results...' as step;

-- 변경 후 role 분포 재확인
SELECT
    role,
    COUNT(*) as count,
    string_agg(DISTINCT email, ', ') as sample_emails
FROM users
GROUP BY role
ORDER BY role;

-- 4단계: enum에서 USER 제거 준비
SELECT 'Checking if USER role can be removed from enum...' as step;

-- USER 역할을 사용하는 데이터가 남아있는지 확인
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM users WHERE role = 'USER')
        THEN '❌ USER role still in use - cannot remove from enum'
        ELSE '✅ USER role not in use - safe to remove from enum'
    END as user_role_status;

-- 5단계: enum에서 USER 값 제거 (PostgreSQL은 enum 값 제거가 복잡함)
SELECT 'Creating new enum without USER...' as step;

-- 새로운 enum 타입 생성 (USER 제외)
DO $$
BEGIN
    -- 새로운 role enum 생성
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_new') THEN
        CREATE TYPE user_role_new AS ENUM ('ADMIN', 'MANAGER', 'CUSTOMER');
        RAISE NOTICE '✅ Created new user_role_new enum';
    ELSE
        RAISE NOTICE 'ℹ️ user_role_new enum already exists';
    END IF;
END
$$;

-- 6단계: users 테이블 컬럼 타입 변경
SELECT 'Updating users table to use new enum...' as step;

-- 임시 컬럼 추가
ALTER TABLE users ADD COLUMN role_new user_role_new;

-- 기존 role 값을 새 컬럼으로 복사
UPDATE users SET role_new =
    CASE
        WHEN role = 'ADMIN' THEN 'ADMIN'::user_role_new
        WHEN role = 'MANAGER' THEN 'MANAGER'::user_role_new
        WHEN role = 'CUSTOMER' THEN 'CUSTOMER'::user_role_new
        WHEN role = 'USER' THEN 'CUSTOMER'::user_role_new  -- USER는 CUSTOMER로 변환
        ELSE 'CUSTOMER'::user_role_new  -- 기본값
    END;

-- NOT NULL 제약조건 추가
ALTER TABLE users ALTER COLUMN role_new SET NOT NULL;

-- 기존 role 컬럼 삭제
ALTER TABLE users DROP COLUMN role;

-- 새 컬럼 이름을 role로 변경
ALTER TABLE users RENAME COLUMN role_new TO role;

-- 7단계: 기존 enum 삭제 및 새 enum 이름 변경
SELECT 'Finalizing enum cleanup...' as step;

-- 기존 user_role enum 삭제
DROP TYPE user_role;

-- 새 enum 이름을 user_role로 변경
ALTER TYPE user_role_new RENAME TO user_role;

-- 8단계: 최종 확인
SELECT 'Final verification...' as step;

-- 최종 role 분포 확인
SELECT
    'Final role distribution' as info,
    role,
    COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- enum 값 확인
SELECT
    'Available roles in enum' as info,
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) as available_roles
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

SELECT '🎉 USER to CUSTOMER migration completed successfully!' as result;

-- 9단계: 안내 메시지
SELECT 'Important notes...' as step;

/*
마이그레이션 완료!

변경사항:
1. 기존 USER 역할 → CUSTOMER 역할로 모두 변경
2. user_role enum에서 USER 값 제거
3. 최종 역할: ADMIN, MANAGER, CUSTOMER

주의사항:
- 모든 기존 USER는 이제 CUSTOMER로 취급됩니다
- 애플리케이션 코드에서 'USER' 참조를 'CUSTOMER'로 변경 필요
- RLS 정책들도 업데이트된 역할 체계를 사용합니다
*/