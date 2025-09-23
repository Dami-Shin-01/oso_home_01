import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { requireAdminAccess } from '@/lib/auth-helpers';
import type { Database } from '@/types/database';

type NoticeUpdate = Database['public']['Tables']['notices']['Update'];

// 개별 공지사항 조회
async function getNoticeHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);
  const { id } = await params;

  if (!id) {
    throw ApiErrors.BadRequest('공지사항 ID가 필요합니다.');
  }

  const { data: notice, error } = await supabaseAdmin
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
    .single();

  if (error || !notice) {
    throw ApiErrors.NotFound('공지사항을 찾을 수 없습니다.');
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
  });
}

// 공지사항 수정
async function updateNoticeHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);
  const { id } = await params;

  if (!id) {
    throw ApiErrors.BadRequest('공지사항 ID가 필요합니다.');
  }

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

  // 공지사항 존재 확인
  const { data: existingNotice, error: fetchError } = await supabaseAdmin
    .from('notices')
    .select('id, author_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingNotice) {
    throw ApiErrors.NotFound('수정할 공지사항을 찾을 수 없습니다.');
  }

  // 수정 권한 확인 (본인 또는 관리자만 수정 가능)
  if (existingNotice.author_id !== admin.id && admin.role !== 'ADMIN') {
    throw ApiErrors.Forbidden(
      '본인이 작성한 공지사항만 수정할 수 있습니다.',
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  const updateData: NoticeUpdate = {
    title: title.trim(),
    content: content.trim(),
    is_important: Boolean(is_important),
    is_published: Boolean(is_published),
    updated_at: new Date().toISOString()
  };

  const { data: notice, error } = await supabaseAdmin
    .from('notices')
    .update(updateData)
    .eq('id', id)
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
    console.error('Notice update error:', error);
    throw ApiErrors.InternalServerError(
      '공지사항 수정 중 오류가 발생했습니다.',
      'NOTICE_UPDATE_ERROR'
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
  }, '공지사항이 성공적으로 수정되었습니다.');
}

// 공지사항 삭제
async function deleteNoticeHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);
  const { id } = await params;

  if (!id) {
    throw ApiErrors.BadRequest('공지사항 ID가 필요합니다.');
  }

  // 공지사항 존재 확인
  const { data: existingNotice, error: fetchError } = await supabaseAdmin
    .from('notices')
    .select('id, author_id, title')
    .eq('id', id)
    .single();

  if (fetchError || !existingNotice) {
    throw ApiErrors.NotFound('삭제할 공지사항을 찾을 수 없습니다.');
  }

  // 삭제 권한 확인 (본인 또는 관리자만 삭제 가능)
  if (existingNotice.author_id !== admin.id && admin.role !== 'ADMIN') {
    throw ApiErrors.Forbidden(
      '본인이 작성한 공지사항만 삭제할 수 있습니다.',
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  const { error } = await supabaseAdmin
    .from('notices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Notice deletion error:', error);
    throw ApiErrors.InternalServerError(
      '공지사항 삭제 중 오류가 발생했습니다.',
      'NOTICE_DELETION_ERROR'
    );
  }

  return createSuccessResponse({
    deleted_notice_id: id,
    deleted_notice_title: existingNotice.title
  }, '공지사항이 성공적으로 삭제되었습니다.');
}

export const GET = withErrorHandling(getNoticeHandler);
export const PUT = withErrorHandling(updateNoticeHandler);
export const DELETE = withErrorHandling(deleteNoticeHandler);