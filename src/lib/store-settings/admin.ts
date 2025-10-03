/**
 * 서버 전용 매장 설정 관리 함수들
 * 이 파일의 모든 함수는 서버 사이드에서만 실행되어야 합니다.
 * createAdminClient()를 사용하여 관리자 권한으로 데이터베이스에 접근합니다.
 *
 * ⚠️ 경고: 이 파일을 클라이언트 컴포넌트에서 import하지 마세요!
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { StoreSetting } from './types';

// Re-export type for convenience
export type { StoreSetting } from './types';

/**
 * 모든 설정 조회 (관리자용)
 */
export async function getAllSettings(): Promise<StoreSetting[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .order('category', { ascending: true })
    .order('key', { ascending: true });

  if (error) {
    console.error('Failed to fetch all settings:', error);
    return [];
  }

  return data || [];
}

/**
 * 카테고리별 설정 조회 (관리자용)
 */
export async function getSettingsByCategory(
  category: 'store' | 'operation' | 'payment' | 'policy' | 'marketing' | 'social'
): Promise<StoreSetting[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('category', category)
    .order('key', { ascending: true });

  if (error) {
    console.error(`Failed to fetch ${category} settings:`, error);
    return [];
  }

  return data || [];
}

/**
 * 설정값 업데이트 (관리자용)
 */
export async function updateSetting(key: string, value: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('store_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);

  if (error) {
    console.error(`Failed to update setting ${key}:`, error);
    return false;
  }

  return true;
}

/**
 * 여러 설정값 일괄 업데이트 (관리자용)
 */
export async function updateSettings(settings: Array<{ key: string; value: string }>): Promise<boolean> {
  const supabase = createAdminClient();

  try {
    // 트랜잭션으로 일괄 업데이트
    const updates = settings.map(({ key, value }) =>
      supabase
        .from('store_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
    );

    const results = await Promise.all(updates);

    // 모든 업데이트가 성공했는지 확인
    const hasError = results.some(result => result.error);

    if (hasError) {
      console.error('Some settings failed to update');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update settings:', error);
    return false;
  }
}
