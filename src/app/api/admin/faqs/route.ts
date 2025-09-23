import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { requireAdminAccess } from '@/lib/auth-helpers';
import type { Database } from '@/types/database';

type FaqInsert = Database['public']['Tables']['faqs']['Insert'];

// 관리자 FAQ 목록 조회 (발행여부 상관없이 모든 FAQ)
async function getAdminFaqsHandler(request: NextRequest) {
  const admin = await requireAdminAccess(request);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const published = searchParams.get('published');

  if (page < 1 || limit < 1 || limit > 50) {
    throw ApiErrors.BadRequest('잘못된 페이지 또는 제한값입니다.');
  }

  const offset = (page - 1) * limit;

  // 쿼리 빌더 설정
  let query = supabaseAdmin
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
    `);

  // 카테고리 필터
  if (category) {
    query = query.eq('category', category);
  }

  // 발행 상태 필터
  if (published === 'true') {
    query = query.eq('is_published', true);
  } else if (published === 'false') {
    query = query.eq('is_published', false);
  }

  // 정렬 및 페이지네이션
  const { data: faqs, error: faqsError } = await query
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (faqsError) {
    console.error('Admin FAQs fetch error:', faqsError);
    throw ApiErrors.InternalServerError('FAQ를 가져올 수 없습니다.');
  }

  // 전체 개수 조회
  let countQuery = supabaseAdmin
    .from('faqs')
    .select('*', { count: 'exact', head: true });

  if (category) {
    countQuery = countQuery.eq('category', category);
  }

  if (published === 'true') {
    countQuery = countQuery.eq('is_published', true);
  } else if (published === 'false') {
    countQuery = countQuery.eq('is_published', false);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error('Admin FAQs count error:', countError);
    throw ApiErrors.InternalServerError('FAQ 수를 가져올 수 없습니다.');
  }

  const totalPages = Math.ceil((count || 0) / limit);

  // 카테고리 목록 조회
  const { data: categories } = await supabaseAdmin
    .from('faqs')
    .select('category')
    .not('category', 'is', null);

  const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];

  return createSuccessResponse({
    faqs: faqs || [],
    categories: uniqueCategories,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: count || 0,
      limit: limit
    }
  });
}

// 관리자 FAQ 생성
async function createFaqHandler(request: NextRequest) {
  const admin = await requireAdminAccess(request);

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

  const faqData: FaqInsert = {
    question: question.trim(),
    answer: answer.trim(),
    category: category?.trim() || 'general',
    order_index: parseInt(order_index) || 0,
    is_published: Boolean(is_published)
  };

  const { data: faq, error } = await supabaseAdmin
    .from('faqs')
    .insert(faqData)
    .select()
    .single();

  if (error) {
    console.error('FAQ creation error:', error);
    throw ApiErrors.InternalServerError(
      'FAQ 등록 중 오류가 발생했습니다.',
      'FAQ_CREATION_ERROR'
    );
  }

  return createSuccessResponse({
    faq
  }, 'FAQ가 성공적으로 등록되었습니다.');
}

export const GET = withErrorHandling(getAdminFaqsHandler);
export const POST = withErrorHandling(createFaqHandler);