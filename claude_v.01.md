# 바베큐장 예약 시스템 - 완전 재구축 프로젝트 문서

## 📋 프로젝트 개요

### 목적
기존 복잡한 SKU 기반 시스템을 사용자 친화적인 facility 기반 예약 시스템으로 완전 재구축

### 대상 사용자
- 30-40대 가족 단위 고객
- 20대 커플 고객
- 직관적이고 간편한 예약 경험 추구

### 핵심 요구사항
- 통합 달력에서 1부/2부/3부 시간대 통합 표시
- 3초 이하 로딩 시간
- 중복 예약 방지 (Zero duplicate bookings)
- 회원/비회원 모두 지원

## 🏗️ 시스템 아키텍처

### 기술 스택
- Frontend: Next.js 15 + App Router + Turbopack
- Backend: Next.js API Routes
- Database: Supabase (PostgreSQL)
- Language: TypeScript (strict type safety)
- Styling: Tailwind CSS 4.x + DaisyUI 5.1.12
- Design Pattern: Atomic Design
- Deployment: GitHub + Vercel (automatic pipeline)

### 디렉토리 구조
```
src/
├── app/
│   ├── api/
│   │   ├── auth/             # 인증 관련 API (통합)
│   │   │   ├── login/        # 로그인
│   │   │   ├── signup/       # 회원가입
│   │   │   ├── profile/      # 프로필 조회/수정 (NEW)
│   │   │   └── change-password/ # 비밀번호 변경 (NEW)
│   │   ├── reservations/     # 새로운 예약 API
│   │   │   ├── route.ts      # POST/PUT/DELETE 예약 관리
│   │   │   └── lookup/       # GET 예약 조회/가용성
│   │   └── [legacy APIs]/    # Deprecated APIs (410 Gone)
│   ├── reservation/          # 예약 페이지
│   └── [other pages]/
├── components/
│   ├── atoms/               # 기본 컴포넌트 (Button, Input, Card)
│   ├── molecules/           # Calendar 컴포넌트
│   └── organisms/           # ReservationForm 컴포넌트
├── lib/
│   ├── supabase.ts         # Supabase 클라이언트 설정
│   ├── env.ts              # 환경변수 검증
│   └── api-response.ts     # 표준화된 API 응답
└── types/
    ├── database.ts         # 새로운 DB 타입 (single source of truth)
    └── supabase.ts         # Legacy 타입 (deprecated)
```

## 📊 데이터베이스 스키마

### 핵심 테이블 구조

#### 1. users (회원 정보)
```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- 소셜 로그인 시 NULL 허용
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'MANAGER', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    provider TEXT NOT NULL DEFAULT 'email' CHECK (provider IN ('email', 'kakao')),
    provider_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. facilities (시설 정보)
```sql
CREATE TABLE facilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL, -- private, tent, outdoor_sofa, outdoor_table, vip
    capacity INTEGER NOT NULL,
    weekday_price INTEGER NOT NULL,
    weekend_price INTEGER NOT NULL,
    amenities TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. sites (각 시설의 개별 사이트)
```sql
CREATE TABLE sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
    site_number TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(facility_id, site_number)
);
```

#### 4. reservations (예약 정보 - 회원/비회원 모두 지원)
```sql
CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- 회원 예약
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- 비회원 예약
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,

    -- 예약 기본 정보
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
    reservation_date DATE NOT NULL,
    time_slots INTEGER[] NOT NULL, -- [1,2,3] 형태: 1부/2부/3부
    total_amount INTEGER NOT NULL,

    -- 상태 관리
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    payment_status TEXT NOT NULL DEFAULT 'WAITING'
        CHECK (payment_status IN ('WAITING', 'COMPLETED', 'REFUNDED')),

    -- 추가 정보
    special_requests TEXT,
    admin_memo TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- 회원 또는 비회원 정보 중 하나는 반드시 있어야 함
    CONSTRAINT check_user_or_guest CHECK (
        (user_id IS NOT NULL) OR
        (guest_name IS NOT NULL AND guest_phone IS NOT NULL)
    )
);
```

#### 5. notices, faqs (공지사항, FAQ)
```sql
-- notices 테이블 (공지사항)
CREATE TABLE notices (
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

-- faqs 테이블 (자주 묻는 질문)
CREATE TABLE faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 핵심 비즈니스 로직

#### 중복 예약 방지 트리거
```sql
CREATE OR REPLACE FUNCTION check_reservation_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- 같은 사이트, 같은 날짜, 겹치는 시간대에 이미 예약이 있는지 확인
    IF EXISTS (
        SELECT 1 FROM reservations
        WHERE site_id = NEW.site_id
        AND reservation_date = NEW.reservation_date
        AND time_slots && NEW.time_slots  -- 배열 교집합 연산자
        AND status != 'CANCELLED'
        AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) THEN
        RAISE EXCEPTION '중복 예약이 발생했습니다. 선택한 시간대에 이미 예약이 있습니다.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_reservation_conflict_trigger
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION check_reservation_conflict();
```

## 🔧 타입 시스템

### 1. 중앙화된 타입 정의 (src/types/database.ts)
```typescript
// 메인 Database 타입
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password: string | null
          name: string
          phone: string | null
          role: 'USER' | 'MANAGER' | 'ADMIN'
          status: 'ACTIVE' | 'INACTIVE'
          provider: 'email' | 'kakao'
          provider_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: { /* 삽입시 옵션 필드들 */ }
        Update: { /* 업데이트시 옵션 필드들 */ }
      }
      facilities: { /* 시설 타입 정의 */ }
      sites: { /* 사이트 타입 정의 */ }
      reservations: { /* 예약 타입 정의 */ }
      notices: { /* 공지사항 타입 정의 */ }
      faqs: { /* FAQ 타입 정의 */ }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      user_role: 'USER' | 'MANAGER' | 'ADMIN'
      user_status: 'ACTIVE' | 'INACTIVE'
      provider_type: 'email' | 'kakao'
      reservation_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
      payment_status: 'WAITING' | 'COMPLETED' | 'REFUNDED'
    }
  }
}

// 편의성 타입 export
export type UserRow = Database['public']['Tables']['users']['Row']
export type ReservationRow = Database['public']['Tables']['reservations']['Row']
// ... 기타 타입들
```

### 2. API 요청/응답 타입
```typescript
// 예약 생성 요청
export interface CreateReservationRequest {
  user_id?: string
  guest_name?: string
  guest_phone?: string
  guest_email?: string
  facility_id: string
  site_id: string
  reservation_date: string
  time_slots: number[]
  total_amount: number
  special_requests?: string
}

// 가용성 조회 응답
export interface FacilityAvailability {
  facility_id: string
  facility_name: string
  facility_type: string
  sites: Record<string, SiteAvailability>
}

export interface SiteAvailability {
  site_id: string
  site_name: string
  site_number: string
  capacity: number
  occupied_time_slots: number[]
  available_time_slots: number[]
}
```

## 🌐 API 시스템

### 현대화된 API 시스템 구조

#### 1. 인증 API (/api/auth) ✅ 완성

**프로필 관리 - `/api/auth/profile`**
```javascript
// GET - 프로필 조회
GET /api/auth/profile
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "phone": "010-1234-5678",
      "role": "USER",
      "status": "ACTIVE",
      "provider": "email",
      "created_at": "2024-09-16T..."
    }
  },
  "message": "프로필 조회가 완료되었습니다."
}

// PUT - 프로필 수정
PUT /api/auth/profile
Authorization: Bearer <token>
{
  "name": "새이름",
  "phone": "010-9876-5432"
}
```

**비밀번호 변경 - `/api/auth/change-password`**
```javascript
// POST - 비밀번호 변경
POST /api/auth/change-password
Authorization: Bearer <token>
{
  "currentPassword": "현재비밀번호",
  "newPassword": "새비밀번호123"
}

// Response
{
  "success": true,
  "data": {},
  "message": "비밀번호가 성공적으로 변경되었습니다."
}
```

#### 2. 공지사항/FAQ API (/api/public) ✅ 새로 추가

**공지사항 API - `/api/public/notices`**
```javascript
// GET - 공지사항 목록 조회
GET /api/public/notices?page=1&limit=10&important=true

// Response
{
  "success": true,
  "data": {
    "notices": [
      {
        "id": "uuid",
        "title": "시설 이용 안내",
        "content": "시설 이용에 대한 상세 안내...",
        "is_important": true,
        "view_count": 156,
        "created_at": "2024-09-17T...",
        "author": {
          "id": "uuid",
          "name": "관리자",
          "email": "admin@osobbq.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 42,
      "limit": 10
    }
  }
}

// GET - 개별 공지사항 조회 (조회수 자동 증가)
GET /api/public/notices/[id]
```

**FAQ API - `/api/public/faqs`**
```javascript
// GET - FAQ 목록 조회
GET /api/public/faqs?page=1&limit=10&category=reservation

// Response
{
  "success": true,
  "data": {
    "faqs": [
      {
        "id": "uuid",
        "question": "예약 취소는 언제까지 가능한가요?",
        "answer": "예약일 1일 전까지 취소 가능합니다...",
        "category": "reservation",
        "order_index": 1,
        "created_at": "2024-09-17T..."
      }
    ],
    "categories": ["general", "reservation", "payment", "facility"],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "limit": 10
    }
  }
}

// GET - 개별 FAQ 조회
GET /api/public/faqs/[id]
```

#### 3. 관리자 분석 API (/api/admin/analytics) ✅ 새로 추가

**통합 분석 데이터 - `/api/admin/analytics`**
```javascript
// GET - 분석 데이터 조회
GET /api/admin/analytics?period=month
Authorization: Bearer <admin_token>

// Response
{
  "success": true,
  "data": {
    "analytics": {
      "total_reservations": 87,
      "total_facilities": 12,
      "total_revenue": 4580000,
      "occupancy_rate": 73.2,
      "recent_reservations": [...]
    },
    "period_stats": {
      "period": "month",
      "start_date": "2024-09-01T00:00:00Z",
      "end_date": "2024-09-30T23:59:59Z",
      "confirmed_reservations": 82,
      "pending_reservations": 5,
      "cancelled_reservations": 3,
      "conversion_rate": 94.3
    },
    "facility_stats": [
      {
        "facility_id": "uuid",
        "facility_name": "프라이빗룸 A",
        "facility_type": "private",
        "total_reservations": 45,
        "total_revenue": 2250000,
        "site_count": 4
      }
    ],
    "site_stats": {
      "total_sites": 24,
      "reserved_sites_today": 18,
      "occupancy_rate": 75.0
    }
  }
}
```

**예약 분석 전용 - `/api/admin/analytics/reservations`**
```javascript
// GET - 예약 분석 데이터
GET /api/admin/analytics/reservations?limit=20&status=PENDING&facility_id=uuid
Authorization: Bearer <admin_token>

// Response
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "uuid",
        "customer": {
          "type": "member",
          "name": "김철수",
          "email": "customer@example.com",
          "phone": "010-1234-5678"
        },
        "facility": {
          "id": "uuid",
          "name": "프라이빗룸 A",
          "type": "private"
        },
        "site": {
          "id": "uuid",
          "name": "프라이빗룸 A - 사이트 1",
          "site_number": "private-1"
        },
        "reservation_details": {
          "date": "2024-09-20",
          "time_slots": [1, 2],
          "total_amount": 90000,
          "status": "PENDING",
          "payment_status": "WAITING",
          "special_requests": "창문 쪽 자리 요청"
        },
        "timestamps": {
          "created_at": "2024-09-17T...",
          "updated_at": "2024-09-17T..."
        }
      }
    ],
    "meta": {
      "total_returned": 20,
      "filters_applied": {
        "status": "PENDING",
        "facility_id": "uuid",
        "limit": 20
      }
    }
  }
}
```

#### 4. 관리자 예약 관리 API (/api/admin/reservations/management) ✅ 새로 추가

**예약 관리 - `/api/admin/reservations/management`**
```javascript
// GET - 관리자용 예약 목록 조회
GET /api/admin/reservations/management?page=1&limit=20&status=PENDING&facility_id=uuid&date_from=2024-09-01&date_to=2024-09-30
Authorization: Bearer <admin_token>

// Response
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "uuid",
        "customer": {
          "type": "guest",
          "name": "홍길동",
          "email": "guest@example.com",
          "phone": "010-9876-5432"
        },
        "facility": {
          "id": "uuid",
          "name": "프라이빗룸 B",
          "type": "private"
        },
        "site": {
          "id": "uuid",
          "name": "프라이빗룸 B - 사이트 2",
          "site_number": "private-2",
          "capacity": 8
        },
        "reservation_details": {
          "date": "2024-09-21",
          "time_slots": [2, 3],
          "total_amount": 110000,
          "status": "PENDING",
          "payment_status": "WAITING",
          "special_requests": "생일파티 준비",
          "admin_memo": null
        },
        "timestamps": {
          "created_at": "2024-09-17T...",
          "updated_at": "2024-09-17T..."
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalItems": 156,
      "limit": 20
    },
    "filters_applied": {
      "status": "PENDING",
      "facility_id": "uuid",
      "date_from": "2024-09-01",
      "date_to": "2024-09-30"
    }
  }
}

// PUT - 예약 상태 변경
PUT /api/admin/reservations/management
Authorization: Bearer <admin_token>
{
  "reservation_id": "uuid",
  "status": "CONFIRMED",
  "payment_status": "COMPLETED",
  "admin_memo": "입금 확인 완료"
}

// Response
{
  "success": true,
  "data": {
    "reservation_id": "uuid",
    "facility_name": "프라이빗룸 B",
    "site_name": "프라이빗룸 B - 사이트 2",
    "status": "CONFIRMED",
    "payment_status": "COMPLETED",
    "admin_memo": "입금 확인 완료",
    "updated_at": "2024-09-17T..."
  },
  "message": "예약 상태가 성공적으로 변경되었습니다."
}
```

#### 5. 예약 관리 API (/api/reservations)

**POST - 예약 생성**
```javascript
// 요청 본문
{
  "facility_id": "uuid",
  "site_id": "uuid",
  "reservation_date": "2024-09-20",
  "time_slots": [1, 2], // 1부, 2부
  "total_amount": 70000,
  "guest_name": "홍길동", // 비회원시
  "guest_phone": "010-1234-5678" // 비회원시
}

// 응답
{
  "success": true,
  "data": {
    "reservation_id": "uuid",
    "facility_name": "프라이빗룸 A",
    "site_name": "프라이빗룸 A - 사이트 1",
    "reservation_date": "2024-09-20",
    "time_slots": [1, 2],
    "total_amount": 70000,
    "status": "PENDING",
    "payment_status": "WAITING"
  },
  "message": "예약이 성공적으로 생성되었습니다."
}
```

**PUT - 예약 수정**
```javascript
// 요청 본문
{
  "reservation_id": "uuid",
  "user_id": "uuid", // 회원인 경우
  "guest_phone": "010-1234-5678", // 비회원인 경우
  "facility_id": "new_uuid", // 변경할 필드들
  "time_slots": [2, 3]
}
```

**DELETE - 예약 취소**
```javascript
// 요청 본문
{
  "reservation_id": "uuid",
  "user_id": "uuid", // 회원인 경우
  "guest_phone": "010-1234-5678", // 비회원인 경우
  "cancellation_reason": "개인 사정"
}
```

#### 6. 예약 조회 API (/api/reservations/lookup)

**개별 예약 조회**
```javascript
GET /api/reservations/lookup?reservation_id=uuid&guest_phone=010-1234-5678
```

**날짜별 가용성 조회**
```javascript
GET /api/reservations/lookup?date=2024-09-20&facility_id=uuid

// 응답 예시
{
  "success": true,
  "data": {
    "date": "2024-09-20",
    "facility_id": "uuid",
    "availability": {
      "facility_uuid": {
        "facility_name": "프라이빗룸 A",
        "facility_type": "private",
        "sites": {
          "site_uuid": {
            "site_name": "프라이빗룸 A - 사이트 1",
            "site_number": "private-1",
            "capacity": 6,
            "occupied_time_slots": [1], // 1부는 예약됨
            "available_time_slots": [2, 3] // 2부, 3부 가능
          }
        }
      }
    }
  }
}
```

### 레거시 API 마이그레이션 완료 ✅

**모든 legacy API는 HTTP 410 Gone 상태로 deprecated 처리:**

```javascript
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'Please use the new dedicated endpoint: /api/admin/analytics',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-17',
      migration_guide: '/api/admin/analytics'
    },
    {
      status: 410,
      headers: {
        'X-API-Deprecated': 'true',
        'X-API-Sunset': '2024-12-31',
        'X-API-Migration-Guide': '/api/admin/analytics'
      }
    }
  );
}
```

**마이그레이션 완료된 API 목록:**

#### ✅ Phase 1: 공지사항/FAQ API 현대화
- `/api/public/posts` → **410 Gone** → `/api/public/notices`, `/api/public/faqs`

#### ✅ Phase 2: 관리자 대시보드 API 현대화
- `/api/admin/dashboard` → **410 Gone** → `/api/admin/analytics`
- `/api/admin/dashboard/stats` → **유지** (현재 활성 상태)
- `/api/admin/dashboard/recent-reservations` → **유지** (현재 활성 상태)
- `/api/admin/dashboard/tasks` → **유지** (현재 활성 상태)

#### ✅ Phase 3: 예약 관리 API 통합
- `/api/admin/reservations` → **410 Gone** → `/api/admin/reservations/management`
- `/api/reservations` → **유지** (일반 사용자용)

#### ✅ Phase 4: 사용자 관리 API 완전 제거
- `/api/admin/users` → **410 Gone** (인증 시스템으로 통합)
- `/api/admin/create-test-admin` → **410 Gone** (Supabase Dashboard 사용)

**새로운 API 구조:**
```
/api/
├── auth/                    # 인증 (완료)
├── reservations/            # 일반 사용자 예약 (완료)
├── admin/
│   ├── analytics/           # 대시보드 분석 (신규)
│   ├── reservations/
│   │   └── management/      # 관리자 예약 관리 (신규)
│   └── dashboard/           # 레거시 API (유지)
└── public/
    ├── notices/             # 공지사항 (신규)
    └── faqs/                # FAQ (신규)
```

### 상수 업데이트 (src/constants/index.ts)

```javascript
// API 엔드포인트
export const API_ENDPOINTS = {
  // 인증 (통합 및 정리)
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    SIGNUP: '/api/auth/signup',
    PROFILE: '/api/auth/profile',              // NEW
    CHANGE_PASSWORD: '/api/auth/change-password', // NEW
    REFRESH: '/api/auth/refresh-token'
  },
  // 예약
  RESERVATIONS: {
    LIST: '/api/reservations',
    CREATE: '/api/reservations',
    DETAIL: (id: string) => `/api/reservations/${id}`,
    UPDATE: (id: string) => `/api/reservations/${id}`,
    CANCEL: (id: string) => `/api/reservations/${id}/cancel`,
    GUEST_SEARCH: '/api/reservations/guest-search'
  },
  // 시설
  FACILITIES: {
    LIST: '/api/facilities',
    DETAIL: (id: string) => `/api/facilities/${id}`,
    AVAILABILITY: '/api/facilities/availability'
  },
  // 공지사항
  NOTICES: {
    LIST: '/api/notices',
    DETAIL: (id: string) => `/api/notices/${id}`
  },
  // FAQ
  FAQS: {
    LIST: '/api/faqs',
    DETAIL: (id: string) => `/api/faqs/${id}`
  }
} as const;
```

## 🔐 관리자 인증 및 대시보드 시스템

### 완전한 관리자 인증 플로우

#### 1. 로그인 페이지 (/login)
```typescript
// 실제 API 연동 로그인 처리
const handleSubmit = async (e: React.FormEvent) => {
  const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  // 토큰 및 사용자 정보 저장
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('user', JSON.stringify(data.data.user));

  // 역할 기반 리다이렉트
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    router.push('/admin');  // 관리자 대시보드로
  } else {
    router.push('/');       // 메인 페이지로
  }
};
```

#### 2. 관리자 대시보드 접근 제어
```typescript
// 페이지 로드 시 인증 확인
useEffect(() => {
  const checkAuth = () => {
    const userData = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (!userData || !accessToken) {
      router.push('/login');  // 미인증시 로그인 페이지로
      return false;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'MANAGER') {
      alert('관리자 권한이 필요합니다.');
      router.push('/');       // 권한 부족시 메인으로
      return false;
    }

    return true;
  };
}, []);
```

#### 3. Bearer 토큰 기반 API 호출
```typescript
// 모든 관리자 API는 토큰 인증 필요
const fetchDashboardData = async () => {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch('/api/admin/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
};
```

#### 4. 안전한 로그아웃
```typescript
const handleLogout = () => {
  // 모든 토큰 및 사용자 데이터 완전 삭제
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  router.push('/login');
};
```

### 실시간 관리자 대시보드

#### KPI 대시보드 카드
- **월간 매출**: 실제 예약 금액 합계
- **월간 예약**: 이번 달 예약 건수
- **오늘 가동률**: 예약된 사이트 / 전체 사이트 비율
- **예약 확정률**: 확정 예약 / 전체 예약 비율

#### 최근 예약 현황
- 회원/비회원 구분 표시
- 시설명, 예약일, 시간대 정보
- 실시간 예약 상태 (입금대기/확정/취소)
- 예약 금액 및 생성일

#### 실시간 업무 관리
- 승인 대기 예약 수 (긴급 표시)
- 최근 취소 요청 건수
- 오늘 예약 현황 점검
- 공지사항 발행 대기

#### 보안 기능
- 실시간 인증 상태 확인
- 자동 권한 검증
- 토큰 만료 시 자동 로그인 리다이렉트
- 사용자 정보 헤더 표시

### 관리자 계정 관리

#### Supabase를 통한 관리자 계정 생성
```sql
-- 1. Supabase Dashboard → Authentication → Users에서 계정 생성
-- 2. users 테이블에 관리자 정보 추가
INSERT INTO users (
  id,
  email,
  name,
  role,
  status,
  provider,
  created_at,
  updated_at
) VALUES (
  '사용자ID',
  'admin@osobbq.com',
  '오소 관리자',
  'ADMIN',
  'ACTIVE',
  'email',
  NOW(),
  NOW()
);
```

## 🎨 프론트엔드 컴포넌트

### Atomic Design 구조

#### Atoms (기본 컴포넌트)
```typescript
// Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

// Input.tsx
interface InputProps {
  label?: string
  error?: string
  helperText?: string
}

// Card.tsx
interface CardProps {
  padding?: 'sm' | 'md' | 'lg'
  shadow?: 'sm' | 'md' | 'lg'
  hover?: boolean
}
```

#### Molecules (조합 컴포넌트)

**Calendar 컴포넌트 (src/components/molecules/Calendar.tsx)**
```typescript
interface CalendarProps {
  onDateSelect: (date: string) => void
  onTimeSlotSelect: (timeSlots: number[]) => void
  onSiteSelect: (facilityId: string, siteId: string) => void
  selectedDate?: string
  selectedTimeSlots?: number[]
  selectedFacilityId?: string
  selectedSiteId?: string
}

// 핵심 기능:
// - 달력 날짜 선택
// - 시간대 토글 (1부/2부/3부)
// - 실시간 가용성 조회
// - 시설별 사이트 선택
// - 예약된 시간대 시각적 표시
```

#### Organisms (페이지 레벨 컴포넌트)

**ReservationForm 컴포넌트 (src/components/organisms/ReservationForm.tsx)**
```typescript
interface ReservationFormProps {
  isLoggedIn?: boolean
  userId?: string
  onSubmit?: (data: ReservationData) => void
}

// 핵심 기능:
// - Calendar 컴포넌트 통합
// - 회원/비회원 정보 입력
// - 실시간 가격 계산
// - 예약 생성 API 호출
// - 폼 유효성 검증
```

#### 컴포넌트 사용 예시
```typescript
// /app/reservation/page.tsx
import ReservationForm from '@/components/organisms/ReservationForm'

export default function ReservationPage() {
  return <ReservationForm />
}
```

## ⚙️ 환경 설정

### 1. 환경변수 검증 (src/lib/env.ts)
```typescript
function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
} as const
```

### 2. Supabase 클라이언트 설정 (src/lib/supabase.ts)
```typescript
import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { env } from './env'
import { Database } from '@/types/database'

// 서버 사이드용 클라이언트
export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// 관리자용 클라이언트 (서비스 롤 키 사용)
export const supabaseAdmin = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 클라이언트 컴포넌트용
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}
```

### 3. API 응답 표준화 (src/lib/api-response.ts)
```typescript
export class ApiError extends Error {
  public readonly status: number
  public readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const ApiErrors = {
  BadRequest: (message: string, code?: string) => new ApiError(400, message, code),
  Unauthorized: (message: string, code?: string) => new ApiError(401, message, code),
  Forbidden: (message: string, code?: string) => new ApiError(403, message, code),
  NotFound: (message: string, code?: string) => new ApiError(404, message, code),
  Conflict: (message: string, code?: string) => new ApiError(409, message, code),
  InternalServerError: (message: string, code?: string) => new ApiError(500, message, code),
}

export function createSuccessResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message
  })
}

export function withErrorHandling(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context)
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: error.code
          },
          { status: error.status }
        )
      }

      console.error('Unhandled API error:', error)
      return NextResponse.json(
        {
          success: false,
          error: '서버 오류가 발생했습니다.'
        },
        { status: 500 }
      )
    }
  }
}
```

## 🚀 배포 설정

### GitHub-Vercel 자동 배포 파이프라인

1. **GitHub Repository**: https://github.com/Dami-Shin-01/oso_home_01.git
2. **Vercel 연동**: main 브랜치 push시 자동 배포
3. **환경변수 설정**: Vercel 대시보드에서 설정 필요

```bash
# 필수 환경변수 (Vercel에서 설정)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 빌드 및 배포 과정
```bash
# 1. 로컬 개발 및 테스트
npm run dev
npm run build
npm run start

# 2. 타입 검증
npx tsc --noEmit

# 3. Git 커밋
git add .
git commit -m "feat: your changes"
git push origin main

# 4. 자동 배포 (Vercel)
# GitHub push 감지 → 자동 빌드 → 배포 완료
```

## 📋 단계별 구현 가이드

### Phase 1: 환경 설정 및 타입 시스템
1. ✅ src/lib/env.ts 환경변수 검증 생성
2. ✅ src/lib/api-response.ts API 표준화 생성
3. ✅ src/types/database.ts 중앙화된 타입 정의
4. ✅ src/lib/supabase.ts 클라이언트 설정 업데이트

### Phase 2: 데이터베이스 재구축
1. ✅ database_rebuild.sql 실행으로 스키마 재구성
2. ✅ 중복 예약 방지 트리거 함수 적용
3. ✅ RLS 정책 설정으로 보안 강화
4. ✅ 초기 데이터 삽입 (시설, FAQ 등)

### Phase 3: API 시스템 구축
1. ✅ /api/reservations POST/PUT/DELETE 구현
2. ✅ /api/reservations/lookup GET 구현
3. ✅ Legacy API들 410 Gone 처리
4. ✅ 타입 안전성 검증 및 빌드 테스트

### Phase 4: 인증 시스템 통합 ✅ NEW
1. ✅ /api/auth/profile 프로필 관리 API 구현
2. ✅ /api/auth/change-password 비밀번호 변경 API 구현
3. ✅ /api/users/me 계열 Legacy API 완전 제거
4. ✅ constants/index.ts API 엔드포인트 정리

### Phase 5: 관리자 인증 및 대시보드 완성 ✅ NEW
1. ✅ 실시간 관리자 대시보드 API 구현 (stats, recent-reservations, tasks)
2. ✅ 관리자 로그인 시스템 구현 (실제 API 연동)
3. ✅ 역할 기반 접근 제어 (ADMIN/MANAGER 권한 검증)
4. ✅ 보안 강화 (Bearer 토큰, localStorage 세션 관리)

### Phase 6: 프론트엔드 컴포넌트
1. ✅ Calendar.tsx 실시간 달력 컴포넌트
2. ✅ ReservationForm.tsx 통합 예약 폼
3. ✅ Atomic Design 패턴 적용
4. ✅ /reservation 페이지 업데이트

### Phase 7: 배포 및 검증
1. ✅ 타입스크립트 컴파일 에러 0개 달성
2. ✅ Next.js 빌드 성공 (3.8초)
3. ✅ Git 커밋 및 GitHub 푸시
4. ✅ Vercel 자동 배포 완료

## 🔍 문제 해결 가이드

### 타입 에러 해결
```typescript
// 문제: Property 'xxx' does not exist on type 'never'
// 해결 방법: 명시적 타입 단언
const { data: reservation } = await supabaseAdmin
  .from('reservations')
  .select('*')
  .single() as {
    data: Database['public']['Tables']['reservations']['Row'] | null;
    error: any;
  };

// 문제: Legacy 타입 참조 에러
// 잘못된 import
import { ReservationRow } from '@/types/database'; // 구 타입

// 올바른 import
import type { ReservationRow } from '@/types/database'; // 새 타입
```

### 데이터베이스 관련
```sql
-- 문제: 중복 예약 생성
-- 해결책: 트리거 함수로 자동 방지
-- database_rebuild.sql의 check_reservation_conflict() 함수 사용

-- 문제: RLS 정책 무한 재귀
-- 문제있는 정책
CREATE POLICY "user_policy" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) -- 무한 재귀!
);

-- 올바른 정책
CREATE POLICY "user_policy" ON users FOR SELECT USING (
  auth.uid() = id -- 단순 비교
);
```

### API 관련
```javascript
// 문제: Legacy API 호출시 에러
// 응답: HTTP 410 Gone
{
  "error": "This API endpoint is deprecated",
  "migration_guide": "Use /api/reservations instead"
}

// 문제: 가용성 조회 느림
// 해결책: 인덱스 활용
-- 이미 database_rebuild.sql에 포함됨
CREATE INDEX idx_reservations_date_time ON reservations(reservation_date, time_slots);
```

## 📈 성능 최적화

### 1. 데이터베이스 인덱스
```sql
-- 예약 조회 최적화
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_facility_site ON reservations(facility_id, site_id);
CREATE INDEX idx_reservations_date_time ON reservations(reservation_date, time_slots);

-- 시설 조회 최적화
CREATE INDEX idx_facilities_type ON facilities(type);
CREATE INDEX idx_facilities_active ON facilities(is_active);
```

### 2. API 응답 최적화
```typescript
// 필요한 필드만 선택
const { data } = await supabaseAdmin
  .from('reservations')
  .select('id, reservation_date, time_slots, status') // 필요한 필드만
  .eq('user_id', userId);
```

### 3. 프론트엔드 최적화
```typescript
// React.memo로 불필요한 리렌더링 방지
const Calendar = React.memo(({ onDateSelect, selectedDate }) => {
  // 컴포넌트 로직
});

// useMemo로 계산 결과 캐싱
const availableSlots = useMemo(() => {
  return [1, 2, 3].filter(slot => !occupiedSlots.includes(slot));
}, [occupiedSlots]);
```

## 🧪 테스트 가이드

### 빌드 테스트
```bash
# 타입스크립트 컴파일 검증
npx tsc --noEmit

# Next.js 빌드 테스트
npm run build

# 프로덕션 모드 실행
npm run start
```

### API 테스트 예시
```bash
# 예약 생성 테스트
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "facility_id": "uuid",
    "site_id": "uuid",
    "reservation_date": "2024-09-20",
    "time_slots": [1, 2],
    "total_amount": 70000,
    "guest_name": "테스트",
    "guest_phone": "010-1234-5678"
  }'

# 가용성 조회 테스트
curl "http://localhost:3000/api/reservations/lookup?date=2024-09-20"

# 프로필 조회 테스트
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <token>"

# 비밀번호 변경 테스트
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "current123",
    "newPassword": "newpass123"
  }'

# 관리자 대시보드 통계 테스트 (NEW)
curl -X GET http://localhost:3000/api/admin/dashboard/stats \
  -H "Authorization: Bearer <admin_token>"

# 최근 예약 현황 테스트 (NEW)
curl -X GET http://localhost:3000/api/admin/dashboard/recent-reservations?limit=5 \
  -H "Authorization: Bearer <admin_token>"

# 관리자 업무 목록 테스트 (NEW)
curl -X GET http://localhost:3000/api/admin/dashboard/tasks \
  -H "Authorization: Bearer <admin_token>"
```

## 📚 참고 자료

### 주요 파일 위치
- 데이터베이스 스키마: database_rebuild.sql
- 타입 정의: src/types/database.ts
- 예약 API: src/app/api/reservations/route.ts
- 인증 API: src/app/api/auth/profile/route.ts, src/app/api/auth/change-password/route.ts
- 관리자 대시보드 API: src/app/api/admin/dashboard/stats/route.ts
- 로그인 페이지: src/app/login/page.tsx
- 관리자 대시보드: src/app/admin/page.tsx
- 달력 컴포넌트: src/components/molecules/Calendar.tsx
- 예약 폼: src/components/organisms/ReservationForm.tsx

### 기술 문서
- https://nextjs.org/docs
- https://supabase.com/docs/guides/api/generating-types
- https://tailwindcss.com/docs
- https://www.postgresql.org/docs/current/arrays.html

### 프로젝트 상태
- ✅ 완료: 완전한 facility-based 예약 시스템
- ✅ 타입 안전성: 100% TypeScript 타입 동기화
- ✅ 성능: 3초 이하 로딩, 중복 예약 방지
- ✅ 배포: GitHub-Vercel 파이프라인 활성화
- ✅ 인증 시스템: 통합 완료 및 Legacy API 제거
- ✅ 관리자 시스템: 실시간 대시보드 및 보안 인증 완성
- ✅ **콘텐츠 관리 시스템**: 완전한 CRUD 기능 (생성/조회/수정/삭제)
- ✅ **시설/구역 관리**: 모달 기반 실시간 관리 시스템

---
**마지막 업데이트**: 2025-09-19
**프로젝트 상태**: Production Ready ✅ - 보안 강화 및 권한 기반 데이터 접근 제어 완성

**최신 변경사항 (2025-09-19 저녁 - 보안 강화 및 비공개 콘텐츠 노출 문제 해결)**:

- ✅ **비공개 콘텐츠 노출 문제 완전 해결**
  - 관리자 페이지에서 비공개로 설정한 콘텐츠가 홈페이지에 노출되던 문제 해결
  - RLS (Row Level Security) 정책을 통한 데이터 접근 제어 구현
  - 발행된 콘텐츠(`is_published = true`)만 홈페이지에 표시되도록 제한

- ✅ **홈페이지 컴포넌트 보안 강화**
  - 모든 공개 페이지에서 `supabaseAdmin` → `supabase` 클라이언트로 변경
  - 메인 페이지, 공지사항, FAQ, 시설 페이지의 데이터 접근 권한 분리
  - 일반 사용자 권한으로 데이터 조회하여 RLS 정책 적용

- ✅ **안전한 데이터베이스 정책 추가**
  - `add_public_policies_only.sql` 스크립트 생성 (DO 블록 방식)
  - 기존 정책을 건드리지 않고 누락된 공개 정책만 안전하게 추가
  - `notices_public_select`, `faqs_public_select`, `facilities_public_select`, `sites_public_select` 정책 생성
  - PostgreSQL `CREATE POLICY IF NOT EXISTS` 문법 한계 해결

- ✅ **권한 기반 데이터 분리**
  - 관리자: 모든 데이터 조회/수정 가능 (기존 기능 유지)
  - 일반 사용자: 발행된 데이터만 조회 가능 (보안 강화)
  - 비로그인 사용자: 공개 데이터만 접근 가능

- ✅ **실시간 콘텐츠 제어**
  - 관리자가 콘텐츠 발행 상태 변경 시 홈페이지에 즉시 반영
  - 비공개 → 공개: 홈페이지에 즉시 표시
  - 공개 → 비공개: 홈페이지에서 즉시 숨김

**이전 변경사항 (2025-09-19 저녁 - 동적 페이지 변환 완료)**:

- ✅ **정적 페이지를 동적 페이지로 완전 변환**
  - 메인 페이지 (`/`): 하드코딩된 시설 타입을 데이터베이스에서 실시간 조회로 변경
  - 공지사항 페이지 (`/announcements`): 정적 테이블을 데이터베이스 연동으로 변경
  - FAQ 페이지 (`/qna`): 하드코딩된 FAQ 배열을 데이터베이스 연동으로 변경
  - 시설 페이지 (`/facilities`): 정적 시설 정보를 동적 데이터로 변경

- ✅ **서버 컴포넌트 기반 SEO 최적화**
  - 모든 페이지를 서버 컴포넌트로 구현하여 SEO 성능 유지
  - 초기 로딩 성능 최적화 (클라이언트 API 호출 불필요)
  - 하이브리드 접근법으로 FAQ 아코디언 기능은 클라이언트 컴포넌트로 분리

- ✅ **공개 API 엔드포인트 신규 생성**
  - `/api/public/facilities/route.ts`: 활성화된 시설 목록 조회 API
  - 공개 페이지에서 사용할 수 있는 권한 없는 데이터 조회 전용

- ✅ **관리자-홈페이지 실시간 연동 구현**
  - 관리자 페이지에서 시설 추가/수정 → 메인 페이지에 즉시 반영
  - 공지사항 발행 → 공지사항 페이지에 즉시 반영
  - FAQ 발행 → FAQ 페이지에 즉시 반영
  - 시설 정보 업데이트 → 시설 페이지에 즉시 반영

- ✅ **컴포넌트 아키텍처 개선**
  - `FaqAccordion.tsx`: 클라이언트 컴포넌트로 분리된 FAQ 아코디언
  - 카테고리 표시, 빈 상태 처리, 동적 데이터 바인딩 지원
  - 타입 안전성 완벽 지원 (`Faq` 인터페이스 정의)

- ✅ **사용자 경험 향상**
  - 메인 페이지: 실제 시설 데이터로 시설명, 설명, 유형, 수용인원 표시
  - 시설 페이지: 요금 정보, 편의시설, 예약 링크까지 완전한 정보 제공
  - 빈 상태 처리: "등록된 시설이 없습니다" 등 적절한 메시지 표시

**이전 변경사항 (2025-09-19 저녁 - 시설 관리 시스템)**:

- ✅ **시설 관리 시스템 7가지 주요 문제 해결**
  - 구역 등록/수정 API 오류 해결: `requireAdminAccess` 통일로 RLS 정책 위반 제거
  - 공지사항/FAQ 발행 로직 수정: `fix_content_publication_policies.sql` 스크립트 생성
  - 시설 등록 모달에 시설 유형 선택 추가: "야외", "실내", "독채" 옵션 제공
  - 시설 관리 페이지 레이아웃 개선: 대시보드 섹션을 페이지 상단으로 이동

- ✅ **API 인증 시스템 완전 통일**
  - `getAuthenticatedAdmin` → `requireAdminAccess` 전면 교체
  - 모든 관리자 API에서 일관된 인증 방식 적용
  - RLS 정책 위반 오류 완전 해결
  - 타입 안전성 및 에러 핸들링 개선

- ✅ **콘텐츠 발행 권한 시스템 구축**
  ```sql
  -- 새로운 RLS 정책 추가
  CREATE POLICY "notices_admin_select" ON notices FOR SELECT
  CREATE POLICY "notices_admin_insert" ON notices FOR INSERT
  CREATE POLICY "notices_admin_update" ON notices FOR UPDATE
  CREATE POLICY "notices_admin_delete" ON notices FOR DELETE
  CREATE POLICY "faqs_admin_select" ON faqs FOR SELECT
  CREATE POLICY "faqs_admin_insert" ON faqs FOR INSERT
  CREATE POLICY "faqs_admin_update" ON faqs FOR UPDATE
  CREATE POLICY "faqs_admin_delete" ON faqs FOR DELETE
  ```

- ✅ **시설 유형 분류 체계 개선**
  - 기존: 바베큐장, 펜션, 글램핑, 카라반, 캠핑장, 야외테이블, 파티룸, 기타
  - 개선: **야외**, **실내**, **독채** (3가지 간단명료한 분류)
  - 시설 등록/수정 모달에서 드롭다운으로 선택 가능
  - 3컬럼 레이아웃으로 UI 공간 효율성 향상

- ✅ **관리자 대시보드 UX 개선**
  - 통계 대시보드를 페이지 하단에서 상단으로 이동
  - 시설 통계, 구역 통계, 운영 현황 카드를 우선 배치
  - 관리자가 페이지 진입 시 즉시 핵심 정보 확인 가능
  - 탭 네비게이션 아래로 콘텐츠 영역 재배치

- ✅ **데이터베이스 정책 수정 스크립트**
  - `fix_content_publication_policies.sql` 파일 생성
  - 공지사항/FAQ 기본 발행 상태를 `false`로 변경
  - 관리자 명시적 발행 제어 시스템 구현
  - RLS 정책 완전 정비로 권한 기반 접근 제어 강화

- ✅ **시스템 안정성 및 코드 품질**
  - TypeScript 타입 일관성 유지
  - API 응답 표준화 및 에러 핸들링 개선
  - 폼 검증 및 사용자 피드백 시스템 강화
  - 보안 정책 준수 및 권한 검증 체계 완성

**이전 변경사항 (2025-09-18 오후)**:

- ✅ **콘텐츠 관리 시스템 완전 구현 (CRUD 완성)**
  - 공지사항 수정/삭제 API 구현: `/api/admin/notices/[id]` (GET/PUT/DELETE)
  - FAQ 수정/삭제 API 구현: `/api/admin/faqs/[id]` (GET/PUT/DELETE)
  - 권한 기반 접근 제어: 작성자/관리자만 수정/삭제 가능
  - 자동 타임스탬프 관리: `updated_at` 필드 자동 갱신

- ✅ **프론트엔드 수정/삭제 UI 완전 구현**
  - 공지사항 수정 모달: 기존 데이터 프리로드, 실시간 수정
  - FAQ 수정 모달: 카테고리, 순서, 발행 상태 관리
  - 삭제 확인 대화상자: 실수 방지를 위한 이중 확인
  - 로딩 상태 및 에러 처리: 사용자 경험 최적화

- ✅ **완전한 CRUD 기능**
  ```
  POST   /api/admin/notices            - 공지사항 생성
  GET    /api/admin/notices            - 공지사항 목록 조회 (발행/미발행 모두)
  GET    /api/admin/notices/[id]       - 개별 공지사항 조회
  PUT    /api/admin/notices/[id]       - 공지사항 수정
  DELETE /api/admin/notices/[id]       - 공지사항 삭제

  POST   /api/admin/faqs               - FAQ 생성
  GET    /api/admin/faqs               - FAQ 목록 조회 (카테고리별 필터링)
  GET    /api/admin/faqs/[id]          - 개별 FAQ 조회
  PUT    /api/admin/faqs/[id]          - FAQ 수정
  DELETE /api/admin/faqs/[id]          - FAQ 삭제
  ```

- ✅ **사용자 경험 개선**
  - 실시간 폼 검증 및 데이터 바인딩
  - 작업 진행 상태 시각적 피드백 ("수정 중...", "삭제 중...")
  - 자동 데이터 새로고침: 수정/삭제 후 목록 자동 업데이트
  - 일관된 모달 디자인 및 인터랙션 패턴

- ✅ **타입 안전성 및 코드 품질**
  - TypeScript 완벽 지원: 모든 API 및 UI 컴포넌트
  - 에러 핸들링 표준화: 일관된 에러 메시지 및 상태 코드
  - 권한 검증 시스템: `requireAdminAccess` 함수 활용
  - 데이터베이스 타입 동기화: `Database` 타입 완벽 활용

- ✅ **배포 완료**
  - Git 커밋: `84433c4` - 콘텐츠 관리 UI 완전 구현
  - GitHub 푸시 완료 및 Vercel 자동 배포
  - 438줄 코드 추가 (수정/삭제 UI 및 핸들러)
  - 배포 URL: https://oso-home-01.vercel.app (정상 작동 확인)

**이전 변경사항 (2025-09-18 오전)**:

- ✅ **시설 관리 시스템 완전 구현**
  - 시설 생성/수정/삭제 모달 구현: 폼 검증, 기능 태그 관리, 활성화 상태 설정
  - 가격 모델 업데이트: `price_per_hour` → `price_per_session` (1타임 = 3시간)
  - 시설 수정 모달: 기존 데이터 로드, 실시간 수정, 유효성 검증
  - 시설 삭제 기능: 연관된 구역/예약 cascade 삭제 처리

- ✅ **구역 관리 시스템 완전 구현**
  - 구역 관리 모달: 시설별 구역 목록, 인라인 편집 기능
  - 구역 생성/수정/삭제: 실시간 CRUD 작업, 안전한 삭제 처리
  - 시설-구역 연관 관리: 시설별 구역 필터링 및 통계

- ✅ **콘텐츠 관리 시스템 확장**
  - 공지사항 작성 모달: 제목, 내용, 중요도, 발행 설정
  - FAQ 작성 모달: 질문, 답변, 카테고리, 순서, 발행 설정
  - 초안 저장 기능: 즉시 발행하지 않는 콘텐츠 관리

- ✅ **API 엔드포인트 완전 구현**
  ```
  POST   /api/admin/facilities          - 시설 생성
  PUT    /api/admin/facilities/[id]     - 시설 수정
  DELETE /api/admin/facilities/[id]     - 시설 삭제
  POST   /api/admin/sites              - 구역 생성
  PUT    /api/admin/sites/[id]         - 구역 수정
  DELETE /api/admin/sites/[id]         - 구역 삭제
  ```

- ✅ **데이터베이스 스키마 수정**
  - `facilities` 테이블: 가격 모델 업데이트 (`price_per_session`)
  - `sites` 테이블: JOIN 쿼리 최적화로 API 오류 해결
  - 중복 예약 방지 트리거 정상 작동

- ✅ **UI/UX 완전 개선**
  - 모달 기반 CRUD 인터페이스 구현
  - 실시간 폼 검증 및 에러 처리
  - 반응형 디자인 최적화
  - 로딩 상태 및 저장 중 상태 시각적 피드백

- ✅ **배포 완료**
  - Git 커밋: `0a4223a` - 시설 및 구역 관리 시스템 완전 구현
  - GitHub 푸시 완료 및 Vercel 자동 배포
  - 6개 파일 변경, 2,072줄 코드 추가
  - 배포 URL: https://oso-home-01.vercel.app (정상 작동 확인)

**이전 변경사항 (2025-09-17 오후)**:

- ✅ **관리자 일일 업무 관리 페이지 완성 구현**
  - 신규 예약 승인 대기 (`/admin/pending-reservations`): 입금 대기 예약 승인/거부 처리
  - 취소 요청 처리 (`/admin/cancelled-reservations`): 취소된 예약의 환불 처리 관리
  - 오늘 예약 현황 점검 (`/admin/today-reservations`): 당일 예약 현황 및 시설 준비 관리
  - 미발행 공지사항 관리 (`/admin/unpublished-notices`): 작성된 공지사항 검토 및 발행

- ✅ **일일 업무 페이지 고급 기능**
  - 역할 기반 접근 제어 (ADMIN/MANAGER만 접근 가능)
  - 실시간 데이터 조회 및 샘플 데이터 제공
  - 상태별 필터링 (환불 대기/완료, 시간대별, 시설별)
  - 확인 대화상자로 실수 방지 및 안전한 작업 처리
  - 관리자 메모 시스템 및 처리 이력 관리

- ✅ **사용자 경험 및 인터페이스**
  - 미리보기 모달 (공지사항 전체 내용 확인)
  - 진행 상태 표시 및 로딩 애니메이션
  - 통계 카드 및 빠른 액션 메뉴
  - 체크리스트 제공 (시설 준비, 발행 전 검토)
  - 반응형 카드 레이아웃 및 모바일 최적화

- ✅ **비즈니스 로직 구현**
  - 예약 승인/거부 처리 워크플로우
  - 환불 처리 상태 관리 (대기/완료)
  - 시설별 점유율 계산 및 시각화
  - 공지사항 중요도 표시 및 발행 관리
  - 시간대별 예약 분포 및 통계

- ✅ **배포 완료**
  - Git 커밋: `8959c7b` - 관리자 일일 업무 관리 페이지 구현
  - GitHub 푸시 완료 및 Vercel 자동 배포
  - 4개 업무 페이지 (2,036줄 코드 추가)
  - 로컬 테스트 완료 (http://localhost:3006)

**이전 변경사항 (2025-09-17 오전)**:

- ✅ **관리자 대시보드 완전 기능 구현**
  - 콘텐츠 관리 페이지 (`/admin/content`): 공지사항과 FAQ 관리
  - 시설 관리 페이지 (`/admin/facilities`): 바베큐 시설과 구역 관리
  - 사용자 관리 페이지 (`/admin/users`): 시스템 사용자 및 통계 관리
  - 분석 대시보드 (`/admin/analytics`): 종합적인 데이터 분석 및 시각화
  - 시스템 설정 페이지 (`/admin/settings`): 전체 시스템 설정 관리

- ✅ **관리자 페이지 고급 기능**
  - 실시간 데이터 조회 및 통계 표시
  - 검색 및 필터링 기능 (사용자 관리)
  - 탭 기반 인터페이스 (콘텐츠, 시설, 설정)
  - 반응형 디자인 및 모바일 최적화
  - 역할 기반 접근 제어 (ADMIN/MANAGER 권한)

- ✅ **UI/UX 개선사항**
  - DaisyUI 컴포넌트 일관성 유지
  - 로딩 상태 및 에러 처리 개선
  - 통계 카드 및 데이터 시각화
  - 직관적인 네비게이션 구조
  - 실시간 새로고침 기능

- ✅ **타입 안전성 및 코드 품질**
  - 모든 새 페이지에서 TypeScript 완벽 지원
  - API 인터페이스 타입 정의
  - 에러 핸들링 표준화
  - 코드 재사용성 향상

- ✅ **첫 번째 배포 완료**
  - Git 커밋: `39b733d` - 관리자 대시보드 기능 페이지 구현
  - GitHub 푸시 완료 및 Vercel 자동 배포
  - 5개 관리자 페이지 (2,365줄 코드 추가)

**이전 변경사항 (2025-09-17 오전)**:
- ✅ **Supabase 프로젝트 환경 설정 완료**
  - 새로운 Supabase 프로젝트로 이전 (`nrblnfmknolgsqpcqite.supabase.co`)
  - 환경변수 업데이트 및 개발 서버 재시작
  - RLS 정책 분석 및 인증 시스템 정상화
  - 401 인증 오류 완전 해결

- ✅ **데이터베이스 테이블 구조 일관성 확보**
  - `announcements` → `notices` 테이블명 통일
  - `add_missing_tables.sql` 스크립트 생성 및 실행
  - notices, faqs 테이블 RLS 정책 설정
  - 샘플 데이터 삽입 완료

- ✅ **관리자 인증 시스템 완전 복구**
  - Supabase Auth와 users 테이블 연동 확인
  - 관리자 로그인 정상 작동 (admin@osobbq.com)
  - 관리자 대시보드 접근 권한 검증
  - Bearer 토큰 기반 API 인증 정상화

- ✅ **API 시스템 전체 테스트 완료**
  - `/api/public/notices`: 2개 공지사항 정상 반환
  - `/api/public/faqs`: 8개 FAQ (reservation, facility 카테고리)
  - `/api/reservations/lookup`: 4개 시설, 12개 사이트 가용성 조회
  - Legacy API deprecation 메시지 정상 출력

- ✅ **시설 정보 데이터 완전 구축**
  - 프라이빗룸 A: 3개 사이트 (각 6인 수용)
  - 텐트동 B: 2개 사이트 (각 8인 수용)
  - 야외 소파테이블 C: 4개 사이트 (각 4인 수용)
  - VIP동 D: 1개 사이트 (10인 수용)
  - 모든 시간대(1부/2부/3부) 예약 가능 상태

- ✅ **배포 파이프라인 정상 작동**
  - Git 커밋: `b40e435` - 데이터베이스 일관성 수정
  - GitHub 푸시 완료
  - Vercel 자동 배포 트리거
  - 로컬 개발 서버: http://localhost:3004

**이전 변경사항 (2024-09-17)**:
- ✅ **DaisyUI 5.1.12 컴포넌트 라이브러리 통합**
  - Tailwind CSS 4.x와 완벽 호환 설정
  - CSS 파일에서 `@plugin "daisyui"` 방식 적용
  - 5가지 테마 시스템 구현 (light, dark, emerald, forest, garden)
  - 실시간 테마 전환 기능 및 로컬 스토리지 저장

- ✅ **UI 컴포넌트 현대화**
  - Header: DaisyUI navbar, dropdown, button 컴포넌트로 리팩토링
  - 메인 페이지: hero, card, avatar 컴포넌트로 완전 재디자인
  - 반응형 디자인 최적화 및 모바일 UX 개선
  - 일관된 디자인 시스템 구축

- ✅ **레거시 API 마이그레이션 4단계 완료**
  - Phase 1: 공지사항/FAQ API 현대화 (`/api/public/notices`, `/api/public/faqs`)
  - Phase 2: 관리자 대시보드 API 현대화 (`/api/admin/analytics`)
  - Phase 3: 예약 관리 API 통합 (`/api/admin/reservations/management`)
  - Phase 4: 사용자 관리 API 완전 제거 (Supabase Dashboard로 이전)

- ✅ **권한 기반 접근 제어 시스템 구현**
  - `auth-helpers.ts`: 역할별 권한 검증 (USER/MANAGER/ADMIN)
  - Bearer 토큰 기반 인증
  - 세분화된 권한 체계

- ✅ **타입 안전성 완벽 구현**
  - 모든 새 API에서 Database 타입 활용
  - Next.js 15 호환성 개선 (params Promise 처리)
  - TypeScript strict 모드 완전 지원

- ✅ **표준화된 API 응답 시스템**
  - 일관된 에러 처리 및 응답 형식
  - Deprecation 헤더 및 마이그레이션 가이드 제공
  - HTTP 410 Gone 상태로 적절한 레거시 API 처리

**기술적 성과**:
- 🚀 **완전한 현대화**: SKU 기반 → Facility 기반 시스템
- 🔒 **보안 강화**: 역할 기반 접근 제어, 토큰 인증
- 📊 **확장성**: 모듈화된 API 구조, 타입 안전성
- 🎯 **성능**: 인덱스 최적화, 효율적인 쿼리
- 🛠️ **유지보수성**: 표준화된 에러 처리, 명확한 문서화
- 🎨 **UI/UX**: DaisyUI 기반 모던 디자인 시스템, 다중 테마 지원
- ✅ **완전한 CRUD**: 콘텐츠 관리, 시설 관리 모든 기능 구현
- 🔄 **실시간 관리**: 모달 기반 즉시 수정/삭제 시스템

## 🎨 DaisyUI 통합 상세 (NEW - 2024-09-17)

### 설치 및 설정
```bash
npm install daisyui@5.1.12
```

### Tailwind CSS 4.x 호환 설정
```css
/* src/app/globals.css */
@import "tailwindcss";
@plugin "daisyui" {
  themes: ["light", "dark", "emerald", "forest", "garden"];
  darkTheme: "dark";
}
```

### 주요 컴포넌트 적용
- **Header Navigation** (`src/components/organisms/Header.tsx`)
  - `navbar`: 메인 네비게이션 구조
  - `dropdown`: 모바일 메뉴 및 테마 선택기
  - `btn`: 모든 버튼 요소 표준화
  - `menu`: 네비게이션 메뉴 항목

- **메인 페이지** (`src/app/page.tsx`)
  - `hero`: 메인 배너 섹션
  - `card`: 특징 및 시설 소개 카드
  - `avatar`: 아이콘 표시 요소

- **테마 컨트롤러** (`src/components/organisms/ThemeController.tsx`)
  - 실시간 테마 전환 기능
  - localStorage 기반 테마 설정 저장
  - 5가지 테마 선택 옵션

### 반응형 디자인 개선
- 모바일 최적화된 드롭다운 메뉴
- 터치 친화적인 버튼 크기 조정
- 일관된 색상 시스템 및 spacing

### 빌드 결과
- CSS 크기: 15.5KB (DaisyUI 포함)
- 컴파일 성공: `/*! 🌼 daisyUI 5.1.12 */` 확인
- 모든 TypeScript 타입 에러 해결

## 📋 환경 설정 정보 (NEW - 2025-09-17)

### Supabase 프로젝트 정보
```bash
# 현재 사용 중인 Supabase 프로젝트
NEXT_PUBLIC_SUPABASE_URL=https://nrblnfmknolgsqpcqite.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYmxuZm1rbm9sZ3NxcGNxaXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4Nzg3NDEsImV4cCI6MjA3MjQ1NDc0MX0.8zy753R0nLtzr7a4UdpD1JjVUnNzikSfQTbO2sqnrUo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYmxuZm1rbm9sZ3NxcGNxaXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg3ODc0MSwiZXhwIjoyMDcyNDU0NzQxfQ.Qv4SqwA9syrS6Xd1SGvOwwbJVsIbK-7fKvubvIuXyQM
```

### 개발 환경
- **로컬 서버**: http://localhost:3004
- **프로덕션 URL**: Vercel 자동 배포
- **데이터베이스**: 완전 구축 (4개 시설, 12개 사이트)
- **관리자 계정**: admin@osobbq.com (Supabase Auth 연동)

### 데이터베이스 상태
- **users**: RLS 정책 정상 작동
- **facilities**: 4개 시설 (private, tent, outdoor_sofa, vip)
- **sites**: 12개 사이트 (모든 시간대 예약 가능)
- **notices**: 2개 공지사항 (샘플 데이터)
- **faqs**: 8개 FAQ (reservation, facility 카테고리)
- **reservations**: 예약 테이블 (중복 방지 트리거 작동)

### API 엔드포인트 상태
- ✅ `/api/public/notices`: 공지사항 조회
- ✅ `/api/public/faqs`: FAQ 조회
- ✅ `/api/reservations/lookup`: 실시간 가용성 조회
- ✅ `/api/auth/login`: 관리자 로그인
- ✅ `/api/admin/*`: 관리자 대시보드 API

### 최근 커밋 정보
- **커밋 ID**: `b40e435`
- **메시지**: "fix: database table name consistency and add missing tables script"
- **변경 파일**:
  - `src/app/test-db/page.tsx` (테이블명 수정)
  - `add_missing_tables.sql` (누락 테이블 생성 스크립트)