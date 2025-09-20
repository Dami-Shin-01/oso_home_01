import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import type { DashboardStats } from '@/types/database';

function normalizePeriod(value: string | null): 'week' | 'month' | 'quarter' | 'year' {
  const normalized = (value ?? '').toLowerCase();

  switch (normalized) {
    case 'week':
    case '7d':
      return 'week';
    case 'quarter':
    case '90d':
      return 'quarter';
    case 'year':
    case '1y':
      return 'year';
    case 'month':
    case '30d':
      return 'month';
    default:
      return 'month';
  }
}

async function getAnalyticsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = normalizePeriod(searchParams.get('period') ?? searchParams.get('range')); // week, month, quarter, year

  // 기간별 날짜 계산
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'week': {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'quarter': {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'year': {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    }
    case 'month':
    default: {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
  }

  // 예약 통계 조회
  const { data: reservations, error: reservationError } = await supabaseAdmin
    .from('reservations')
    .select(`
      id,
      total_amount,
      status,
      payment_status,
      created_at,
      reservation_date,
      facility_id,
      site_id,
      facilities (
        id,
        name,
        type
      ),
      sites (
        id,
        name
      )
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (reservationError) {
    console.error('Reservations fetch error:', reservationError);
    throw ApiErrors.InternalServerError(
      '예약 통계를 가져올 수 없습니다.',
      'ANALYTICS_ERROR'
    );
  }

  // 시설 정보 조회
  const { data: facilities, error: facilitiesError } = await supabaseAdmin
    .from('facilities')
    .select('id, name, type')
    .eq('is_active', true);

  if (facilitiesError) {
    console.error('Facilities fetch error:', facilitiesError);
    throw ApiErrors.InternalServerError(
      '시설 정보를 가져올 수 없습니다.',
      'FACILITIES_ERROR'
    );
  }

  // 사이트 정보 조회
  const { data: sites, error: sitesError } = await supabaseAdmin
    .from('sites')
    .select('id, name, facility_id')
    .eq('is_active', true);

  if (sitesError) {
    console.error('Sites fetch error:', sitesError);
    throw ApiErrors.InternalServerError(
      '사이트 정보를 가져올 수 없습니다.',
      'SITES_ERROR'
    );
  }

  // 통계 계산
  const totalReservations = reservations?.length || 0;
  const totalRevenue = reservations?.reduce((sum, res) => sum + (res.total_amount || 0), 0) || 0;
  const confirmedReservations = reservations?.filter(res => res.status === 'CONFIRMED').length || 0;
  const pendingReservations = reservations?.filter(res => res.status === 'PENDING').length || 0;
  const cancelledReservations = reservations?.filter(res => res.status === 'CANCELLED').length || 0;

  // 오늘 가동률 계산
  const today = new Date().toISOString().split('T')[0];
  const todayReservations = reservations?.filter(res =>
    res.reservation_date === today && res.status !== 'CANCELLED'
  ) || [];
  const uniqueReservedSites = new Set(todayReservations.map(res => res.site_id)).size;
  const occupancyRate = sites.length > 0 ? (uniqueReservedSites / sites.length) * 100 : 0;

  // 시설별 통계
  const facilityStats = facilities.map(facility => {
    const facilityReservations = reservations?.filter(res =>
      res.facility_id === facility.id && res.status !== 'CANCELLED'
    ) || [];

    const facilityRevenue = facilityReservations.reduce((sum, res) => sum + (res.total_amount || 0), 0);
    const facilitySites = sites.filter(site => site.facility_id === facility.id);

    return {
      facility_id: facility.id,
      facility_name: facility.name,
      facility_type: facility.type,
      total_reservations: facilityReservations.length,
      total_revenue: facilityRevenue,
      site_count: facilitySites.length
    };
  });

  // 최근 예약 목록 (상위 10개)
  const recentReservations = reservations
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    ?.slice(0, 10)
    ?.map(res => ({
      id: res.id,
      facility_name: res.facilities?.name || 'Unknown',
      site_name: res.sites?.name || 'Unknown',
      total_amount: res.total_amount,
      status: res.status,
      payment_status: res.payment_status,
      reservation_date: res.reservation_date,
      created_at: res.created_at
    })) || [];

  const analytics: DashboardStats = {
    total_reservations: totalReservations,
    total_facilities: facilities.length,
    total_revenue: totalRevenue,
    occupancy_rate: Math.round(occupancyRate * 10) / 10,
    recent_reservations: recentReservations as any[]
  };

  return createSuccessResponse({
    analytics,
    period_stats: {
      period,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      confirmed_reservations: confirmedReservations,
      pending_reservations: pendingReservations,
      cancelled_reservations: cancelledReservations,
      conversion_rate: totalReservations > 0 ? (confirmedReservations / totalReservations) * 100 : 0
    },
    facility_stats: facilityStats,
    site_stats: {
      total_sites: sites.length,
      reserved_sites_today: uniqueReservedSites,
      occupancy_rate: Math.round(occupancyRate * 10) / 10
    }
  }, '분석 데이터 조회가 완료되었습니다.');
}

export const GET = withErrorHandling(getAnalyticsHandler);