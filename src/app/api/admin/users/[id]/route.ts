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

  return { user, role: profile.role };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 회원 상세 조회
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

    // 회원 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        birth_date,
        role,
        provider,
        marketing_agreed,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 예약 이력 조회
    const { data: reservations } = await supabase
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
          name,
          facilities!inner (name)
        )
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    // 예약 통계
    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { count: completedReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('status', 'completed');

    const { data: totalSpent } = await supabase
      .from('reservations')
      .select('total_amount')
      .eq('user_id', id)
      .eq('status', 'completed');

    const totalAmount = totalSpent?.reduce((sum, reservation) => sum + (reservation.total_amount || 0), 0) || 0;

    const responseData = {
      user_info: user,
      reservation_history: reservations?.map(reservation => ({
        id: reservation.id,
        reservation_date: reservation.reservation_date,
        time_slot: reservation.time_slot,
        guest_count: reservation.guest_count,
        total_amount: reservation.total_amount,
        status: reservation.status,
        payment_status: reservation.payment_status,
        facility_name: reservation.sites.facilities.name,
        site_name: reservation.sites.name,
        created_at: reservation.created_at
      })) || [],
      statistics: {
        total_reservations: totalReservations || 0,
        completed_reservations: completedReservations || 0,
        total_spent: totalAmount,
        cancellation_rate: totalReservations ? 
          Math.round(((totalReservations - completedReservations) / totalReservations) * 100) : 0
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Admin user detail API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 회원 정보 수정
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

    // 기존 회원 확인
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (ADMIN만 다른 관리자의 role 변경 가능)
    if (updateData.role && admin.role !== 'ADMIN' && existingUser.role !== 'USER') {
      return NextResponse.json(
        { error: '관리자 권한 변경은 최고 관리자만 가능합니다.' },
        { status: 403 }
      );
    }

    const allowedFields = ['role', 'name', 'phone'];
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

    // 회원 정보 수정
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(filteredData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: '회원 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '회원 정보가 성공적으로 수정되었습니다.',
      user: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error('Admin user update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}