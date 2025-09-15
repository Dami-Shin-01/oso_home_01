import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReservationRow } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    // 예정된 예약 조회 (실제 테이블 구조에 맞게)
    // 현재 reservations 테이블에는 user_id가 없으므로 email로 조회
    const { data: upcomingReservations, error: upcomingError } = await supabase
      .from('reservations')
      .select('*')
      .eq('email', user.email)
      .gte('reservation_date', todayString)
      .order('reservation_date', { ascending: true }) as { data: ReservationRow[] | null; error: Error | null };

    if (upcomingError) {
      console.error('Upcoming reservations fetch error:', upcomingError);
      return NextResponse.json(
        { error: '예약 목록을 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 과거 예약 조회
    const { data: pastReservations, error: pastError } = await supabase
      .from('reservations')
      .select('*')
      .eq('email', user.email)
      .lt('reservation_date', todayString)
      .order('reservation_date', { ascending: false })
      .limit(20) as { data: ReservationRow[] | null; error: Error | null };

    if (pastError) {
      console.error('Past reservations fetch error:', pastError);
      return NextResponse.json(
        { error: '예약 히스토리를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 응답 데이터 구성
    const responseData = {
      upcoming: (upcomingReservations || []).map(reservation => ({
        id: reservation.id,
        status: reservation.status,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        guest_count: reservation.guest_count,
        service_type: reservation.service_type,
        sku_code: reservation.sku_code,
        special_requests: reservation.special_requests,
        created_at: reservation.created_at
      })),
      past: (pastReservations || []).map(reservation => ({
        id: reservation.id,
        status: reservation.status,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        guest_count: reservation.guest_count,
        service_type: reservation.service_type,
        sku_code: reservation.sku_code,
        created_at: reservation.created_at
      }))
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('User reservations API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}