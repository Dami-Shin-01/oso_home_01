import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReservationRow } from '@/types/database';

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

  // 관리자 권한 확인 (간소화)
  // 실제로는 admin_profiles 테이블 확인 필요
  return user;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 예약 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 예약 상세 정보 조회
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
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
      admin_notes: reservation.admin_notes,
      guest_info: {
        name: reservation.name,
        email: reservation.email,
        phone: reservation.phone
      },
      service_type: reservation.service_type,
      sku_code: reservation.sku_code,
      special_requests: reservation.special_requests,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Admin reservation detail API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 예약 수정 (관리자)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const updateData = await request.json();

    const allowedFields = ['status', 'admin_notes'];
    const filteredData: Record<string, string> = {};
    
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
    console.error('Admin reservation update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 예약 취소 (관리자)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 예약 상태를 cancelled로 변경
    const { error: cancelError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        admin_notes: `관리자에 의해 취소됨 (${new Date().toISOString()})`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

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
    console.error('Admin reservation cancellation API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}