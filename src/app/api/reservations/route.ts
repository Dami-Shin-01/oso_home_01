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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const {
      sku_code,
      reservation_date,
      reservation_time,
      guest_count,
      service_type,
      special_requests,
      name,
      phone,
      email
    } = await request.json();

    // 필수 필드 검증
    if (!reservation_date || !name || !phone) {
      return NextResponse.json(
        { error: '예약 날짜, 이름, 연락처는 필수입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // 비회원인 경우와 회원인 경우 처리
    const userEmail = user?.email || email;
    const userName = user?.user_metadata?.name || name;
    const userPhone = user?.user_metadata?.phone || phone;

    // 중복 예약 확인
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('id')
      .eq('reservation_date', reservation_date)
      .eq('phone', userPhone)
      .neq('status', 'cancelled')
      .single();

    if (existingReservation) {
      return NextResponse.json(
        { error: '같은 날짜에 이미 예약이 있습니다.', code: 'DUPLICATE_RESERVATION' },
        { status: 409 }
      );
    }

    // 예약 생성 데이터
    const reservationData = {
      name: userName,
      phone: userPhone,
      email: userEmail,
      reservation_date,
      reservation_time: reservation_time || '10:00',
      guest_count: guest_count || 1,
      service_type: service_type || 'BBQ',
      sku_code: sku_code || 'default',
      special_requests: special_requests || null,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // 예약 생성
    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select()
      .single() as { data: ReservationRow | null; error: Error | null };

    if (insertError) {
      console.error('Reservation insert error:', insertError);
      return NextResponse.json(
        { error: '예약 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const responseData = {
      id: reservation?.id,
      reservation_number: reservation?.reservation_number || reservation?.id,
      status: reservation?.status,
      reservation_date: reservation?.reservation_date,
      reservation_time: reservation?.reservation_time,
      guest_count: reservation?.guest_count,
      service_type: reservation?.service_type,
      message: '예약이 성공적으로 생성되었습니다.'
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Reservation creation API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}