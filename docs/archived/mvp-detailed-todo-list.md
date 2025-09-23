# 🚀 오소 바베큐장 MVP 상세 투두리스트

## 📊 MVP 개요
**목표**: 2-3주 내 고객이 실제 예약할 수 있는 최소 기능 제품 완성
**핵심 기능**: 회원가입 → 로그인 → 시설 조회 → 예약 → 결제 → 관리
**성공 기준**: 실제 고객이 예약을 완료할 수 있는 상태

---

## 📅 Week 1: 기반 시스템 구축

### 🗓️ Day 1-2: 데이터베이스 설계 및 구축

#### ✅ 1.1 고객 테이블 설계 - **✅ 완룼됨**
- [x] **통합 users 테이블 구조 구현** ✅
  - 기존 users 테이블에 CUSTOMER role 추가
  - ADMIN, MANAGER, CUSTOMER 역할 기반 통합 구조
  - USER → CUSTOMER 마이그레이션 완료

- [x] **customer_profiles 테이블 설계 완룼** ✅
  - users 테이블과 연결되는 고객 추가 정보 테이블
  - RLS 정책 설정 완료
  - 인덱스 및 제약조건 설정 완료

#### ✅ 1.2 예약 시스템 테이블 설계
- [ ] **reservations 테이블 생성**
  ```sql
  CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    facility_id UUID REFERENCES facilities(id),
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    guest_count INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded
    payment_method VARCHAR(20), -- card, bank_transfer, on_site
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [ ] **reservation_payments 테이블 생성**
  ```sql
  CREATE TABLE reservation_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(100),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

#### ✅ 1.3 RLS 정책 설정
- [ ] **customers 테이블 RLS**
  ```sql
  ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view own data" ON customers FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Users can update own data" ON customers FOR UPDATE USING (auth.uid() = id);
  ```

- [ ] **reservations 테이블 RLS**
  ```sql
  ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view own reservations" ON reservations FOR SELECT USING (auth.uid() = customer_id);
  CREATE POLICY "Users can create own reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = customer_id);
  ```

### 🗓️ Day 3-4: 인증 시스템 구현

#### ✅ 2.1 Supabase Auth 설정 확장
- [ ] **환경 변수 확인 및 업데이트**
  - [ ] `.env.local`에 기존 Supabase 설정 확인
  - [ ] 고객용 리디렉션 URL 추가 설정

- [ ] **인증 유틸리티 함수 생성**
  - [ ] `src/lib/auth-customer.ts` 파일 생성
  ```typescript
  export const signUpCustomer = async (email: string, password: string, name: string) => {
    // 고객 회원가입 로직
  }

  export const signInCustomer = async (email: string, password: string) => {
    // 고객 로그인 로직
  }

  export const signOut = async () => {
    // 로그아웃 로직
  }
  ```

#### ✅ 2.2 회원가입 페이지 구현 - **⚠️ 대기 중**
- [ ] **페이지 생성**: `src/app/register/page.tsx` (다음 단계)
- [ ] **회원가입 폼 컴포넌트** (다음 단계)
  - [ ] 이메일 입력 필드 (validation 포함)
  - [ ] 비밀번호 입력 필드 (강도 체크)
  - [ ] 비밀번호 확인 필드
  - [ ] 이름 입력 필드
  - [ ] 휴대폰 번호 입력 필드
  - [ ] 마케팅 수신 동의 체크박스
  - [ ] 회원가입 버튼

**현재 상태**: 백엔드 API 준비 완료, 프론트엔드 UI 구현 대기 중

- [ ] **폼 검증 로직**
  - [ ] 이메일 형식 검증
  - [ ] 비밀번호 복잡성 검증 (8자 이상, 특수문자 포함)
  - [ ] 필수 필드 검증
  - [ ] 중복 이메일 체크

- [ ] **회원가입 프로세스**
  - [ ] Supabase Auth 회원가입 연동
  - [ ] customers 테이블에 추가 정보 저장
  - [ ] 성공 시 이메일 인증 안내
  - [ ] 실패 시 오류 메시지 표시

#### ✅ 2.3 로그인 페이지 구현
- [ ] **기존 로그인 페이지 수정**: `src/app/login/page.tsx`
- [ ] **고객/관리자 구분 탭 추가**
  - [ ] "고객 로그인" 탭
  - [ ] "관리자 로그인" 탭 (기존 유지)

- [ ] **고객 로그인 폼** (DaisyUI 컴포넌트 사용)
  - [ ] 이메일 입력 필드 (DaisyUI input)
  - [ ] 비밀번호 입력 필드 (DaisyUI input)
  - [ ] "로그인 상태 유지" 체크박스 (DaisyUI checkbox)
  - [ ] 로그인 버튼 (DaisyUI btn-primary)
  - [ ] "회원가입" 링크 (DaisyUI link)
  - [ ] "비밀번호 찾기" 링크 (DaisyUI link)

- [ ] **로그인 처리 로직**
  - [ ] Supabase Auth 로그인 연동
  - [ ] 성공 시 메인 페이지로 리디렉션
  - [ ] 실패 시 오류 메시지 표시
  - [ ] 관리자/고객 역할 구분 처리

### 🗓️ Day 5-7: 고객 인터페이스 기본 구조

#### ✅ 3.1 고객용 레이아웃 컴포넌트
- [ ] **고객용 헤더 컴포넌트**: `src/components/customer/Header.tsx` (DaisyUI navbar)
  - [ ] 로고 (DaisyUI navbar-start)
  - [ ] 네비게이션 메뉴 (홈, 시설, 예약내역, 마이페이지) (DaisyUI navbar-center)
  - [ ] 로그인/로그아웃 버튼 (DaisyUI navbar-end)
  - [ ] 사용자 프로필 드롭다운 (DaisyUI dropdown)

- [ ] **고객용 푸터 컴포넌트**: `src/components/customer/Footer.tsx` (DaisyUI footer)
  - [ ] 연락처 정보 (DaisyUI footer 레이아웃)
  - [ ] 이용약관 링크 (DaisyUI link)
  - [ ] 개인정보처리방침 링크 (DaisyUI link)
  - [ ] SNS 링크 (DaisyUI social icons)

- [ ] **고객용 레이아웃**: `src/components/customer/Layout.tsx` (DaisyUI 레이아웃)
  - [ ] 헤더, 메인 콘텐츠, 푸터 구조 (DaisyUI drawer 고려)
  - [ ] 인증 상태 체크 (DaisyUI loading)
  - [ ] 로딩 상태 처리 (DaisyUI loading 스피너)

#### ✅ 3.2 인증 미들웨어 설정
- [ ] **미들웨어 파일 업데이트**: `middleware.ts`
- [ ] **고객 전용 라우트 보호**
  - [ ] `/customer/*` 경로 인증 체크
  - [ ] `/my-page` 인증 체크
  - [ ] 미인증 시 로그인 페이지로 리디렉션

- [ ] **인증 상태 Context 생성**
  - [ ] `src/contexts/AuthContext.tsx`
  - [ ] 전역 인증 상태 관리
  - [ ] 사용자 정보 제공

---

## 📅 Week 2: 시설 조회 및 예약 시스템

### 🗓️ Day 8-10: 시설 조회 시스템

#### ✅ 4.1 시설 목록 페이지
- [ ] **페이지 생성**: `src/app/facilities/page.tsx`
- [ ] **시설 카드 컴포넌트**: `src/components/customer/FacilityCard.tsx`
  - [ ] 시설 이미지
  - [ ] 시설명 및 설명
  - [ ] 수용인원 정보
  - [ ] 가격 정보 (평일/주말)
  - [ ] "예약하기" 버튼
  - [ ] 시설 타입 배지

- [ ] **필터링 컴포넌트**: `src/components/customer/FacilityFilter.tsx`
  - [ ] 인원수 필터 (드롭다운)
  - [ ] 가격대 필터 (슬라이더)
  - [ ] 시설 타입 필터 (체크박스)
  - [ ] 필터 초기화 버튼

- [ ] **시설 데이터 페칭**
  - [ ] Supabase에서 facilities 데이터 조회
  - [ ] 실시간 업데이트 구독
  - [ ] 로딩 및 에러 상태 처리

#### ✅ 4.2 시설 상세 정보 모달
- [ ] **상세 모달 컴포넌트**: `src/components/customer/FacilityDetailModal.tsx`
- [ ] **모달 내용**
  - [ ] 시설 이미지 갤러리
  - [ ] 상세 설명
  - [ ] 편의시설 정보
  - [ ] 위치 정보 (지도 API 연동 고려)
  - [ ] 이용 규칙
  - [ ] 실시간 예약 가능 상태
  - [ ] "예약하기" 버튼

- [ ] **예약 가능 상태 확인**
  - [ ] 실시간 예약 조회 함수
  - [ ] 날짜별 가능 시간 표시
  - [ ] 예약 불가 시간 비활성화

### 🗓️ Day 11-14: 예약 프로세스 구현

#### ✅ 5.1 예약 페이지 라우팅
- [ ] **동적 라우팅**: `src/app/reservation/[facilityId]/page.tsx`
- [ ] **예약 단계별 컴포넌트 구조**
  - [ ] 1단계: 날짜/시간 선택
  - [ ] 2단계: 예약 정보 입력
  - [ ] 3단계: 결제 방법 선택
  - [ ] 4단계: 예약 확인

#### ✅ 5.2 날짜/시간 선택 컴포넌트
- [ ] **달력 컴포넌트**: `src/components/customer/DatePicker.tsx`
  - [ ] react-datepicker 또는 자체 구현
  - [ ] 과거 날짜 비활성화
  - [ ] 예약 불가 날짜 표시
  - [ ] 공휴일 표시

- [ ] **시간 선택 컴포넌트**: `src/components/customer/TimePicker.tsx`
  - [ ] 이용 가능 시간대 표시
  - [ ] 이미 예약된 시간 비활성화
  - [ ] 최소/최대 이용 시간 제한
  - [ ] 시간대별 가격 표시

#### ✅ 5.3 예약 정보 입력 폼
- [ ] **예약 폼 컴포넌트**: `src/components/customer/ReservationForm.tsx`
- [ ] **입력 필드**
  - [ ] 이용 인원수 선택
  - [ ] 예약자 연락처 (기본값: 회원 정보)
  - [ ] 특별 요청사항 텍스트 영역
  - [ ] 추가 서비스 선택 (옵션)

- [ ] **가격 계산 컴포넌트**: `src/components/customer/PriceCalculator.tsx`
  - [ ] 기본 이용료 계산
  - [ ] 시간 연장료 계산
  - [ ] 추가 서비스 요금 계산
  - [ ] 총 결제 금액 표시
  - [ ] 할인 적용 (쿠폰 등)

#### ✅ 5.4 결제 방법 선택
- [ ] **결제 방법 컴포넌트**: `src/components/customer/PaymentMethod.tsx`
- [ ] **결제 옵션**
  - [ ] 무통장 입금 (계좌 정보 표시)
  - [ ] 현장 결제 (선택 시 주의사항 안내)
  - [ ] 카드 결제 (추후 PG사 연동 준비)

- [ ] **무통장 입금 처리**
  - [ ] 입금 계좌 정보 표시
  - [ ] 입금자명 안내 (예약번호 포함)
  - [ ] 입금 기한 안내
  - [ ] 입금 확인 절차 안내

---

## 📅 Week 3: 예약 관리 및 마이페이지

### 🗓️ Day 15-17: 예약 완료 및 관리

#### ✅ 6.1 예약 완료 처리
- [ ] **예약 생성 API 함수**: `src/lib/api/reservations.ts`
```typescript
export const createReservation = async (reservationData: {
  customer_id: string;
  facility_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  total_amount: number;
  payment_method: string;
  special_requests?: string;
}) => {
  // Supabase insertion logic
}
```

- [ ] **예약 확인 페이지**: `src/app/reservation/confirmation/page.tsx`
  - [ ] 예약 정보 요약 표시
  - [ ] 예약번호 생성 및 표시
  - [ ] 결제 안내 (무통장 입금 정보)
  - [ ] 예약 변경/취소 정책 안내
  - [ ] 이메일 전송 버튼

#### ✅ 6.2 이메일 알림 시스템 (기본)
- [ ] **이메일 템플릿 생성**
  - [ ] 예약 확인 이메일 HTML 템플릿
  - [ ] 예약 정보 포함 (날짜, 시간, 시설, 금액)
  - [ ] 주의사항 및 연락처 포함

- [ ] **이메일 발송 함수**: `src/lib/email.ts`
  - [ ] Resend 또는 SendGrid 연동
  - [ ] 예약 확인 이메일 발송
  - [ ] 에러 처리 및 재시도 로직

### 🗓️ Day 18-21: 마이페이지 구현

#### ✅ 7.1 마이페이지 메인
- [ ] **마이페이지 라우팅**: `src/app/my-page/page.tsx`
- [ ] **사용자 대시보드**
  - [ ] 예약 현황 요약 (진행중, 완료, 취소)
  - [ ] 다가오는 예약 표시
  - [ ] 최근 이용 내역
  - [ ] 빠른 액션 버튼들

#### ✅ 7.2 예약 내역 관리
- [ ] **예약 목록 페이지**: `src/app/my-page/reservations/page.tsx`
- [ ] **예약 카드 컴포넌트**: `src/components/customer/ReservationCard.tsx`
  - [ ] 예약 정보 (날짜, 시간, 시설)
  - [ ] 예약 상태 배지
  - [ ] 결제 상태 표시
  - [ ] 액션 버튼 (상세보기, 취소)

- [ ] **예약 상세 모달**: `src/components/customer/ReservationDetailModal.tsx`
  - [ ] 전체 예약 정보 표시
  - [ ] 결제 정보 상세
  - [ ] 예약 변경/취소 버튼
  - [ ] 영수증 다운로드 (추후)

#### ✅ 7.3 예약 취소 기능
- [ ] **예약 취소 모달**: `src/components/customer/CancelReservationModal.tsx`
  - [ ] 취소 정책 안내
  - [ ] 취소 사유 선택
  - [ ] 환불 안내
  - [ ] 취소 확인 버튼

- [ ] **취소 처리 로직**
  - [ ] 예약 상태 업데이트
  - [ ] 결제 상태 처리
  - [ ] 취소 확인 이메일 발송

#### ✅ 7.4 개인정보 관리
- [ ] **프로필 페이지**: `src/app/my-page/profile/page.tsx`
- [ ] **프로필 수정 폼**
  - [ ] 기본 정보 수정 (이름, 전화번호)
  - [ ] 비밀번호 변경
  - [ ] 마케팅 수신 설정
  - [ ] 회원 탈퇴 (비활성화)

---

## 🔧 기술적 구현 세부사항

### 📦 필요한 패키지 설치
```bash
npm install react-hook-form @hookform/resolvers zod
npm install react-datepicker @types/react-datepicker
npm install react-hot-toast
npm install @radix-ui/react-dialog @radix-ui/react-tabs
npm install lucide-react
npm install date-fns
```

### 🎨 UI 컴포넌트 라이브러리
- [ ] **공통 컴포넌트 확장**
  - [ ] Button 컴포넌트 variants 추가
  - [ ] Input 컴포넌트 validation 상태
  - [ ] Modal/Dialog 컴포넌트
  - [ ] Loading Spinner 컴포넌트
  - [ ] Toast 알림 컴포넌트

### 🔒 보안 및 검증
- [ ] **폼 검증 스키마**: Zod 사용
```typescript
// src/lib/validations/customer.ts
export const customerSignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/),
});
```

- [ ] **API 보안**
  - [ ] 입력값 서버사이드 검증
  - [ ] Rate limiting 고려
  - [ ] SQL Injection 방지

### 📱 반응형 디자인
- [ ] **모바일 우선 설계**
  - [ ] 320px ~ 768px (모바일)
  - [ ] 768px ~ 1024px (태블릿)
  - [ ] 1024px+ (데스크톱)

- [ ] **터치 친화적 UI**
  - [ ] 버튼 최소 크기 44px
  - [ ] 충분한 터치 간격
  - [ ] 스와이프 제스처 고려

---

## 🧪 테스트 계획

### ✅ 단위 테스트
- [ ] **핵심 함수 테스트**
  - [ ] 인증 함수
  - [ ] 예약 생성 함수
  - [ ] 가격 계산 함수
  - [ ] 폼 검증 함수

### ✅ 통합 테스트
- [ ] **사용자 플로우 테스트**
  - [ ] 회원가입 → 로그인 → 예약 → 완료
  - [ ] 예약 조회 및 취소
  - [ ] 프로필 수정

### ✅ E2E 테스트 (Playwright)
- [ ] **고객 전체 여정 테스트**
  - [ ] 실제 예약 프로세스 자동화 테스트
  - [ ] 모바일 디바이스 시뮬레이션
  - [ ] 결제 플로우 테스트

---

## 📊 성능 최적화

### ✅ 프론트엔드 최적화
- [ ] **이미지 최적화**
  - [ ] Next.js Image 컴포넌트 사용
  - [ ] WebP 포맷 적용
  - [ ] Lazy loading 구현

- [ ] **코드 분할**
  - [ ] 페이지별 동적 import
  - [ ] 컴포넌트 lazy loading
  - [ ] 번들 크기 모니터링

### ✅ 백엔드 최적화
- [ ] **데이터베이스 최적화**
  - [ ] 인덱스 추가 (email, reservation_date)
  - [ ] 쿼리 성능 모니터링
  - [ ] Connection pooling 설정

---

## 🚀 배포 준비

### ✅ 환경 설정
- [ ] **환경 변수 관리**
  - [ ] 개발/프로덕션 환경 분리
  - [ ] Vercel 환경 변수 설정
  - [ ] 민감한 정보 보안 처리

### ✅ 모니터링 설정
- [ ] **에러 추적**
  - [ ] Sentry 연동 고려
  - [ ] 에러 로깅 구현
  - [ ] 알림 시스템 설정

### ✅ SEO 최적화
- [ ] **메타데이터 설정**
  - [ ] 페이지별 title, description
  - [ ] Open Graph 태그
  - [ ] 구조화된 데이터

---

## 📋 완료 체크리스트

### Week 1 완료 기준 (백엔드) - **✅ 완료됨**
- [x] 고객 회원가입/로그인 백엔드 완전 작동 ✅
- [x] 데이터베이스 통합 구조 모두 생성 ✅
- [x] TypeScript 타입 시스템 완전 작동 ✅
- [x] 기본 인증 플로우 빌드 성공 ✅

### Week 1 다음 기준 (프론트엔드) - **대기 중**
- [ ] 고객 회원가입/로그인 UI 페이지 구현
- [ ] 고객용 레이아웃 컴포넌트 구현
- [ ] 기본 인증 플로우 UI 테스트 완료

### Week 2 완료 기준
- [ ] 시설 목록 페이지 완전 작동
- [ ] 예약 프로세스 모든 단계 구현
- [ ] 무통장 입금 결제 처리 완료

### Week 3 완료 기준
- [ ] 마이페이지 모든 기능 작동
- [ ] 예약 취소 기능 완료
- [ ] 이메일 알림 시스템 작동

### MVP 완료 기준
- [ ] **실제 고객이 예약을 완료할 수 있음**
- [ ] **관리자가 예약을 확인할 수 있음**
- [ ] **모바일에서 정상 작동**
- [ ] **기본 보안 요구사항 충족**

---

**작성일**: 2025-09-23 (업데이트)
**목표 완료일**: 2025-10-13 (3주 후)
**담당**: 개발팀
**상태**: 1단계 백엔드 완료, 2단계 UI 개발 시작 준비 ✅

> 💡 **다음 즉시 시작**: 고객 UI 페이지 구현 (회원가입/로그인)
> ✅ **완료된 작업**: 데이터베이스 통합 구조, 인증 시스템 백엔드, TypeScript 타입 시스템