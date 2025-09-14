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
      .select(`
        id,
        reservation_date,
        time_slot,
        guest_count,
        extra_guest_count,
        total_amount,
        status,
        payment_status,
        admin_memo,
        created_at,
        updated_at,
        users (
          id,
          name,
          email,
          phone,
          created_at
        ),
        non_member_name,
        non_member_phone,
        sites!inner (
          id,
          name,
          capacity,
          facilities!inner (
            id,
            name,
            description,
            weekday_price,
            weekend_price
          )
        )
      `)
      .eq('id', id)
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
      .or(`user_id.eq.${reservation.users?.id},and(user_id.is.null,non_member_phone.eq.${reservation.non_member_phone})`)
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
      admin_memo: reservation.admin_memo,
      guest_info: {
        is_member: !!reservation.users,
        name: reservation.users?.name || reservation.non_member_name,
        email: reservation.users?.email || null,
        phone: reservation.users?.phone || reservation.non_member_phone,
        member_since: reservation.users?.created_at || null
      },
      site: {
        id: reservation.sites.id,
        name: reservation.sites.name,
        capacity: reservation.sites.capacity,
        facility: {
          id: reservation.sites.facilities.id,
          name: reservation.sites.facilities.name,
          description: reservation.sites.facilities.description,
          weekday_price: reservation.sites.facilities.weekday_price,
          weekend_price: reservation.sites.facilities.weekend_price
        }
      },
      add_ons: addOns || [],
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

    // 기존 예약 확인
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingReservation) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const allowedFields = ['status', 'payment_status', 'admin_memo'];
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

// 예약 강제 취소 (관리자)
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

    // 기존 예약 확인
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status, site_id, reservation_date, user_id, non_member_phone')
      .eq('id', id)
      .single();

    if (fetchError || !existingReservation) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 예약 상태를 cancelled로 변경
    const { error: cancelError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        admin_memo: `관리자에 의해 취소됨 (${new Date().toISOString()})`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (cancelError) {
      return NextResponse.json(
        { error: '예약 취소에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 같은 날짜/사이트의 관련 예약들도 취소
    const whereCondition = existingReservation.user_id 
      ? { user_id: existingReservation.user_id }
      : { user_id: null, non_member_phone: existingReservation.non_member_phone };

    await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        admin_memo: `관련 예약 일괄 취소 (${new Date().toISOString()})`,
        updated_at: new Date().toISOString()
      })
      .eq('site_id', existingReservation.site_id)
      .eq('reservation_date', existingReservation.reservation_date)
      .match(whereCondition)
      .neq('status', 'cancelled');

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