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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    // 예약 데이터에서 고유한 사용자 정보 추출
    let query = supabase
      .from('reservations')
      .select('email, name, phone, created_at', { count: 'exact' });

    // 검색 조건 적용
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: reservations, error: reservationsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reservationsError) {
      console.error('Admin users fetch error:', reservationsError);
      return NextResponse.json(
        { error: '사용자 목록을 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 이메일별로 중복 제거
    const uniqueUsers = (reservations || []).reduce((acc: any[], current) => {
      const existing = acc.find(user => user.email === current.email);
      if (!existing) {
        acc.push({
          id: current.email, // 이메일을 ID로 사용
          email: current.email,
          name: current.name,
          phone: current.phone,
          created_at: current.created_at,
          role: 'USER' // 기본값
        });
      }
      return acc;
    }, []);

    const totalPages = Math.ceil((count || 0) / limit);

    const responseData = {
      users: uniqueUsers,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: uniqueUsers.length,
        per_page: limit
      },
      filters: {
        search
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