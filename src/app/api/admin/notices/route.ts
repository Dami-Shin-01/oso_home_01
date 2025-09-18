import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { requireAdminAccess } from '@/lib/auth-helpers';
import type { Database } from '@/types/database';

type NoticeInsert = Database['public']['Tables']['notices']['Insert'];

// 관리자 공지사항 목록 조회 (발행여부 상관없이 모든 공지사항)
async function getAdminNoticesHandler(request: NextRequest) {
  const admin = await requireAdminAccess(request);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const published = searchParams.get('published');

  if (page < 1 || limit < 1 || limit > 50) {
    throw ApiErrors.BadRequest('잘못된 페이지 또는 제한값입니다.');
  }

  const offset = (page - 1) * limit;

  // 쿼리 빌더 설정
  let query = supabaseAdmin
    .from('notices')
    .select(`
      id,
      title,
      content,
      is_important,
      is_published,
      view_count,
      created_at,
      updated_at,
      users:author_id (
        id,
        name,
        email
      )
    `);

  // 발행 상태 필터
  if (published === 'true') {
    query = query.eq('is_published', true);
  } else if (published === 'false') {
    query = query.eq('is_published', false);
  }

  // 정렬 및 페이지네이션
  const { data: notices, error: noticesError } = await query
    .order('is_important', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (noticesError) {
    console.error('Admin notices fetch error:', noticesError);
    throw ApiErrors.InternalServerError('공지사항을 가져올 수 없습니다.');
  }

  // 전체 개수 조회
  let countQuery = supabaseAdmin
    .from('notices')
    .select('*', { count: 'exact', head: true });

  if (published === 'true') {
    countQuery = countQuery.eq('is_published', true);
  } else if (published === 'false') {
    countQuery = countQuery.eq('is_published', false);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error('Admin notices count error:', countError);
    throw ApiErrors.InternalServerError('공지사항 수를 가져올 수 없습니다.');
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return createSuccessResponse({
    notices: notices?.map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      is_important: notice.is_important,
      is_published: notice.is_published,
      view_count: notice.view_count,
      created_at: notice.created_at,
      updated_at: notice.updated_at,
      author: notice.users ? {
        id: notice.users.id,
        name: notice.users.name,
        email: notice.users.email
      } : null
    })) || [],
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: count || 0,
      limit: limit
    }
  });
}

// 관리자 공지사항 생성
async function createNoticeHandler(request: NextRequest) {
  const admin = await requireAdminAccess(request);

  const body = await request.json();
  const { title, content, is_important, is_published } = body;

  // 입력 검증
  if (!title?.trim() || !content?.trim()) {
    throw ApiErrors.BadRequest(
      '제목과 내용은 필수 입력 항목입니다.',
      'REQUIRED_FIELDS_MISSING'
    );
  }

  if (title.trim().length > 200) {
    throw ApiErrors.BadRequest(
      '제목은 200자 이하로 입력해주세요.',
      'TITLE_TOO_LONG'
    );
  }

  const noticeData: NoticeInsert = {
    title: title.trim(),
    content: content.trim(),
    is_important: Boolean(is_important),
    is_published: Boolean(is_published),
    author_id: admin.id,
    view_count: 0
  };

  const { data: notice, error } = await supabaseAdmin
    .from('notices')
    .insert(noticeData)
    .select(`
      id,
      title,
      content,
      is_important,
      is_published,
      view_count,
      created_at,
      updated_at,
      users:author_id (
        id,
        name,
        email
      )
    `)
    .single();

  if (error) {
    console.error('Notice creation error:', error);
    throw ApiErrors.InternalServerError(
      '공지사항 등록 중 오류가 발생했습니다.',
      'NOTICE_CREATION_ERROR'
    );
  }

  return createSuccessResponse({
    notice: {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      is_important: notice.is_important,
      is_published: notice.is_published,
      view_count: notice.view_count,
      created_at: notice.created_at,
      updated_at: notice.updated_at,
      author: notice.users ? {
        id: notice.users.id,
        name: notice.users.name,
        email: notice.users.email
      } : null
    }
  }, '공지사항이 성공적으로 등록되었습니다.');
}

export const GET = withErrorHandling(getAdminNoticesHandler);
export const POST = withErrorHandling(createNoticeHandler);