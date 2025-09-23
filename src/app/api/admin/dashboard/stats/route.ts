import { NextRequest } from 'next/server';
import { supabaseAdmin, type Database } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';

async function getDashboardStatsHandler(request: NextRequest) {
  // 현재 월의 시작과 끝
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 이번 달 예약 통계
  const { data: monthlyReservations, error: reservationError } = await supabaseAdmin
    .from('reservations')
    .select('total_amount, status')
    .gte('created_at', currentMonthStart.toISOString())
    .lte('created_at', currentMonthEnd.toISOString())
    .neq('status', 'CANCELLED');

  if (reservationError) {
    console.error('Monthly reservations fetch error:', reservationError);
    throw ApiErrors.InternalServerError(
      '월간 예약 통계를 가져올 수 없습니다.',
      'MONTHLY_STATS_ERROR'
    );
  }

  // 전체 사이트 수 (가동률 계산용)
  const { data: totalSites, error: sitesError } = await supabaseAdmin
    .from('sites')
    .select('id')
    .eq('is_active', true);

  if (sitesError) {
    console.error('Sites count fetch error:', sitesError);
    throw ApiErrors.InternalServerError(
      '시설 정보를 가져올 수 없습니다.',
      'SITES_COUNT_ERROR'
    );
  }

  // 오늘 예약된 사이트 수 (가동률 계산)
  const today = new Date().toISOString().split('T')[0];
  const { data: todayReservations, error: todayError } = await supabaseAdmin
    .from('reservations')
    .select('site_id')
    .eq('reservation_date', today)
    .neq('status', 'CANCELLED');

  if (todayError) {
    console.error('Today reservations fetch error:', todayError);
    throw ApiErrors.InternalServerError(
      '오늘 예약 현황을 가져올 수 없습니다.',
      'TODAY_STATS_ERROR'
    );
  }

  // 통계 계산
  const monthlyRevenue = monthlyReservations?.reduce((sum, res) => sum + (res.total_amount || 0), 0) || 0;
  const monthlyReservationCount = monthlyReservations?.length || 0;
  const confirmedReservations = monthlyReservations?.filter(res => res.status === 'CONFIRMED').length || 0;

  // 가동률 계산: 오늘 예약된 고유 사이트 수 / 전체 사이트 수
  const uniqueReservedSites = new Set(todayReservations?.map(res => res.site_id)).size;
  const occupancyRate = totalSites.length > 0 ? (uniqueReservedSites / totalSites.length) * 100 : 0;

  // 전환율 계산 (간단한 예시: 확정 예약 / 전체 예약)
  const conversionRate = monthlyReservationCount > 0 ? (confirmedReservations / monthlyReservationCount) * 100 : 0;

  return createSuccessResponse({
    monthlyRevenue,
    monthlyReservations: monthlyReservationCount,
    occupancyRate: Math.round(occupancyRate * 10) / 10, // 소수점 1자리
    conversionRate: Math.round(conversionRate * 10) / 10,
    additionalStats: {
      confirmedReservations,
      pendingReservations: monthlyReservations?.filter(res => res.status === 'PENDING').length || 0,
      totalSites: totalSites.length,
      reservedSitesToday: uniqueReservedSites
    }
  }, '대시보드 통계 조회가 완료되었습니다.');
}

export const GET = withErrorHandling(getDashboardStatsHandler);