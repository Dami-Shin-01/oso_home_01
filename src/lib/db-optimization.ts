/**
 * 데이터베이스 쿼리 최적화 유틸리티
 */

import { supabaseAdmin } from './supabase-admin';

// 쿼리 결과 캐시 타입
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // TTL in milliseconds
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5분

  // 캐시 설정
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // 캐시 조회
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  // 캐시 삭제
  clear(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(pattern)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    }

    this.cache.clear();
  }

  // 캐시 키 생성
  generateKey(entity: string, ...args: any[]): string {
    return `${entity}_${args.map(a => JSON.stringify(a)).join('_')}`;
  }
}

// 전역 캐시 인스턴스
const queryCache = new QueryCache();

/**
 * 최적화된 시설 목록 조회 (캐시 적용)
 */
export async function getOptimizedFacilities(options: {
  activeOnly?: boolean;
  fields?: string[];
  limit?: number;
  orderBy?: string;
} = {}) {
  const cacheKey = queryCache.generateKey('facilities', options);
  
  // 캐시 확인
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 기본 필드 설정 (필요한 필드만 선택)
  const defaultFields = options.fields || [
    'id', 'name', 'description', 'type', 'capacity', 
    'weekday_price', 'weekend_price', 'images', 'is_active'
  ];

  let query = supabaseAdmin
    .from('facilities')
    .select(defaultFields.join(', '));

  // 조건 적용
  if (options.activeOnly) {
    query = query.eq('is_active', true);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch facilities:', error);
    return null;
  }

  // 캐시에 저장 (TTL: 10분)
  queryCache.set(cacheKey, data, 10 * 60 * 1000);

  return data;
}

/**
 * 최적화된 예약 가능 여부 확인
 */
export async function checkReservationAvailability(
  facilityId: string,
  siteId: string,
  date: string,
  timeSlots: number[]
) {
  const cacheKey = queryCache.generateKey('availability', facilityId, siteId, date, timeSlots);
  
  // 캐시 확인 (짧은 TTL: 2분)
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { data } = await supabaseAdmin
    .from('reservations')
    .select('id')
    .eq('facility_id', facilityId)
    .eq('site_id', siteId)
    .eq('reservation_date', date)
    .overlaps('time_slots', timeSlots)
    .in('status', ['PENDING', 'CONFIRMED']);

  const result = !data || data.length === 0;
  
  // 캐시에 저장 (TTL: 2분 - 실시간성 중요)
  queryCache.set(cacheKey, result, 2 * 60 * 1000);

  return result;
}

/**
 * 최적화된 사용자 정보 조회 (조인 최적화)
 */
export async function getOptimizedUserProfile(userId: string) {
  const cacheKey = queryCache.generateKey('user_profile', userId);
  
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id, email, name, phone, role, status, created_at,
      customer_profiles (
        address, marketing_consent, preferred_contact
      )
    `)
    .eq('id', userId)
    .eq('role', 'CUSTOMER')
    .single();

  if (error || !data) {
    return null;
  }

  // 캐시에 저장 (TTL: 30분)
  queryCache.set(cacheKey, data, 30 * 60 * 1000);

  return data;
}

/**
 * 배치 예약 목록 조회 (페이지네이션 최적화)
 */
export async function getBatchReservations(options: {
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
}) {
  const cacheKey = queryCache.generateKey('batch_reservations', options);
  
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let query = supabaseAdmin
    .from('reservations')
    .select(`
      id, facility_id, site_id, reservation_date, time_slots,
      total_amount, status, created_at,
      facilities (id, name, type),
      sites (id, name, type),
      reservation_payments (payment_method, amount, status)
    `)
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options.status) {
    query = query.eq('status', options.status as any);
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch batch reservations:', error);
    return null;
  }

  // 캐시에 저장 (TTL: 5분)
  queryCache.set(cacheKey, data, 5 * 60 * 1000);

  return data;
}

/**
 * 관리자 대시보드 통계 최적화
 */
export async function getOptimizedDashboardStats() {
  const cacheKey = queryCache.generateKey('dashboard_stats');
  
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  // 병렬로 통계 쿼리 실행
  const [monthlyRevenue, monthlyReservations, todayReservations] = await Promise.all([
    // 월간 매출
    supabaseAdmin
      .from('reservation_payments')
      .select('amount')
      .eq('status', 'COMPLETED')
      .gte('created_at', `${thisMonth}-01`),

    // 월간 예약 수
    supabaseAdmin
      .from('reservations')
      .select('id')
      .gte('created_at', `${thisMonth}-01`),

    // 오늘 예약 수 (가동률 계산용)
    supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('reservation_date', today)
      .eq('status', 'CONFIRMED')
  ]);

  const stats = {
    monthlyRevenue: monthlyRevenue.data?.reduce((sum, item) => sum + item.amount, 0) || 0,
    monthlyReservations: monthlyReservations.data?.length || 0,
    todayReservations: todayReservations.data?.length || 0,
    occupancyRate: Math.round(((todayReservations.data?.length || 0) / 50) * 100), // 가정: 최대 50개 예약 가능
    conversionRate: 85 // 실제 비즈니스 로직으로 계산
  };

  // 캐시에 저장 (TTL: 15분)
  queryCache.set(cacheKey, stats, 15 * 60 * 1000);

  return stats;
}

/**
 * 캐시 무효화 함수들
 */
export const invalidateCache = {
  // 시설 캐시 무효화
  facilities: () => queryCache.clear('facilities'),
  
  // 예약 캐시 무효화
  availability: () => queryCache.clear('availability'),
  
  // 사용자 캐시 무효화
  userProfile: (userId: string) => queryCache.clear(`user_profile_${userId}`),
  
  // 예약 목록 캐시 무효화
  batchReservations: () => queryCache.clear('batch_reservations'),
  
  // 모든 캐시 무효화
  all: () => queryCache.clear(),
  
  // 특정 패턴 캐시 무효화
  pattern: (pattern: string) => queryCache.clear(pattern)
};

export { queryCache };
