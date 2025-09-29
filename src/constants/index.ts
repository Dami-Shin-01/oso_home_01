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

// 시간대 정의 (환경변수 기반 유틸리티로 대체됨)
export const TIME_SLOTS = {
  SLOT_1: 1,
  SLOT_2: 2,
  SLOT_3: 3,
  SLOT_4: 4
} as const;

// 레거시 호환성을 위해 유지 (새 코드에서는 time-slots.ts 사용 권장)
export {
  getTimeSlotLabel,
  getLegacyTimeSlotLabels as TIME_SLOT_LABELS,
  getTimeSlotOptions
} from '@/lib/time-slots';

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
    SIGNUP: '/api/auth/signup',
    PROFILE: '/api/auth/profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
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
  ANNOUNCEMENTS: {
    LIST: '/api/announcements',
    DETAIL: (id: string) => `/api/announcements/${id}`
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
  },
  // 관리자 대시보드
  ADMIN: {
    DASHBOARD_STATS: '/api/admin/dashboard/stats',
    RECENT_RESERVATIONS: '/api/admin/dashboard/recent-reservations',
    DASHBOARD_TASKS: '/api/admin/dashboard/tasks'
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

// 연락처 정보 (환경변수 기반 유틸리티로 대체됨)
// 레거시 호환성을 위해 유지 (새 코드에서는 store-config.ts 사용 권장)
export {
  getStoreBasicInfo as CONTACT_INFO,
  getStoreLocationInfo
} from '@/lib/store-config';

export {
  getBankAccountForEmail
} from '@/lib/bank-account';