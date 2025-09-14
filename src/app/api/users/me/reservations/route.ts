import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ReservationData {
  id: string;
  reservation_date: string;
  time_slot: number;
  guest_count: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  sites: {
    id: string;
    name: string;
    facilities: {
      name: string;
    };
  };
}

interface GroupedReservation {
  id: string;
  status: string;
  payment_status: string;
  site_name: string;
  site_type_name: string;
  reservation_date: string;
  time_slots: number[];
  guest_count: number;
  total_amount: number;
  created_at: string;
}

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

    // 예정된 예약 조회
    const { data: upcomingReservations, error: upcomingError } = await supabase
      .from('reservations')
      .select(`
        id,
        reservation_date,
        time_slot,
        guest_count,
        total_amount,
        status,
        payment_status,
        created_at,
        sites!inner (
          id,
          name,
          facilities!inner (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .gte('reservation_date', todayString)
      .order('reservation_date', { ascending: true })
      .order('time_slot', { ascending: true });

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
      .select(`
        id,
        reservation_date,
        time_slot,
        guest_count,
        total_amount,
        status,
        payment_status,
        created_at,
        sites!inner (
          id,
          name,
          facilities!inner (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .lt('reservation_date', todayString)
      .order('reservation_date', { ascending: false })
      .order('time_slot', { ascending: true })
      .limit(20); // 최근 20개만

    if (pastError) {
      console.error('Past reservations fetch error:', pastError);
      return NextResponse.json(
        { error: '예약 히스토리를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 예약별 시간대 그룹핑 (같은 날짜, 같은 사이트의 예약들을 합치기)
    const groupReservations = (reservations: ReservationData[]) => {
      const grouped: Record<string, GroupedReservation> = {};
      
      reservations.forEach(reservation => {
        const key = `${reservation.sites.id}-${reservation.reservation_date}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            id: reservation.id,
            status: reservation.status,
            payment_status: reservation.payment_status,
            site_name: reservation.sites.name,
            site_type_name: reservation.sites.facilities.name,
            reservation_date: reservation.reservation_date,
            time_slots: [reservation.time_slot],
            guest_count: reservation.guest_count,
            total_amount: reservation.total_amount,
            created_at: reservation.created_at
          };
        } else {
          // 시간대 추가 및 정렬
          grouped[key].time_slots.push(reservation.time_slot);
          grouped[key].time_slots.sort((a: number, b: number) => a - b);
        }
      });
      
      return Object.values(grouped);
    };

    const responseData = {
      upcoming_reservations: groupReservations(upcomingReservations || []),
      past_reservations: groupReservations(pastReservations || [])
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