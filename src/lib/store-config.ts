/**
 * 통합 매장 설정 관리 시스템 (데이터베이스 기반)
 * 데이터베이스에서 설정을 가져와 타입 안전성을 보장합니다.
 */

import {
  getStoreBasicInfo as getStoreBasicInfoFromDB,
  getTimeSlots,
  getBusinessPolicies,
  getMarketingInfo,
  getSocialMediaInfo,
  getPolicyUrls,
  getOgImageUrl,
  getAnalyticsIds
} from '@/lib/store-settings';

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
 * 데이터베이스에서 매장 기본 정보를 가져옵니다
 */
export async function getStoreBasicInfo(): Promise<StoreBasicInfo> {
  try {
    const dbInfo = await getStoreBasicInfoFromDB();
    return {
      name: dbInfo.name,
      phone: dbInfo.phone,
      email: dbInfo.email,
      noreplyEmail: dbInfo.noreplyEmail,
      adminEmail: dbInfo.adminEmail
    };
  } catch (error) {
    console.error('Error fetching store basic info:', error);
    return {
      name: '바베큐장',
      phone: '02-0000-0000',
      email: 'info@bbq.com',
      noreplyEmail: 'noreply@bbq.com',
      adminEmail: 'admin@bbq.com'
    };
  }
}

/**
 * 데이터베이스에서 매장 위치 정보를 가져옵니다
 */
export async function getStoreLocationInfo(): Promise<StoreLocationInfo> {
  try {
    const basicInfo = await getStoreBasicInfoFromDB();
    return {
      address: basicInfo.address,
      detailedAddress: basicInfo.detailedAddress || '',
      businessHours: basicInfo.businessHours,
      closedDay: basicInfo.closedDay || ''
    };
  } catch (error) {
    console.error('Error fetching store location info:', error);
    return {
      address: '서울특별시 강남구',
      detailedAddress: '',
      businessHours: '오전 10시 - 오후 10시',
      closedDay: '매주 월요일'
    };
  }
}

/**
 * 데이터베이스에서 시간대 설정을 가져옵니다
 */
export async function getStoreTimeSlots(): Promise<StoreTimeSlots> {
  try {
    const dbTimeSlots = await getTimeSlots();
    return {
      slot1: dbTimeSlots.slot1.time,
      slot2: dbTimeSlots.slot2.time,
      slot3: dbTimeSlots.slot3.time,
      slot4: dbTimeSlots.slot4?.time || '22:00-02:00',
      slot1Name: dbTimeSlots.slot1.name,
      slot2Name: dbTimeSlots.slot2.name,
      slot3Name: dbTimeSlots.slot3.name,
      slot4Name: dbTimeSlots.slot4?.name || '4부'
    };
  } catch (error) {
    console.error('Error fetching store time slots:', error);
    return {
      slot1: '10:00-14:00',
      slot2: '14:00-18:00',
      slot3: '18:00-22:00',
      slot4: '22:00-02:00',
      slot1Name: '1부',
      slot2Name: '2부',
      slot3Name: '3부',
      slot4Name: '4부'
    };
  }
}

/**
 * 데이터베이스에서 매장 정책을 가져옵니다
 */
export async function getStorePolicies(): Promise<StorePolicies> {
  try {
    const [dbPolicies, policyUrls] = await Promise.all([
      getBusinessPolicies(),
      getPolicyUrls()
    ]);

    return {
      cancellationPolicy: dbPolicies.cancellationPolicy,
      refundPolicy: dbPolicies.refundPolicy,
      termsOfServiceUrl: policyUrls.termsOfServiceUrl,
      privacyPolicyUrl: policyUrls.privacyPolicyUrl,
      maxAdvanceBookingDays: dbPolicies.maxAdvanceBookingDays,
      minAdvanceBookingHours: dbPolicies.minAdvanceBookingHours
    };
  } catch (error) {
    console.error('Error fetching store policies:', error);
    return {
      cancellationPolicy: '예약일 1일 전까지 취소 가능합니다',
      refundPolicy: '취소 정책에 따라 환불됩니다',
      termsOfServiceUrl: '/terms',
      privacyPolicyUrl: '/privacy',
      maxAdvanceBookingDays: 30,
      minAdvanceBookingHours: 2
    };
  }
}

/**
 * 데이터베이스에서 SEO 정보를 가져옵니다
 */
export async function getStoreSEOInfo(): Promise<StoreSEOInfo> {
  try {
    const [dbMarketing, ogImageUrl] = await Promise.all([
      getMarketingInfo(),
      getOgImageUrl()
    ]);

    const keywords = dbMarketing.siteKeywords || 'babeque,reservation,bbq';
    return {
      title: dbMarketing.siteTitle,
      description: dbMarketing.siteDescription,
      keywords: keywords.split(',').map(k => k.trim()),
      ogImageUrl
    };
  } catch (error) {
    console.error('Error fetching store SEO info:', error);
    return {
      title: '바베큐장 예약 시스템',
      description: '바베큐장 시설 예약 시스템',
      keywords: ['babeque', 'reservation', 'bbq'],
      ogImageUrl: '/images/og-image.jpg'
    };
  }
}

/**
 * 데이터베이스에서 소셜 미디어 정보를 가져옵니다
 */
export async function getStoreSocialMedia(): Promise<StoreSocialMedia> {
  try {
    const dbSocial = await getSocialMediaInfo();
    return {
      instagramUrl: dbSocial.instagramUrl || '',
      facebookUrl: dbSocial.facebookUrl || '',
      blogUrl: dbSocial.blogUrl || ''
    };
  } catch (error) {
    console.error('Error fetching store social media info:', error);
    return {
      instagramUrl: '',
      facebookUrl: '',
      blogUrl: ''
    };
  }
}

/**
 * 데이터베이스에서 분석 도구 정보를 가져옵니다
 */
export async function getStoreAnalytics(): Promise<StoreAnalytics> {
  try {
    const analyticsIds = await getAnalyticsIds();
    return {
      googleAnalyticsId: analyticsIds.googleAnalyticsId,
      googleTagManagerId: analyticsIds.googleTagManagerId
    };
  } catch (error) {
    console.error('Error fetching store analytics:', error);
    return {
      googleAnalyticsId: '',
      googleTagManagerId: ''
    };
  }
}

/**
 * 모든 매장 설정을 통합해서 반환합니다 (비동기)
 */
export async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const [basic, location, timeSlots, policies, seo, social, analytics] = await Promise.all([
      getStoreBasicInfo(),
      getStoreLocationInfo(),
      getStoreTimeSlots(),
      getStorePolicies(),
      getStoreSEOInfo(),
      getStoreSocialMedia(),
      getStoreAnalytics() // 이제 비동기 함수
    ]);

    return {
      basic,
      location,
      timeSlots,
      policies,
      seo,
      social,
      analytics
    };
  } catch (error) {
    console.error('Error fetching complete store config:', error);
    throw error;
  }
}

/**
 * 데이터베이스 기반 매장 설정 검증 - 필수 항목이 누락되었는지 확인
 */
export async function validateStoreConfig(): Promise<{ isValid: boolean; missingVars: string[] }> {
  try {
    const config = await getStoreConfig();
    const missingVars: string[] = [];

    // 필수 필드 체크
    if (!config.basic.name) missingVars.push('STORE_NAME');
    if (!config.basic.phone) missingVars.push('STORE_PHONE');
    if (!config.basic.email) missingVars.push('STORE_EMAIL');
    if (!config.location.address) missingVars.push('STORE_ADDRESS');
    if (!config.seo.title) missingVars.push('SITE_TITLE');
    if (!config.seo.description) missingVars.push('SITE_DESCRIPTION');

    return {
      isValid: missingVars.length === 0,
      missingVars
    };
  } catch (error) {
    console.error('Error validating store config:', error);
    return {
      isValid: false,
      missingVars: ['DATABASE_CONNECTION_ERROR']
    };
  }
}

/**
 * 클라이언트 사이드에서 사용할 수 있는 공개 설정만 반환
 * (민감한 정보는 제외)
 */
export async function getPublicStoreConfig() {
  try {
    const config = await getStoreConfig();

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
  } catch (error) {
    console.error('Error fetching public store config:', error);
    throw error;
  }
}

/**
 * 개발 모드에서 설정 정보를 콘솔에 출력 (디버깅용)
 */
export async function debugStoreConfig(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    try {
      const validation = await validateStoreConfig();
      console.log('🏪 Store Config Validation:', validation);

      if (!validation.isValid) {
        console.warn('⚠️ Missing database settings:', validation.missingVars);
      }

      const config = await getStoreConfig();
      console.log('🏪 Store Config:', config);
    } catch (error) {
      console.error('🏪 Store Config Debug Error:', error);
    }
  }
}