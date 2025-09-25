# 🖼️ Supabase Storage 설정 가이드

## 📋 개요
시설 이미지 업로드 기능을 위한 Supabase Storage 설정 단계별 가이드

## 🔧 준비사항
- ✅ Supabase 프로젝트 생성됨
- ✅ 데이터베이스 설정 완료
- ✅ facilities 테이블 존재

## 📝 1단계: Storage 버킷 생성

### 1.1 Supabase 대시보드 접속
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 해당 프로젝트 선택
3. 좌측 메뉴에서 **Storage** 클릭

### 1.2 버킷 생성
1. **New Bucket** 버튼 클릭
2. 설정값 입력:
   ```
   Name: facility-images
   Public: ✅ (체크)
   File Size Limit: 52428800 (50MB)
   Allowed MIME types: image/jpeg,image/png,image/webp
   ```
3. **Save** 버튼 클릭

### 1.3 버킷 설정 확인
- 생성된 `facility-images` 버킷이 목록에 표시되는지 확인
- Public 상태인지 확인 (🌐 아이콘 표시)

## 🔒 2단계: SQL 스크립트 실행

### 2.1 프로젝트 ID 확인
1. Supabase Dashboard → Settings → General
2. **Reference ID** 복사 (예: `abcdefghijklmnop`)

### 2.2 SQL 스크립트 수정
1. `docs/database-scripts/setup-storage.sql` 파일 열기
2. **모든** `your-project` 부분을 실제 프로젝트 ID로 변경:
   ```sql
   -- 변경 전
   'https://your-project.supabase.co/storage/v1/object/public/facility-images/'

   -- 변경 후 (예시)
   'https://abcdefghijklmnop.supabase.co/storage/v1/object/public/facility-images/'
   ```

### 2.3 SQL 스크립트 실행
1. Supabase Dashboard → SQL Editor
2. **New Query** 클릭
3. `setup-storage.sql` 파일 내용 복사하여 붙여넣기
4. **Run** 버튼 클릭

### 2.4 실행 결과 확인
성공적으로 실행되면 다음과 같은 결과가 표시됩니다:
```
CREATE POLICY
CREATE FUNCTION
CREATE VIEW
CREATE TABLE
CREATE TRIGGER
```

## ✅ 3단계: 설정 검증

### 3.1 정책 생성 확인
SQL Editor에서 실행:
```sql
SELECT
    policyname as policy_name,
    cmd as command
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname LIKE '%facility image%';
```

**예상 결과:**
```
policy_name                      | command
Admin can upload facility images | INSERT
Admin can update facility images | UPDATE
Admin can delete facility images | DELETE
Anyone can view facility images   | SELECT
```

### 3.2 함수 생성 확인
SQL Editor에서 실행:
```sql
SELECT proname as function_name
FROM pg_proc
WHERE proname LIKE '%facility_image%'
ORDER BY proname;
```

**예상 결과:**
```
function_name
get_facility_image_optimized_url
get_facility_image_url
log_facility_image_change
```

### 3.3 뷰 생성 확인
SQL Editor에서 실행:
```sql
SELECT * FROM facility_image_stats LIMIT 1;
```

에러 없이 실행되고 컬럼이 표시되면 성공입니다.

## 🚀 4단계: 테스트 업로드

### 4.1 수동 테스트
1. Supabase Dashboard → Storage → facility-images
2. **Upload File** 클릭
3. 테스트 이미지 파일 업로드
4. 업로드된 파일의 URL 복사

### 4.2 URL 테스트
브라우저에서 복사한 URL에 접속하여 이미지가 정상 표시되는지 확인

## 🔧 문제 해결

### 오류: "policy already exists"
```sql
-- 기존 정책 삭제 후 재실행
DROP POLICY IF EXISTS "Admin can upload facility images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update facility images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete facility images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view facility images" ON storage.objects;
```

### 오류: "function already exists"
```sql
-- 기존 함수 삭제 후 재실행
DROP FUNCTION IF EXISTS get_facility_image_url(TEXT);
DROP FUNCTION IF EXISTS get_facility_image_optimized_url(TEXT, INTEGER, INTEGER, INTEGER);
```

### 오류: "bucket not found"
- 버킷 이름이 정확한지 확인 (`facility-images`)
- 버킷이 생성되었는지 Storage 페이지에서 확인

## 📊 설정 완료 체크리스트

- [ ] `facility-images` 버킷 생성됨
- [ ] 버킷이 Public으로 설정됨
- [ ] SQL 스크립트 성공적으로 실행됨
- [ ] 4개 정책 생성 확인됨
- [ ] 3개 함수 생성 확인됨
- [ ] `facility_image_stats` 뷰 생성 확인됨
- [ ] `facility_image_logs` 테이블 생성 확인됨
- [ ] 테스트 이미지 업로드 성공
- [ ] 이미지 URL 접속 가능

## 🎯 다음 단계
✅ Storage 설정 완료 후:
1. 백엔드 이미지 업로드 API 개발
2. 관리자 UI 이미지 업로드 컴포넌트 구현
3. 고객 UI 이미지 표시 기능 구현

---

**📝 작성일**: 2025-09-25
**🔄 업데이트**: Storage 설정 단계별 가이드 완성
**📧 문의**: 설정 과정에서 오류 발생 시 체크리스트 확인 후 문의