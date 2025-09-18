import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { requireAdminAccess } from '@/lib/auth-helpers';
import type { Database } from '@/types/database';

type FaqUpdate = Database['public']['Tables']['faqs']['Update'];

// 개별 FAQ 조회
async function getFaqHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);
  const { id } = await params;

  if (!id) {
    throw ApiErrors.BadRequest('FAQ ID가 필요합니다.');
  }

  const { data: faq, error } = await supabaseAdmin
    .from('faqs')
    .select(`
      id,
      question,
      answer,
      category,
      order_index,
      is_published,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single();

  if (error || !faq) {
    throw ApiErrors.NotFound('FAQ를 찾을 수 없습니다.');
  }

  return createSuccessResponse({ faq });
}

// FAQ 수정
async function updateFaqHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);
  const { id } = await params;

  if (!id) {
    throw ApiErrors.BadRequest('FAQ ID가 필요합니다.');
  }

  const body = await request.json();
  const { question, answer, category, order_index, is_published } = body;

  // 입력 검증
  if (!question?.trim() || !answer?.trim()) {
    throw ApiErrors.BadRequest(
      '질문과 답변은 필수 입력 항목입니다.',
      'REQUIRED_FIELDS_MISSING'
    );
  }

  if (question.trim().length > 500) {
    throw ApiErrors.BadRequest(
      '질문은 500자 이하로 입력해주세요.',
      'QUESTION_TOO_LONG'
    );
  }

  // FAQ 존재 확인
  const { data: existingFaq, error: fetchError } = await supabaseAdmin
    .from('faqs')
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError || !existingFaq) {
    throw ApiErrors.NotFound('수정할 FAQ를 찾을 수 없습니다.');
  }

  const updateData: FaqUpdate = {
    question: question.trim(),
    answer: answer.trim(),
    category: category?.trim() || 'general',
    order_index: parseInt(order_index) || 0,
    is_published: Boolean(is_published),
    updated_at: new Date().toISOString()
  };

  const { data: faq, error } = await supabaseAdmin
    .from('faqs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('FAQ update error:', error);
    throw ApiErrors.InternalServerError(
      'FAQ 수정 중 오류가 발생했습니다.',
      'FAQ_UPDATE_ERROR'
    );
  }

  return createSuccessResponse({ faq }, 'FAQ가 성공적으로 수정되었습니다.');
}

// FAQ 삭제
async function deleteFaqHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);
  const { id } = await params;

  if (!id) {
    throw ApiErrors.BadRequest('FAQ ID가 필요합니다.');
  }

  // FAQ 존재 확인
  const { data: existingFaq, error: fetchError } = await supabaseAdmin
    .from('faqs')
    .select('id, question')
    .eq('id', id)
    .single();

  if (fetchError || !existingFaq) {
    throw ApiErrors.NotFound('삭제할 FAQ를 찾을 수 없습니다.');
  }

  const { error } = await supabaseAdmin
    .from('faqs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('FAQ deletion error:', error);
    throw ApiErrors.InternalServerError(
      'FAQ 삭제 중 오류가 발생했습니다.',
      'FAQ_DELETION_ERROR'
    );
  }

  return createSuccessResponse({
    deleted_faq_id: id,
    deleted_faq_question: existingFaq.question
  }, 'FAQ가 성공적으로 삭제되었습니다.');
}

export const GET = withErrorHandling(getFaqHandler);
export const PUT = withErrorHandling(updateFaqHandler);
export const DELETE = withErrorHandling(deleteFaqHandler);