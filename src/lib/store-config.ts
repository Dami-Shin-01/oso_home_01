/**
 * 통합 매장 설정 관리 시스템
 * 모든 환경변수를 중앙에서 관리하고 타입 안전성을 보장합니다.
 */

export interface StoreBasicInfo {
  name: string;
  phone: string;
  email: string;
  noreplyEmail: string;
  adminEmail: string;
}

export interface StoreLocationInfo {
  address: string;
  detailedAddress: string;
  businessHours: string;
  closedDay: string;
}

export interface StoreTimeSlots {
  slot1: string;
  slot2: string;
  slot3: string;
  slot4: string;
  slot1Name: string;
  slot2Name: string;
  slot3Name: string;
  slot4Name: string;
}

export interface StorePolicies {
  cancellationPolicy: string;
  refundPolicy: string;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
}

export interface StoreSEOInfo {
  title: string;
  description: string;
  keywords: string[];
  ogImageUrl: string;
}

export interface StoreSocialMedia {
  instagramUrl: string;
  facebookUrl: string;
  blogUrl: string;
}

export interface StoreAnalytics {
  googleAnalyticsId: string;
  googleTagManagerId: string;
}

export interface StoreConfig {
  basic: StoreBasicInfo;
  location: StoreLocationInfo;
  timeSlots: StoreTimeSlots;
  policies: StorePolicies;
  seo: StoreSEOInfo;
  social: StoreSocialMedia;
  analytics: StoreAnalytics;
}

/**
 * 환경변수에서 매장 기본 정보를 가져옵니다
 */
export function getStoreBasicInfo(): StoreBasicInfo {
  return {
    name: process.env.STORE_NAME || '바베큐장',
    phone: process.env.STORE_PHONE || '02-0000-0000',
    email: process.env.STORE_EMAIL || 'info@bbq.com',
    noreplyEmail: process.env.STORE_NOREPLY_EMAIL || 'noreply@bbq.com',
    adminEmail: process.env.STORE_ADMIN_EMAIL || 'admin@bbq.com'
  };
}

/**
 * 환경변수에서 매장 위치 정보를 가져옵니다
 */
export function getStoreLocationInfo(): StoreLocationInfo {
  return {
    address: process.env.STORE_ADDRESS || '서울특별시 강남구',
    detailedAddress: process.env.STORE_DETAILED_ADDRESS || '서울특별시 강남구',
    businessHours: process.env.STORE_BUSINESS_HOURS || '오전 10시 - 오후 10시',
    closedDay: process.env.STORE_CLOSED_DAY || '매주 월요일'
  };
}

/**
 * 환경변수에서 시간대 설정을 가져옵니다
 */
export function getStoreTimeSlots(): StoreTimeSlots {
  return {
    slot1: process.env.TIME_SLOT_1 || '10:00-14:00',
    slot2: process.env.TIME_SLOT_2 || '14:00-18:00',
    slot3: process.env.TIME_SLOT_3 || '18:00-22:00',
    slot4: process.env.TIME_SLOT_4 || '22:00-02:00',
    slot1Name: process.env.TIME_SLOT_1_NAME || '1부',
    slot2Name: process.env.TIME_SLOT_2_NAME || '2부',
    slot3Name: process.env.TIME_SLOT_3_NAME || '3부',
    slot4Name: process.env.TIME_SLOT_4_NAME || '4부'
  };
}

/**
 * 환경변수에서 매장 정책을 가져옵니다
 */
export function getStorePolicies(): StorePolicies {
  return {
    cancellationPolicy: process.env.CANCELLATION_POLICY || '예약일 1일 전까지 취소 가능합니다',
    refundPolicy: process.env.REFUND_POLICY || '취소 정책에 따라 환불됩니다',
    termsOfServiceUrl: process.env.TERMS_OF_SERVICE_URL || '/terms',
    privacyPolicyUrl: process.env.PRIVACY_POLICY_URL || '/privacy',
    maxAdvanceBookingDays: parseInt(process.env.MAX_ADVANCE_BOOKING_DAYS || '30'),
    minAdvanceBookingHours: parseInt(process.env.MIN_ADVANCE_BOOKING_HOURS || '2')
  };
}

/**
 * 환경변수에서 SEO 정보를 가져옵니다
 */
export function getStoreSEOInfo(): StoreSEOInfo {
  const keywords = process.env.SITE_KEYWORDS || 'babeque,reservation,bbq';
  return {
    title: process.env.SITE_TITLE || '바베큐장 예약 시스템',
    description: process.env.SITE_DESCRIPTION || '바베큐장 시설 예약 시스템',
    keywords: keywords.split(',').map(k => k.trim()),
    ogImageUrl: process.env.SITE_OG_IMAGE_URL || '/images/og-image.jpg'
  };
}

/**
 * 환경변수에서 소셜 미디어 정보를 가져옵니다
 */
export function getStoreSocialMedia(): StoreSocialMedia {
  return {
    instagramUrl: process.env.SOCIAL_INSTAGRAM_URL || '',
    facebookUrl: process.env.SOCIAL_FACEBOOK_URL || '',
    blogUrl: process.env.SOCIAL_BLOG_URL || ''
  };
}

/**
 * 환경변수에서 분석 도구 정보를 가져옵니다
 */
export function getStoreAnalytics(): StoreAnalytics {
  return {
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',
    googleTagManagerId: process.env.GOOGLE_TAG_MANAGER_ID || ''
  };
}

/**
 * 모든 매장 설정을 통합해서 반환합니다
 */
export function getStoreConfig(): StoreConfig {
  return {
    basic: getStoreBasicInfo(),
    location: getStoreLocationInfo(),
    timeSlots: getStoreTimeSlots(),
    policies: getStorePolicies(),
    seo: getStoreSEOInfo(),
    social: getStoreSocialMedia(),
    analytics: getStoreAnalytics()
  };
}

/**
 * 환경변수 검증 - 필수 항목이 누락되었는지 확인
 */
export function validateStoreConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'STORE_NAME',
    'STORE_PHONE',
    'STORE_EMAIL',
    'STORE_ADDRESS',
    'SITE_TITLE',
    'SITE_DESCRIPTION'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

/**
 * 클라이언트 사이드에서 사용할 수 있는 공개 설정만 반환
 * (민감한 정보는 제외)
 */
export function getPublicStoreConfig() {
  const config = getStoreConfig();

  return {
    basic: {
      name: config.basic.name,
      phone: config.basic.phone,
      email: config.basic.email
      // adminEmail, noreplyEmail은 제외
    },
    location: config.location,
    timeSlots: config.timeSlots,
    policies: {
      cancellationPolicy: config.policies.cancellationPolicy,
      refundPolicy: config.policies.refundPolicy,
      termsOfServiceUrl: config.policies.termsOfServiceUrl,
      privacyPolicyUrl: config.policies.privacyPolicyUrl
      // booking 제한 정보는 제외
    },
    seo: config.seo,
    social: config.social
    // analytics는 제외
  };
}

/**
 * 개발 모드에서 설정 정보를 콘솔에 출력 (디버깅용)
 */
export function debugStoreConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    const validation = validateStoreConfig();
    console.log('🏪 Store Config Validation:', validation);

    if (!validation.isValid) {
      console.warn('⚠️ Missing environment variables:', validation.missingVars);
    }

    console.log('🏪 Store Config:', getStoreConfig());
  }
}