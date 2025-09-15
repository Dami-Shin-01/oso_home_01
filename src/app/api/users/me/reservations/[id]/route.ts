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
      .select('*')
      .eq('id', id)
      .eq('email', user.email)
      .single() as { data: ReservationRow | null; error: Error | null };

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const responseData = {
      id: reservation.id,
      status: reservation.status,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      guest_count: reservation.guest_count,
      service_type: reservation.service_type,
      sku_code: reservation.sku_code,
      special_requests: reservation.special_requests,
      admin_notes: reservation.admin_notes,
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
      .select('id, reservation_date, status')
      .eq('id', id)
      .eq('email', user.email)
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

    const allowedFields = ['guest_count', 'special_requests'];
    const filteredData: Record<string, any> = {};
    
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
      .eq('email', user.email)
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
      .select('id, reservation_date, status')
      .eq('id', id)
      .eq('email', user.email)
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

    // 예약 상태를 cancelled로 변경
    const { error: cancelError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('email', user.email);

    if (cancelError) {
      return NextResponse.json(
        { error: '예약 취소에 실패했습니다.' },
        { status: 500 }
      );
    }

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