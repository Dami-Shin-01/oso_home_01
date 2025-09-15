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

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('reservations')
      .select('*', { count: 'exact' });

    // 검색 조건 적용
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (date) {
      query = query.eq('reservation_date', date);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reservations, error: reservationsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1) as { data: ReservationRow[] | null; error: Error | null; count: number | null };

    if (reservationsError) {
      console.error('Admin reservations fetch error:', reservationsError);
      return NextResponse.json(
        { error: '예약 목록을 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    const responseData = {
      reservations: (reservations || []).map(reservation => ({
        id: reservation.id,
        guest_name: reservation.name,
        guest_phone: reservation.phone,
        guest_email: reservation.email,
        service_type: reservation.service_type,
        sku_code: reservation.sku_code,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        guest_count: reservation.guest_count,
        status: reservation.status,
        admin_notes: reservation.admin_notes,
        special_requests: reservation.special_requests,
        created_at: reservation.created_at,
        updated_at: reservation.updated_at
      })),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: count || 0,
        per_page: limit
      },
      filters: {
        search,
        date,
        status
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Admin reservations API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}