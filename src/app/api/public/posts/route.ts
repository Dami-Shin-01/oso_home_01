import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;

    if (!type || !['NOTICE', 'QNA'].includes(type)) {
      return NextResponse.json(
        { error: 'type 파라미터는 NOTICE 또는 QNA 이어야 합니다.' },
        { status: 400 }
      );
    }

    const tableName = type === 'NOTICE' ? 'announcements' : 'faqs';
    
    const offset = (page - 1) * limit;

    const { data: posts, error: postsError } = await supabase
      .from(tableName)
      .select('id, title, created_at, is_important')
      .eq('is_active', true)
      .order('is_important', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error('Posts fetch error:', postsError);
      return NextResponse.json(
        { error: '게시글 목록을 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) {
      console.error('Posts count error:', countError);
      return NextResponse.json(
        { error: '게시글 수를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    const responseData = {
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        created_at: post.created_at,
        is_important: post.is_important || false
      })),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPosts: count || 0
      }
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Posts API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}