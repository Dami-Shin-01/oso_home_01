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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 예약 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 예약 상세 정보 조회
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
        created_at,
        updated_at,
        admin_memo,
        sites!inner (
          id,
          name,
          capacity,
          facilities!inner (
            id,
            name,
            description
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 같은 예약의 모든 시간대 조회
    const { data: allTimeSlots } = await supabase
      .from('reservations')
      .select('time_slot')
      .eq('site_id', reservation.sites.id)
      .eq('reservation_date', reservation.reservation_date)
      .eq('user_id', user.id)
      .order('time_slot', { ascending: true });

    // 부가서비스 조회
    const { data: addOns } = await supabase
      .from('reservation_add-ons')
      .select(`
        id,
        add_on_id,
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
      site: {
        id: reservation.sites.id,
        name: reservation.sites.name,
        capacity: reservation.sites.capacity,
        facility_name: reservation.sites.facilities.name,
        facility_description: reservation.sites.facilities.description
      },
      add_ons: addOns || [],
      admin_memo: reservation.admin_memo,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Reservation detail API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 예약 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const updateData = await request.json();

    // 기존 예약 확인
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, reservation_date, status, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingReservation) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 예약 날짜가 지났는지 확인
    const reservationDate = new Date(existingReservation.reservation_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      return NextResponse.json(
        { error: '지난 예약은 수정할 수 없습니다.', code: 'DATE_PASSED' },
        { status: 409 }
      );
    }

    // 확정된 예약인지 확인 (확정된 예약은 제한적 수정만 가능)
    if (existingReservation.status === 'confirmed' && 
        (updateData.site_id || updateData.reservation_date || updateData.time_slots)) {
      return NextResponse.json(
        { error: '확정된 예약의 날짜나 사이트는 변경할 수 없습니다.', code: 'RESERVATION_CONFIRMED' },
        { status: 409 }
      );
    }

    const allowedFields = ['guest_count', 'extra_guest_count'];
    const filteredData: Record<string, string | number> = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json(
        { error: '수정할 정보가 없습니다.' },
        { status: 400 }
      );
    }

    filteredData['updated_at'] = new Date().toISOString();

    // 예약 수정
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(filteredData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: '예약 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '예약이 성공적으로 수정되었습니다.',
      reservation: updatedReservation
    }, { status: 200 });

  } catch (error) {
    console.error('Reservation update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 예약 취소
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 기존 예약 확인
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, reservation_date, status, user_id, site_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingReservation) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 취소 가능 기간 확인 (예약일 1일 전까지만 취소 가능)
    const reservationDate = new Date(existingReservation.reservation_date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (reservationDate < tomorrow) {
      return NextResponse.json(
        { error: '예약일 1일 전까지만 취소 가능합니다.', code: 'CANCELLATION_PERIOD_EXPIRED' },
        { status: 409 }
      );
    }

    // 예약 상태를 cancelled로 변경 (실제 삭제하지 않음)
    const { error: cancelError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (cancelError) {
      return NextResponse.json(
        { error: '예약 취소에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 같은 날짜/사이트의 다른 시간대 예약도 취소
    await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('site_id', existingReservation.site_id)
      .eq('reservation_date', existingReservation.reservation_date)
      .eq('user_id', user.id)
      .neq('status', 'cancelled');

    return NextResponse.json({
      message: '예약이 성공적으로 취소되었습니다.'
    }, { status: 200 });

  } catch (error) {
    console.error('Reservation cancellation API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}