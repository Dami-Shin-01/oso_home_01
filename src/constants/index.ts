// 사용자 역할
export const USER_ROLES = {
  USER: 'USER',
  MANAGER: 'MANAGER', 
  ADMIN: 'ADMIN'
} as const;

// 예약 상태
export const RESERVATION_STATUS = {
  PENDING: 'PENDING',        // 입금 대기
  CONFIRMED: 'CONFIRMED',    // 예약 확정
  CANCELLED: 'CANCELLED'     // 예약 취소
} as const;

// 결제 상태
export const PAYMENT_STATUS = {
  WAITING: 'WAITING',        // 입금 대기
  COMPLETED: 'COMPLETED',    // 결제 완료
  REFUNDED: 'REFUNDED'       // 환불 완료
} as const;

// 시간대 정의
export const TIME_SLOTS = {
  SLOT_1: 1,  // 1부: 10:00-14:00
  SLOT_2: 2,  // 2부: 14:00-18:00
  SLOT_3: 3,  // 3부: 18:00-22:00
  SLOT_4: 4   // 4부: 22:00-02:00 (추후 확장)
} as const;

export const TIME_SLOT_LABELS: Record<number, string> = {
  [TIME_SLOTS.SLOT_1]: '1부 (10:00-14:00)',
  [TIME_SLOTS.SLOT_2]: '2부 (14:00-18:00)',
  [TIME_SLOTS.SLOT_3]: '3부 (18:00-22:00)',
  [TIME_SLOTS.SLOT_4]: '4부 (22:00-02:00)'
};

// 타입 가드 함수 추가
export const getTimeSlotLabel = (slot: number): string => {
  return TIME_SLOT_LABELS[slot] || `${slot}부 (시간 미정)`;
};

// 공간 타입
export const FACILITY_TYPES = {
  PRIVATE_ROOM: 'private_room',
  TENT: 'tent',
  OUTDOOR_SOFA: 'outdoor_sofa',
  OUTDOOR_TABLE: 'outdoor_table',
  VIP: 'vip'
} as const;

export const FACILITY_TYPE_LABELS = {
  [FACILITY_TYPES.PRIVATE_ROOM]: '프라이빗룸',
  [FACILITY_TYPES.TENT]: '텐트동',
  [FACILITY_TYPES.OUTDOOR_SOFA]: '야외 소파테이블',
  [FACILITY_TYPES.OUTDOOR_TABLE]: '야외 야장테이블',
  [FACILITY_TYPES.VIP]: 'VIP동'
} as const;

// API 엔드포인트
export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh'
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
  ANNOUNCEMENTS: {
    LIST: '/api/announcements',
    DETAIL: (id: string) => `/api/announcements/${id}`
  },
  // 사용자
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile'
  }
} as const;

// 페이지 라우트
export const ROUTES = {
  HOME: '/',
  FACILITIES: '/facilities',
  RESERVATION: '/reservation',
  ANNOUNCEMENTS: '/announcements',
  QNA: '/qna',
  LOCATION: '/location',
  GUEST_RESERVATION: '/guest-reservation',
  LOGIN: '/login',
  REGISTER: '/register',
  MY_PAGE: '/my',
  ADMIN: '/admin'
} as const;

// 연락처 정보
export const CONTACT_INFO = {
  PHONE: '02-1234-5678',
  ADDRESS: '서울특별시 강남구 테헤란로 123',
  BUSINESS_HOURS: '오전 10시 - 오후 10시',
  CLOSED_DAY: '매주 월요일',
  BANK_ACCOUNT: '농협 123-456-789012',
  ACCOUNT_HOLDER: '오소바베큐장'
} as const;