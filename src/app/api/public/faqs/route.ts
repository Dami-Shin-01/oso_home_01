import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import type { FaqRow } from '@/types/database';

async function getFaqsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');

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
    `)
    .eq('is_published', true);

  // 카테고리 필터
  if (category) {
    query = query.eq('category', category);
  }

  // 정렬 및 페이지네이션
  const { data: faqs, error: faqsError } = await query
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (faqsError) {
    console.error('FAQs fetch error:', faqsError);
    throw ApiErrors.InternalServerError('FAQ를 가져올 수 없습니다.');
  }

  // 전체 개수 조회
  let countQuery = supabaseAdmin
    .from('faqs')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);

  if (category) {
    countQuery = countQuery.eq('category', category);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error('FAQs count error:', countError);
    throw ApiErrors.InternalServerError('FAQ 수를 가져올 수 없습니다.');
  }

  // 카테고리 목록 조회
  const { data: categories, error: categoriesError } = await supabaseAdmin
    .from('faqs')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null);

  const uniqueCategories = categories ?
    [...new Set(categories.map(item => item.category))] : [];

  const totalPages = Math.ceil((count || 0) / limit);

  return createSuccessResponse({
    faqs: faqs?.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order_index: faq.order_index,
      created_at: faq.created_at,
      updated_at: faq.updated_at
    })) || [],
    categories: uniqueCategories,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: count || 0,
      limit: limit
    }
  });
}

export const GET = withErrorHandling(getFaqsHandler);