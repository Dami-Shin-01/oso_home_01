import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedAdmin(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['MANAGER', 'ADMIN'].includes(profile.role)) {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const thisMonthStr = thisMonth.toISOString().split('T')[0];
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    // 월간 매출 계산
    const { data: monthlyRevenue } = await supabase
      .rpc('get_monthly_revenue', {
        start_date: thisMonthStr,
        end_date: nextMonthStr
      });

    // 월간 예약 수
    const { count: monthlyReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .gte('reservation_date', thisMonthStr)
      .lt('reservation_date', nextMonthStr)
      .in('status', ['confirmed', 'pending']);

    // 이번 달 총 가능한 예약 슬롯 수 계산 (임시)
    const totalPossibleSlots = 30 * 10 * 3; // 30일 * 10개 사이트 * 3시간대
    const occupancyRate = monthlyReservations ? (monthlyReservations / totalPossibleSlots * 100) : 0;

    // 전환율 계산 (임시 - 실제로는 방문자 수 대비 예약 수)
    const conversionRate = Math.min(occupancyRate * 0.2, 100);

    // 최근 예약 목록
    const { data: recentReservations } = await supabase
      .from('reservations')
      .select(`
        id,
        reservation_date,
        total_amount,
        status,
        created_at,
        users (name),
        non_member_name,
        sites!inner (
          name,
          facilities!inner (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // 오늘의 업무 (대기 중인 예약, 취소 요청 등)
    const { count: pendingReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: cancellationRequests } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('created_at', today.toISOString().split('T')[0]);

    const dashboardData = {
      kpi: {
        monthly_revenue: monthlyRevenue?.[0]?.total_revenue || 0,
        monthly_reservations: monthlyReservations || 0,
        occupancy_rate: Math.round(occupancyRate * 10) / 10,
        conversion_rate: Math.round(conversionRate * 10) / 10
      },
      recent_reservations: recentReservations?.map(reservation => ({
        id: reservation.id,
        guest_name: reservation.users?.name || reservation.non_member_name,
        facility: `${reservation.sites.facilities.name} - ${reservation.sites.name}`,
        date: reservation.reservation_date,
        amount: reservation.total_amount,
        status: reservation.status,
        created_at: reservation.created_at
      })) || [],
      pending_tasks: [
        {
          id: 'pending_reservations',
          title: '신규 예약 승인 대기',
          count: pendingReservations || 0,
          urgent: (pendingReservations || 0) > 0
        },
        {
          id: 'cancellation_requests',
          title: '취소 요청 처리',
          count: cancellationRequests || 0,
          urgent: (cancellationRequests || 0) > 0
        },
        {
          id: 'facility_maintenance',
          title: '시설 점검 일정',
          count: 1,
          urgent: false
        },
        {
          id: 'content_updates',
          title: '공지사항 업데이트',
          count: 0,
          urgent: false
        }
      ]
    };

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}