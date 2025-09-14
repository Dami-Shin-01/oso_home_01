# Claude 개발 워크플로우

## 프로젝트 구조
- **개발 환경**: `C:\bbq-project\bbq-reservation-system` (로컬 폴더)
- **백업**: `G:\내 드라이브\5.오소마케팅\3. homepage` (구글드라이브)
- **원격 저장소**: https://github.com/Dami-Shin-01/oso_home_01.git
- **배포**: Vercel (자동 배포)

## 개발 워크플로우
1. 로컬 폴더에서 개발 작업 진행
2. 변경사항 커밋 및 GitHub 푸시
3. Vercel 자동 배포 (GitHub 웹훅 연동)
4. 주기적으로 구글드라이브에 백업

## 터미널 작업 시 주의사항
- **작업 디렉토리**: 항상 `cd "C:\bbq-project\bbq-reservation-system"` 실행
- **Git 작업**: 로컬 폴더에서 진행
- **npm 명령어**: 로컬 폴더에서 실행

## 빌드 및 테스트 명령어
```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# 린트 검사 (설정 시)
npm run lint
```

## 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키 (서버에서만 사용)

## 관리자 기능
- **DB 테스트**: `/admin` 페이지에서 "DB 테스트" 버튼 클릭
- **전체 DB 테스트**: `/test-db` (모든 테이블 확인)
- **연결 테스트**: `/test-connection` (기본 연결만 확인)

## 주요 구현 완료 사항
- [x] Supabase 데이터베이스 설정 및 RLS 정책
- [x] TypeScript 타입 안전성 구현
- [x] GitHub-Vercel 자동 배포 파이프라인
- [x] 관리자 대시보드에 DB 테스트 기능 통합
- [x] 개발 워크플로우 표준화

## 다음 개발 단계
1. 백엔드 API 개발 (인증 및 사용자 프로필)
2. 네이버 로그인 커스텀 구현
3. 예약 시스템 API 개발
4. 관리자 API 개발