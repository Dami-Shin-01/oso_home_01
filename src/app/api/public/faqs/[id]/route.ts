import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import type { FaqRow } from '@/types/database';

async function getFaqHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    throw ApiErrors.BadRequest('FAQ ID가 필요합니다.');
  }

  // FAQ 조회
  const { data: faq, error: faqError } = await supabaseAdmin
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
    .eq('is_published', true)
    .single();

  if (faqError || !faq) {
    throw ApiErrors.NotFound('FAQ를 찾을 수 없습니다.');
  }

  return createSuccessResponse({
    faq: {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order_index: faq.order_index,
      created_at: faq.created_at,
      updated_at: faq.updated_at
    }
  });
}

export const GET = withErrorHandling(getFaqHandler);