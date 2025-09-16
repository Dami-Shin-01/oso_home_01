-- 전체 데이터베이스 구조 확인 스크립트
-- Supabase SQL Editor에서 실행해서 결과를 복사해주세요

-- 1. 현재 존재하는 모든 테이블 목록
SELECT '=== 현재 존재하는 테이블 목록 ===' as info;
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. 모든 테이블의 컬럼 구조 확인
SELECT '=== USERS 테이블 구조 ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

SELECT '=== FACILITIES 테이블 구조 ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'facilities'
ORDER BY ordinal_position;

SELECT '=== SITES 테이블 구조 ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'sites'
ORDER BY ordinal_position;

SELECT '=== RESERVATIONS 테이블 구조 ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'reservations'
ORDER BY ordinal_position;

SELECT '=== NOTICES 테이블 구조 ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'notices'
ORDER BY ordinal_position;

SELECT '=== FAQS 테이블 구조 ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'faqs'
ORDER BY ordinal_position;

SELECT '=== SITE_TYPES 테이블 구조 ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'site_types'
ORDER BY ordinal_position;

SELECT '=== RESERVATION_ADD_ONS 테이블 구조 ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'reservation_add_ons'
ORDER BY ordinal_position;

-- 3. 외래키 제약조건 확인
SELECT '=== 외래키 제약조건 ===' as info;
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. 기존 RLS 정책 확인
SELECT '=== RLS 정책 현황 ===' as info;
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. 인덱스 확인
SELECT '=== 인덱스 현황 ===' as info;
SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary,
    a.attname AS column_name
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relkind = 'r'
    AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY t.relname, i.relname, a.attname;