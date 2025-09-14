import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      site_id,
      reservation_date,
      time_slots,
      guest_count,
      extra_guest_count,
      add_ons,
      non_member_name,
      non_member_phone
    } = await request.json();

    // 필수 필드 검증
    if (!site_id || !reservation_date || !time_slots || !guest_count) {
      return NextResponse.json(
        { error: '필수 정보를 모두 입력해주세요.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // 비회원인 경우 연락처 정보 필수
    if (!user && (!non_member_name || !non_member_phone)) {
      return NextResponse.json(
        { error: '비회원 예약 시 이름과 연락처를 입력해주세요.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // 예약 날짜 유효성 검사
    const reservationDate = new Date(reservation_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reservationDate < today) {
      return NextResponse.json(
        { error: '과거 날짜로는 예약할 수 없습니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // 사이트 존재 여부 및 활성 상태 확인
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name, capacity, facility_id')
      .eq('id', site_id)
      .eq('is_active', true)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: '존재하지 않거나 이용할 수 없는 사이트입니다.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // 인원 수 검증
    const totalGuests = guest_count + (extra_guest_count || 0);
    if (totalGuests > site.capacity) {
      return NextResponse.json(
        { error: `최대 수용 인원(${site.capacity}명)을 초과했습니다.`, code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // 시간대별 중복 예약 확인
    for (const timeSlot of time_slots) {
      const { data: existingReservation } = await supabase
        .from('reservations')
        .select('id')
        .eq('site_id', site_id)
        .eq('reservation_date', reservation_date)
        .eq('time_slot', timeSlot)
        .in('status', ['confirmed', 'pending'])
        .single();

      if (existingReservation) {
        return NextResponse.json(
          { error: `${timeSlot}부 시간대가 이미 예약되었습니다.`, code: 'RESERVATION_CONFLICT' },
          { status: 409 }
        );
      }
    }

    // 시설 가격 정보 조회
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('weekday_price, weekend_price')
      .eq('id', site.facility_id)
      .single();

    if (facilityError) {
      return NextResponse.json(
        { error: '가격 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    // 가격 계산
    const isWeekend = reservationDate.getDay() === 0 || reservationDate.getDay() === 6;
    const basePrice = isWeekend ? facility.weekend_price : facility.weekday_price;
    const totalBasePrice = basePrice * time_slots.length;
    
    // 추가 인원비 (기본 인원 초과시)
    const extraGuestPrice = (extra_guest_count || 0) * 10000; // 1인당 1만원 추가
    
    // 부가서비스 가격 계산
    let addOnsTotalPrice = 0;
    if (add_ons && add_ons.length > 0) {
      // 실제로는 add-ons 테이블에서 가격을 조회해야 하지만, 
      // 현재는 간단히 1개당 5천원으로 계산
      addOnsTotalPrice = add_ons.reduce((total: number, addon: any) => {
        return total + (addon.quantity * 5000);
      }, 0);
    }

    const totalAmount = totalBasePrice + extraGuestPrice + addOnsTotalPrice;

    // 예약 생성
    const reservationData = {
      site_id,
      user_id: user?.id || null,
      reservation_date,
      time_slot: time_slots[0], // 첫 번째 시간대를 메인으로 저장
      guest_count,
      extra_guest_count: extra_guest_count || 0,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending',
      non_member_name: user ? null : non_member_name,
      non_member_phone: user ? null : non_member_phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select()
      .single();

    if (reservationError) {
      console.error('Reservation creation error:', reservationError);
      return NextResponse.json(
        { error: '예약 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 부가서비스 예약 생성 (있는 경우)
    if (add_ons && add_ons.length > 0) {
      const addOnReservations = add_ons.map((addon: any) => ({
        reservation_id: reservation.id,
        add_on_id: addon.id,
        quantity: addon.quantity,
        unit_price: 5000, // 실제로는 DB에서 조회
        total_price: addon.quantity * 5000,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('reservation_add-ons')
        .insert(addOnReservations);
    }

    // 추가 시간대 예약 생성 (첫 번째 시간대 이후)
    if (time_slots.length > 1) {
      const additionalSlots = time_slots.slice(1).map((slot: number) => ({
        ...reservationData,
        time_slot: slot,
        id: undefined // 새로운 ID 생성을 위해 제거
      }));

      await supabase
        .from('reservations')
        .insert(additionalSlots);
    }

    return NextResponse.json({
      reservation_id: reservation.id,
      site_name: site.name,
      reservation_date,
      time_slots,
      guest_count,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending',
      message: '예약이 성공적으로 생성되었습니다.'
    }, { status: 201 });

  } catch (error) {
    console.error('Reservation API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}