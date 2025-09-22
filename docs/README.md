# 📂 문서 및 리소스 디렉토리

## 📋 디렉토리 구조

```
docs/
├── README.md                              # 이 파일
├── screenshots/                           # 스크린샷 이미지 파일들
│   ├── admin-*.png                       # 관리자 시스템 스크린샷
│   ├── content-*.png                     # 콘텐츠 관련 스크린샷
│   ├── db-test-results.png               # DB 테스트 결과
│   └── notice-*.png                      # 공지사항 관련 스크린샷
├── database-scripts/                      # 데이터베이스 스크립트 파일들
│   ├── add_missing_tables.sql            # 누락 테이블 생성
│   ├── add_public_policies_only.sql      # RLS 정책 추가
│   ├── check_existing_schema.sql         # 스키마 확인
│   ├── database_fix.sql                  # 데이터베이스 수정
│   ├── database_rebuild.sql              # 데이터베이스 재구축
│   └── fix_content_publication_policies.sql # 콘텐츠 발행 정책 수정
├── tests/                                 # 테스트 파일들
│   └── (테스트 스크립트들이 여기에 위치)
├── archive/                               # 보관용 파일들
│   └── (더 이상 사용하지 않는 파일들)
└── 프로젝트 문서들
    ├── claude_v.01.md                    # 메인 프로젝트 문서
    ├── admin-user-journey-map.md         # 관리자 및 고객 사용자 여정 지도
    ├── current-progress-analysis.md       # 현재 진행 상황 분석
    ├── customer-system-development-checklist.md # 고객 시스템 개발 체크리스트
    └── mvp-detailed-todo-list.md         # MVP 상세 투두리스트
```

## 📊 파일 정리 내역 (2025-09-22)

### ✅ 이동된 파일들

#### 🖼️ 스크린샷 (screenshots/)
- 총 19개 PNG 파일 이동
- 관리자 시스템 테스트 스크린샷
- 모달 테스트 결과 이미지
- DB 테스트 결과 화면

#### 🗃️ 데이터베이스 스크립트 (database-scripts/)
- 총 6개 SQL 파일 이동
- 테이블 생성 및 수정 스크립트
- RLS 정책 설정 스크립트
- 스키마 검증 스크립트

#### 📋 프로젝트 문서 (docs/)
- 메인 프로젝트 문서
- 사용자 여정 지도
- 개발 계획서 및 체크리스트
- 진행 상황 분석 보고서

### 🎯 정리 효과

1. **루트 디렉토리 정리**: 개발에 필요한 핵심 파일만 루트에 유지
2. **파일 분류**: 용도별로 명확한 디렉토리 구조 생성
3. **접근성 향상**: 필요한 파일을 쉽게 찾을 수 있도록 구조화
4. **유지보수성**: 향후 파일 관리가 용이하도록 체계화

## 🔍 파일 찾기 가이드

### 관리자 시스템 관련
- **스크린샷**: `docs/screenshots/admin-*.png`
- **테스트 결과**: `docs/screenshots/db-test-results.png`

### 개발 관련
- **데이터베이스 작업**: `docs/database-scripts/`
- **프로젝트 계획**: `docs/mvp-detailed-todo-list.md`
- **진행 상황**: `docs/current-progress-analysis.md`

### 사용자 경험 관련
- **사용자 여정**: `docs/admin-user-journey-map.md`
- **고객 시스템 계획**: `docs/customer-system-development-checklist.md`

---

**정리 완료일**: 2025-09-22
**다음 정리 예정**: MVP 개발 완료 후
**담당**: Claude AI