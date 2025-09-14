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

// 새 게시글 생성
export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const { type, title, content, is_important } = await request.json();

    if (!type || !title || !content) {
      return NextResponse.json(
        { error: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!['NOTICE', 'QNA'].includes(type)) {
      return NextResponse.json(
        { error: 'type은 NOTICE 또는 QNA이어야 합니다.' },
        { status: 400 }
      );
    }

    const tableName = type === 'NOTICE' ? 'announcements' : 'faqs';
    
    const postData = {
      title,
      content,
      is_important: is_important || false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newPost, error: insertError } = await supabase
      .from(tableName)
      .insert([postData])
      .select()
      .single();

    if (insertError) {
      console.error('Post creation error:', insertError);
      return NextResponse.json(
        { error: '게시글 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '게시글이 성공적으로 생성되었습니다.',
      post: newPost
    }, { status: 201 });

  } catch (error) {
    console.error('Admin post creation API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}