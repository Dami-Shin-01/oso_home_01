import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import type { NoticeRow } from '@/types/database';

async function getNoticeHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    throw ApiErrors.BadRequest('공지사항 ID가 필요합니다.');
  }

  // 공지사항 조회
  const { data: notice, error: noticeError } = await supabaseAdmin
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
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (noticeError || !notice) {
    throw ApiErrors.NotFound('공지사항을 찾을 수 없습니다.');
  }

  // 조회수 증가
  const { error: updateError } = await supabaseAdmin
    .from('notices')
    .update({ view_count: (notice.view_count || 0) + 1 })
    .eq('id', id);

  if (updateError) {
    console.warn('View count update failed:', updateError);
  }

  return createSuccessResponse({
    notice: {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      is_important: notice.is_important,
      view_count: (notice.view_count || 0) + 1,
      created_at: notice.created_at,
      updated_at: notice.updated_at,
      author: notice.users ? {
        id: notice.users.id,
        name: notice.users.name,
        email: notice.users.email
      } : null
    }
  });
}

export const GET = withErrorHandling(getNoticeHandler);