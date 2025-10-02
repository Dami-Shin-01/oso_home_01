/**
 * 운영 정책 관리 유틸리티
 * 취소 정책, 환불 정책, 이용약관 등을 중앙에서 관리합니다.
 */

import { getStorePolicies } from './store-config';

export interface CancellationPolicy {
  description: string;
  deadlineHours: number;
  allowCancellation: boolean;
  penaltyPolicy: string;
}

export interface RefundPolicy {
  description: string;
  processingTime: string;
  conditions: string[];
  feePolicy: string;
}

export interface BookingPolicy {
  maxAdvanceDays: number;
  minAdvanceHours: number;
  description: string;
}

export interface TermsPolicy {
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
  lastUpdated: string;
}

/**
 * 취소 정책 정보를 반환합니다
 */
export async function getCancellationPolicy(): Promise<CancellationPolicy> {
  const policies = await getStorePolicies();

  return {
    description: policies.cancellationPolicy,
    deadlineHours: 24, // 기본값: 24시간 전
    allowCancellation: true,
    penaltyPolicy: '취소 시점에 따라 수수료가 부과될 수 있습니다.'
  };
}

/**
 * 환불 정책 정보를 반환합니다
 */
export async function getRefundPolicy(): Promise<RefundPolicy> {
  const policies = await getStorePolicies();

  return {
    description: policies.refundPolicy,
    processingTime: '영업일 기준 3-5일',
    conditions: [
      '예약 취소 시점이 정책에 부합해야 합니다',
      '결제한 카드로만 환불이 가능합니다',
      '무통장 입금의 경우 계좌 확인이 필요합니다'
    ],
    feePolicy: '취소 시점에 따라 수수료가 차감될 수 있습니다'
  };
}

/**
 * 예약 정책 정보를 반환합니다
 */
export async function getBookingPolicy(): Promise<BookingPolicy> {
  const policies = await getStorePolicies();

  return {
    maxAdvanceDays: policies.maxAdvanceBookingDays,
    minAdvanceHours: policies.minAdvanceBookingHours,
    description: `최대 ${policies.maxAdvanceBookingDays}일 전까지, 최소 ${policies.minAdvanceBookingHours}시간 전까지 예약 가능합니다.`
  };
}

/**
 * 이용약관 및 개인정보 처리방침 정보를 반환합니다
 */
export async function getTermsPolicy(): Promise<TermsPolicy> {
  const policies = await getStorePolicies();

  return {
    termsOfServiceUrl: policies.termsOfServiceUrl,
    privacyPolicyUrl: policies.privacyPolicyUrl,
    lastUpdated: new Date().toISOString().split('T')[0] // 오늘 날짜
  };
}

/**
 * 특정 날짜/시간에 예약이 가능한지 확인합니다
 */
export async function canMakeReservation(reservationDateTime: Date): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const now = new Date();
  const bookingPolicy = await getBookingPolicy();

  // 최소 사전 예약 시간 확인
  const minBookingTime = new Date(now.getTime() + (bookingPolicy.minAdvanceHours * 60 * 60 * 1000));
  if (reservationDateTime <= minBookingTime) {
    return {
      allowed: false,
      reason: `최소 ${bookingPolicy.minAdvanceHours}시간 전까지 예약해야 합니다.`
    };
  }

  // 최대 사전 예약 일수 확인
  const maxBookingTime = new Date(now.getTime() + (bookingPolicy.maxAdvanceDays * 24 * 60 * 60 * 1000));
  if (reservationDateTime > maxBookingTime) {
    return {
      allowed: false,
      reason: `최대 ${bookingPolicy.maxAdvanceDays}일 전까지만 예약 가능합니다.`
    };
  }

  return { allowed: true };
}

/**
 * 특정 예약에 대해 취소가 가능한지 확인합니다
 */
export async function canCancelReservation(reservationDateTime: Date): Promise<{
  allowed: boolean;
  reason?: string;
  penaltyApplied?: boolean;
}> {
  const now = new Date();
  const cancellationPolicy = await getCancellationPolicy();

  if (!cancellationPolicy.allowCancellation) {
    return {
      allowed: false,
      reason: '취소가 허용되지 않습니다.'
    };
  }

  // 취소 마감 시간 확인
  const cancellationDeadline = new Date(
    reservationDateTime.getTime() - (cancellationPolicy.deadlineHours * 60 * 60 * 1000)
  );

  if (now > cancellationDeadline) {
    return {
      allowed: false,
      reason: `예약 ${cancellationPolicy.deadlineHours}시간 전까지만 취소 가능합니다.`
    };
  }

  // 당일 취소인지 확인 (수수료 적용 여부)
  const dayBeforeReservation = new Date(reservationDateTime.getTime() - (24 * 60 * 60 * 1000));
  const penaltyApplied = now > dayBeforeReservation;

  return {
    allowed: true,
    penaltyApplied,
    reason: penaltyApplied ? '당일 취소로 수수료가 부과됩니다.' : undefined
  };
}

/**
 * 취소 수수료를 계산합니다
 */
export function calculateCancellationFee(
  originalAmount: number,
  reservationDateTime: Date
): {
  feeAmount: number;
  refundAmount: number;
  feeRate: number;
} {
  const now = new Date();
  const hoursUntilReservation = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let feeRate = 0;

  // 취소 시점에 따른 수수료율 계산
  if (hoursUntilReservation < 2) {
    feeRate = 1.0; // 100% (환불 불가)
  } else if (hoursUntilReservation < 24) {
    feeRate = 0.3; // 30%
  } else if (hoursUntilReservation < 48) {
    feeRate = 0.1; // 10%
  } else {
    feeRate = 0; // 수수료 없음
  }

  const feeAmount = Math.round(originalAmount * feeRate);
  const refundAmount = originalAmount - feeAmount;

  return {
    feeAmount,
    refundAmount,
    feeRate
  };
}

/**
 * FAQ에서 사용할 정책 정보를 포맷팅해서 반환합니다
 */
export async function getPolicyForFAQ(): Promise<{
  cancellation: string;
  refund: string;
  booking: string;
  terms: string;
}> {
  const [cancellation, refund, booking, terms] = await Promise.all([
    getCancellationPolicy(),
    getRefundPolicy(),
    getBookingPolicy(),
    getTermsPolicy()
  ]);

  return {
    cancellation: cancellation.description,
    refund: refund.description,
    booking: booking.description,
    terms: `이용약관: ${terms.termsOfServiceUrl}, 개인정보처리방침: ${terms.privacyPolicyUrl}`
  };
}

/**
 * 예약 확인 이메일에 포함할 정책 정보를 반환합니다
 */
export async function getPolicyForEmail(): Promise<{
  cancellationNotice: string;
  importantNotices: string[];
}> {
  const cancellation = await getCancellationPolicy();
  const booking = await getBookingPolicy();

  return {
    cancellationNotice: cancellation.description,
    importantNotices: [
      `예약은 최소 ${booking.minAdvanceHours}시간 전까지 가능합니다`,
      '예약 변경은 취소 후 재예약으로 처리됩니다',
      '당일 취소 시 수수료가 부과될 수 있습니다'
    ]
  };
}

/**
 * 관리자 설정 페이지에서 사용할 정책 정보를 반환합니다
 */
export async function getPolicyForAdmin(): Promise<{
  cancellation: CancellationPolicy;
  refund: RefundPolicy;
  booking: BookingPolicy;
  terms: TermsPolicy;
  editable: string[];
  environmentBased: string[];
}> {
  const [cancellation, refund, booking, terms] = await Promise.all([
    getCancellationPolicy(),
    getRefundPolicy(),
    getBookingPolicy(),
    getTermsPolicy()
  ]);
  return {
    cancellation,
    refund,
    booking,
    terms,
    editable: [
      'allowCancellation',
      'deadlineHours',
      'penaltyPolicy'
    ],
    environmentBased: [
      'cancellationPolicy',
      'refundPolicy',
      'maxAdvanceBookingDays',
      'minAdvanceBookingHours'
    ]
  };
}

/**
 * 정책 설정 유효성을 검증합니다
 */
export async function validatePolicies(): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const policies = await getStorePolicies();

  // 예약 정책 검증
  if (policies.maxAdvanceBookingDays < 1) {
    errors.push('최대 사전 예약일은 1일 이상이어야 합니다');
  }

  if (policies.minAdvanceBookingHours < 1) {
    errors.push('최소 사전 예약시간은 1시간 이상이어야 합니다');
  }

  if (policies.maxAdvanceBookingDays * 24 < policies.minAdvanceBookingHours) {
    errors.push('최대 사전 예약일과 최소 사전 예약시간 설정에 모순이 있습니다');
  }

  // URL 형식 검증
  const urlPattern = /^\/[a-zA-Z0-9\-_\/]*$/;
  if (!urlPattern.test(policies.termsOfServiceUrl)) {
    errors.push('이용약관 URL 형식이 올바르지 않습니다');
  }

  if (!urlPattern.test(policies.privacyPolicyUrl)) {
    errors.push('개인정보처리방침 URL 형식이 올바르지 않습니다');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 개발 모드에서 정책 설정을 콘솔에 출력 (디버깅용)
 */
export async function debugPolicies(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 Policies Configuration:');
    console.log('Cancellation:', await getCancellationPolicy());
    console.log('Refund:', await getRefundPolicy());
    console.log('Booking:', await getBookingPolicy());
    console.log('Terms:', await getTermsPolicy());

    const validation = await validatePolicies();
    if (!validation.isValid) {
      console.warn('⚠️ Policy Validation Errors:', validation.errors);
    }
  }
}