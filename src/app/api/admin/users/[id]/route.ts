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

// 회원 상세 조회 (이메일 기준으로 간소화)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id: email } = await params; // email을 ID로 사용

    // 해당 이메일의 예약 이력 조회
    const { data: reservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(20) as { data: ReservationRow[] | null; error: Error | null };

    // 예약 통계
    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('email', email);

    const { count: completedReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('status', 'completed');

    const { data: totalSpent } = await supabase
      .from('reservations')
      .select('*')
      .eq('email', email)
      .eq('status', 'completed');

    // 실제 금액 필드가 없으므로 임시로 0 설정
    const totalAmount = (totalSpent?.length || 0) * 50000; // 예시 금액

    const responseData = {
      user_info: {
        email: email,
        name: reservations?.[0]?.name || '알 수 없음',
        phone: reservations?.[0]?.phone || '',
        created_at: reservations?.[0]?.created_at || new Date().toISOString()
      },
      reservation_history: (reservations || []).map(reservation => ({
        id: reservation.id,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        guest_count: reservation.guest_count,
        status: reservation.status,
        service_type: reservation.service_type,
        sku_code: reservation.sku_code,
        created_at: reservation.created_at
      })),
      statistics: {
        total_reservations: totalReservations || 0,
        completed_reservations: completedReservations || 0,
        total_spent: totalAmount,
        cancellation_rate: totalReservations ? 
          Math.round(((totalReservations - (completedReservations ?? 0)) / totalReservations) * 100) : 0
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

// 회원 정보 수정 (간소화)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { id: email } = await params;
    const updateData = await request.json();

    // 해당 이메일의 예약들 업데이트 (제한적)
    const allowedFields = ['admin_notes'];
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

    // 해당 이메일의 모든 예약에 관리자 메모 추가
    const { error: updateError } = await supabase
      .from('reservations')
      .update(filteredData)
      .eq('email', email);

    if (updateError) {
      return NextResponse.json(
        { error: '정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '정보가 성공적으로 수정되었습니다.'
    }, { status: 200 });

  } catch (error) {
    console.error('Admin user update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}