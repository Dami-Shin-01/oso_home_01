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
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        provider,
        created_at,
        updated_at
      `, { count: 'exact' });

    // 검색 조건 적용
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error: usersError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (usersError) {
      console.error('Admin users fetch error:', usersError);
      return NextResponse.json(
        { error: '회원 목록을 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 각 사용자의 예약 통계 조회
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { count: reservationCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { data: lastReservation } = await supabase
          .from('reservations')
          .select('reservation_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...user,
          reservation_count: reservationCount || 0,
          last_reservation_date: lastReservation?.reservation_date || null
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    const responseData = {
      users: usersWithStats,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: count || 0,
        per_page: limit
      },
      filters: {
        search,
        role
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}