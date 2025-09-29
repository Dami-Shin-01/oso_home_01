import { NextRequest } from 'next/server';
import { getOptimizedFacilities, invalidateCache } from '@/lib/db-optimization';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';

/**
 * 최적화된 시설 목록 API
 */
async function getFacilitiesHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // 쿼리 파라미터 파싱
  const activeOnly = searchParams.get('active') !== 'false';
  const limit = parseInt(searchParams.get('limit') || '20');
  const fields = searchParams.get('fields')?.split(',');
  const orderBy = searchParams.get('orderBy') || 'created_at';

  try {
    // 최적화된 쿼리 실행
    const facilities = await getOptimizedFacilities({
      activeOnly,
      limit: Math.min(limit, 100), // 최대 100개로 제한
      fields,
      orderBy
    });

    if (!facilities || !Array.isArray(facilities)) {
      throw ApiErrors.InternalServerError('시설 데이터를 가져올 수 없습니다.');
    }

    return createSuccessResponse({
      facilities,
      count: facilities.length
    });

  } catch (error) {
    console.error('Facilities API error:', error);
    
    // 캐시 무효화 (데이터 불일치 방지)
    invalidateCache.facilities();
    
    throw error;
  }
}

export const GET = withErrorHandling(getFacilitiesHandler);
