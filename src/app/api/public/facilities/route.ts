import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';

async function getFacilitiesHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isActive = searchParams.get('is_active') !== 'false';

  const { data: facilities, error } = await supabaseAdmin
    .from('facilities')
    .select('*')
    .eq('is_active', isActive)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Public facilities fetch error:', error);
    throw ApiErrors.InternalServerError(
      '시설 목록을 가져올 수 없습니다.',
      'FACILITIES_FETCH_ERROR'
    );
  }

  return createSuccessResponse({
    facilities
  }, '시설 목록 조회가 완료되었습니다.');
}

export const GET = withErrorHandling(getFacilitiesHandler);