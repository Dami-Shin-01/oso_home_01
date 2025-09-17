import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import type { NoticeRow } from '@/types/database';

async function getNoticesHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const important = searchParams.get('important') === 'true';

  if (page < 1 || limit < 1 || limit > 50) {
    throw ApiErrors.BadRequest('잘못된 페이지 또는 제한값입니다.');
  }

  const offset = (page - 1) * limit;

  // 쿼리 빌더 설정
  let query = supabase
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
    `)
    .eq('is_published', true);

  // 중요 공지사항 필터
  if (important) {
    query = query.eq('is_important', true);
  }

  // 정렬 및 페이지네이션
  const { data: notices, error: noticesError } = await query
    .order('is_important', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (noticesError) {
    console.error('Notices fetch error:', noticesError);
    throw ApiErrors.InternalServerError('공지사항을 가져올 수 없습니다.');
  }

  // 전체 개수 조회
  let countQuery = supabase
    .from('notices')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);

  if (important) {
    countQuery = countQuery.eq('is_important', true);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error('Notices count error:', countError);
    throw ApiErrors.InternalServerError('공지사항 수를 가져올 수 없습니다.');
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return createSuccessResponse({
    notices: notices?.map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      is_important: notice.is_important,
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

export const GET = withErrorHandling(getNoticesHandler);