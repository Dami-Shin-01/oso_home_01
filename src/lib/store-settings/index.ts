/**
 * 매장 설정 모듈 - 배럴 파일
 *
 * 이 파일은 클라이언트 안전 함수만 re-export합니다.
 * 서버 전용 관리자 함수가 필요한 경우 '@/lib/store-settings/admin'에서 명시적으로 import하세요.
 *
 * 사용 예시:
 * - 클라이언트: import { getStoreBasicInfo } from '@/lib/store-settings';
 * - 서버: import { updateSetting } from '@/lib/store-settings/admin';
 */

// 클라이언트 안전 함수만 export (createClient 사용)
export * from './client';
