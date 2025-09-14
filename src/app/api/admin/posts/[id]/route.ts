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

// 게시글 수정
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

    // 게시글을 어느 테이블에서 찾을지 확인
    let post = null;
    let tableName = '';

    // announcements 테이블에서 먼저 찾기
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (!announcementError && announcement) {
      post = announcement;
      tableName = 'announcements';
    } else {
      // faqs 테이블에서 찾기
      const { data: faq, error: faqError } = await supabase
        .from('faqs')
        .select('*')
        .eq('id', id)
        .single();

      if (!faqError && faq) {
        post = faq;
        tableName = 'faqs';
      }
    }

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const allowedFields = ['title', 'content', 'is_important', 'is_active'];
    const filteredData: Record<string, string | boolean> = {};
    
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

    // 게시글 수정
    const { data: updatedPost, error: updateError } = await supabase
      .from(tableName)
      .update(filteredData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: '게시글 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '게시글이 성공적으로 수정되었습니다.',
      post: updatedPost
    }, { status: 200 });

  } catch (error) {
    console.error('Admin post update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}