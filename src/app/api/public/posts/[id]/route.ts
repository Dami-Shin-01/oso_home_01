import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    let post = null;
    let tableName = '';
    let postType = '';

    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (!announcementError && announcement) {
      post = announcement;
      tableName = 'announcements';
      postType = 'NOTICE';
    } else {
      const { data: faq, error: faqError } = await supabase
        .from('faqs')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (!faqError && faq) {
        post = faq;
        tableName = 'faqs';
        postType = 'QNA';
      }
    }

    if (!post) {
      return NextResponse.json(
        { error: '요청한 게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { data: previousPost } = await supabase
      .from(tableName)
      .select('id, title')
      .eq('is_active', true)
      .lt('created_at', post.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: nextPost } = await supabase
      .from(tableName)
      .select('id, title')
      .eq('is_active', true)
      .gt('created_at', post.created_at)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const responseData = {
      id: post.id,
      type: postType,
      title: post.title,
      content: post.content,
      author_name: '관리자',
      created_at: post.created_at,
      is_important: post.is_important || false,
      previous_post: previousPost ? {
        id: previousPost.id,
        title: previousPost.title
      } : null,
      next_post: nextPost ? {
        id: nextPost.id,
        title: nextPost.title
      } : null
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Post detail API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}