/**
 * 클라이언트 안전 매장 설정 함수들
 * 이 파일의 모든 함수는 브라우저(클라이언트)에서 안전하게 실행 가능합니다.
 * createClient()만 사용하며 createAdminClient()는 사용하지 않습니다.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  StoreSetting,
  StoreBasicInfo,
  TimeSlots,
  PaymentInfo,
  BusinessPolicies,
  MarketingInfo,
  SocialMediaInfo
} from './types';

// Re-export types for convenience
export type {
  StoreSetting,
  StoreBasicInfo,
  TimeSlots,
  PaymentInfo,
  BusinessPolicies,
  MarketingInfo,
  SocialMediaInfo
} from './types';

/**
 * 모든 공개 설정 조회 (클라이언트에서 사용)
 */
export async function getPublicSettings(): Promise<Record<string, string>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('store_settings')
    .select('key, value')
    .eq('is_public', true);

  if (error) {
    console.error('Failed to fetch public settings:', error);
    return {};
  }

  return data.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * 특정 설정값 조회
 */
export async function getSetting(key: string): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    console.error(`Failed to fetch setting ${key}:`, error);
    return null;
  }

  return data?.value || null;
}

/**
 * 여러 설정값 조회
 */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('store_settings')
    .select('key, value')
    .in('key', keys);

  if (error) {
    console.error('Failed to fetch settings:', error);
    return {};
  }

  return data.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * 매장 기본 정보 조회
 */
export async function getStoreBasicInfo(): Promise<StoreBasicInfo> {
  const settings = await getSettings([
    'STORE_NAME', 'STORE_PHONE', 'STORE_EMAIL', 'STORE_NOREPLY_EMAIL',
    'STORE_ADMIN_EMAIL', 'STORE_ADDRESS', 'STORE_DETAILED_ADDRESS',
    'STORE_BUSINESS_HOURS', 'STORE_CLOSED_DAY'
  ]);

  return {
    name: settings.STORE_NAME || '매장명',
    phone: settings.STORE_PHONE || '전화번호',
    email: settings.STORE_EMAIL || 'info@store.com',
    noreplyEmail: settings.STORE_NOREPLY_EMAIL || 'noreply@store.com',
    adminEmail: settings.STORE_ADMIN_EMAIL || 'admin@store.com',
    address: settings.STORE_ADDRESS || '주소',
    detailedAddress: settings.STORE_DETAILED_ADDRESS,
    businessHours: settings.STORE_BUSINESS_HOURS || '영업시간',
    closedDay: settings.STORE_CLOSED_DAY
  };
}

/**
 * 시간대 정보 조회
 */
export async function getTimeSlots(): Promise<TimeSlots> {
  const settings = await getSettings([
    'TIME_SLOT_1', 'TIME_SLOT_2', 'TIME_SLOT_3', 'TIME_SLOT_4',
    'TIME_SLOT_1_NAME', 'TIME_SLOT_2_NAME', 'TIME_SLOT_3_NAME', 'TIME_SLOT_4_NAME'
  ]);

  const timeSlots: TimeSlots = {
    slot1: {
      time: settings.TIME_SLOT_1 || '10:00-14:00',
      name: settings.TIME_SLOT_1_NAME || '1부'
    },
    slot2: {
      time: settings.TIME_SLOT_2 || '14:00-18:00',
      name: settings.TIME_SLOT_2_NAME || '2부'
    },
    slot3: {
      time: settings.TIME_SLOT_3 || '18:00-22:00',
      name: settings.TIME_SLOT_3_NAME || '3부'
    }
  };

  if (settings.TIME_SLOT_4 && settings.TIME_SLOT_4_NAME) {
    timeSlots.slot4 = {
      time: settings.TIME_SLOT_4,
      name: settings.TIME_SLOT_4_NAME
    };
  }

  return timeSlots;
}

/**
 * 결제 정보 조회
 */
export async function getPaymentInfo(): Promise<PaymentInfo> {
  const settings = await getSettings(['BANK_NAME', 'BANK_ACCOUNT_NUMBER', 'BANK_ACCOUNT_HOLDER']);

  return {
    bankName: settings.BANK_NAME || '은행명',
    accountNumber: settings.BANK_ACCOUNT_NUMBER || '계좌번호',
    accountHolder: settings.BANK_ACCOUNT_HOLDER || '예금주'
  };
}

/**
 * 비즈니스 정책 조회
 */
export async function getBusinessPolicies(): Promise<BusinessPolicies> {
  const settings = await getSettings([
    'CANCELLATION_POLICY', 'REFUND_POLICY',
    'MAX_ADVANCE_BOOKING_DAYS', 'MIN_ADVANCE_BOOKING_HOURS'
  ]);

  return {
    cancellationPolicy: settings.CANCELLATION_POLICY || '취소 정책',
    refundPolicy: settings.REFUND_POLICY || '환불 정책',
    maxAdvanceBookingDays: parseInt(settings.MAX_ADVANCE_BOOKING_DAYS) || 30,
    minAdvanceBookingHours: parseInt(settings.MIN_ADVANCE_BOOKING_HOURS) || 2
  };
}

/**
 * 마케팅 정보 조회
 */
export async function getMarketingInfo(): Promise<MarketingInfo> {
  const settings = await getSettings(['SITE_TITLE', 'SITE_DESCRIPTION', 'SITE_KEYWORDS']);

  return {
    siteTitle: settings.SITE_TITLE || '사이트 제목',
    siteDescription: settings.SITE_DESCRIPTION || '사이트 설명',
    siteKeywords: settings.SITE_KEYWORDS
  };
}

/**
 * 소셜 미디어 정보 조회
 */
export async function getSocialMediaInfo(): Promise<SocialMediaInfo> {
  const settings = await getSettings(['SOCIAL_INSTAGRAM_URL', 'SOCIAL_FACEBOOK_URL', 'SOCIAL_BLOG_URL']);

  return {
    instagramUrl: settings.SOCIAL_INSTAGRAM_URL,
    facebookUrl: settings.SOCIAL_FACEBOOK_URL,
    blogUrl: settings.SOCIAL_BLOG_URL
  };
}

/**
 * 정책 URL 조회 (이용약관, 개인정보처리방침)
 */
export async function getPolicyUrls(): Promise<{ termsOfServiceUrl: string; privacyPolicyUrl: string }> {
  const settings = await getSettings(['TERMS_OF_SERVICE_URL', 'PRIVACY_POLICY_URL']);

  return {
    termsOfServiceUrl: settings.TERMS_OF_SERVICE_URL || '/terms',
    privacyPolicyUrl: settings.PRIVACY_POLICY_URL || '/privacy'
  };
}

/**
 * SEO OG 이미지 URL 조회
 */
export async function getOgImageUrl(): Promise<string> {
  const value = await getSetting('SITE_OG_IMAGE_URL');
  return value || '/images/og-image.jpg';
}

/**
 * 분석 도구 ID 조회 (Google Analytics, GTM)
 */
export async function getAnalyticsIds(): Promise<{ googleAnalyticsId: string; googleTagManagerId: string }> {
  const settings = await getSettings(['GOOGLE_ANALYTICS_ID', 'GOOGLE_TAG_MANAGER_ID']);

  return {
    googleAnalyticsId: settings.GOOGLE_ANALYTICS_ID || '',
    googleTagManagerId: settings.GOOGLE_TAG_MANAGER_ID || ''
  };
}
