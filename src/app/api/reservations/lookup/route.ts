import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // 비회원 예약 조회 (user_id가 null이고 입력된 연락처와 일치)
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id,
        reservation_date,
        time_slot,
        guest_count,
        extra_guest_count,
        total_amount,
        status,
        payment_status,
        non_member_name,
        non_member_phone,
        created_at,
        sites!inner (
          id,
          name,
          facilities!inner (
            id,
            name
          )
        )
      `)
      .eq('id', reservation_id)
      .is('user_id', null)
      .eq('non_member_phone', phone_number)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: '예약 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 같은 예약의 다른 시간대 조회
    const { data: allTimeSlots } = await supabase
      .from('reservations')
      .select('time_slot')
      .eq('site_id', reservation.sites.id)
      .eq('reservation_date', reservation.reservation_date)
      .eq('non_member_phone', phone_number)
      .order('time_slot', { ascending: true });

    // 부가서비스 조회
    const { data: addOns } = await supabase
      .from('reservation_add-ons')
      .select(`
        quantity,
        unit_price,
        total_price,
        add_on_name
      `)
      .eq('reservation_id', reservation.id);

    const responseData = {
      id: reservation.id,
      status: reservation.status,
      payment_status: reservation.payment_status,
      reservation_date: reservation.reservation_date,
      time_slots: allTimeSlots?.map(slot => slot.time_slot) || [reservation.time_slot],
      guest_count: reservation.guest_count,
      extra_guest_count: reservation.extra_guest_count,
      total_amount: reservation.total_amount,
      guest_name: reservation.non_member_name,
      guest_phone: reservation.non_member_phone,
      site: {
        name: reservation.sites.name,
        site_type_name: reservation.sites.facilities.name
      },
      add_ons: addOns || [],
      created_at: reservation.created_at
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