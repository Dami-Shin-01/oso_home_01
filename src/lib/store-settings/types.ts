/**
 * 매장 설정 타입 정의
 * 클라이언트와 서버 코드 간 공유되는 타입들
 */

import { StoreSettingRow } from '@/types/database';

// 설정 타입 정의 (데이터베이스 타입과 일치하도록 import)
export type StoreSetting = StoreSettingRow;

// 설정 카테고리별 타입
export interface StoreBasicInfo {
  name: string;
  phone: string;
  email: string;
  noreplyEmail: string;
  adminEmail: string;
  address: string;
  detailedAddress?: string;
  businessHours: string;
  closedDay?: string;
}

export interface TimeSlots {
  slot1: { time: string; name: string };
  slot2: { time: string; name: string };
  slot3: { time: string; name: string };
  slot4?: { time: string; name: string };
}

export interface PaymentInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface BusinessPolicies {
  cancellationPolicy: string;
  refundPolicy: string;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
}

export interface MarketingInfo {
  siteTitle: string;
  siteDescription: string;
  siteKeywords?: string;
}

export interface SocialMediaInfo {
  instagramUrl?: string;
  facebookUrl?: string;
  blogUrl?: string;
}
