import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReservationRow } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reservation_id = searchParams.get('reservation_id');
    const phone_number = searchParams.get('phone_number');

    if (!reservation_id || !phone_number) {
      return NextResponse.json(
        { error: '예약번호와 연락처를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 예약 조회 (실제 reservations 테이블 구조에 맞게)
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservation_id)
      .eq('phone', phone_number)
      .single() as { data: ReservationRow | null; error: Error | null };

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: '예약 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 응답 데이터 구성
    const responseData = {
      id: reservation.id,
      status: reservation.status,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      guest_count: reservation.guest_count,
      name: reservation.name,
      phone: reservation.phone,
      email: reservation.email,
      service_type: reservation.service_type,
      sku_code: reservation.sku_code,
      special_requests: reservation.special_requests,
      admin_notes: reservation.admin_notes,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Reservation lookup API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}