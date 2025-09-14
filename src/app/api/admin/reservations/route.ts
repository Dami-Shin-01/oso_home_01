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
      .select(`
        id,
        reservation_date,
        time_slot,
        guest_count,
        total_amount,
        status,
        payment_status,
        created_at,
        updated_at,
        admin_memo,
        users (id, name, email, phone),
        non_member_name,
        non_member_phone,
        sites!inner (
          id,
          name,
          facilities!inner (
            id,
            name
          )
        )
      `, { count: 'exact' });

    // 검색 조건 적용
    if (search) {
      query = query.or(`users.name.ilike.%${search}%,non_member_name.ilike.%${search}%,users.phone.ilike.%${search}%,non_member_phone.ilike.%${search}%`);
    }

    if (date) {
      query = query.eq('reservation_date', date);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reservations, error: reservationsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reservationsError) {
      console.error('Admin reservations fetch error:', reservationsError);
      return NextResponse.json(
        { error: '예약 목록을 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    const responseData = {
      reservations: reservations?.map(reservation => ({
        id: reservation.id,
        guest_name: reservation.users?.name || reservation.non_member_name,
        guest_phone: reservation.users?.phone || reservation.non_member_phone,
        guest_email: reservation.users?.email || null,
        facility_name: reservation.sites.facilities.name,
        site_name: reservation.sites.name,
        reservation_date: reservation.reservation_date,
        time_slot: reservation.time_slot,
        guest_count: reservation.guest_count,
        total_amount: reservation.total_amount,
        status: reservation.status,
        payment_status: reservation.payment_status,
        admin_memo: reservation.admin_memo,
        created_at: reservation.created_at,
        updated_at: reservation.updated_at,
        is_member: !!reservation.users
      })) || [],
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