import { NextRequest } from 'next/server';
import { supabaseAdmin, type Database } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';

async function getAuthenticatedAdmin(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.substring(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // 관리자 권한 확인
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['MANAGER', 'ADMIN'].includes(profile.role)) {
    return null;
  }

  return user;
}

type Facility = Database['public']['Tables']['facilities']['Row'];
type FacilityInsert = Database['public']['Tables']['facilities']['Insert'];

async function getFacilitiesHandler(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    throw ApiErrors.Forbidden(
      '관리자 권한이 필요합니다.',
      'ADMIN_ACCESS_REQUIRED'
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const isActive = searchParams.get('is_active');

  let query = supabaseAdmin
    .from('facilities')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // 활성 상태 필터링
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  const { data: facilities, error } = await query;

  if (error) {
    console.error('Facilities fetch error:', error);
    throw ApiErrors.InternalServerError(
      '시설 목록을 가져올 수 없습니다.',
      'FACILITIES_FETCH_ERROR'
    );
  }

  // 각 시설에 대한 구역 수 정보 추가
  const facilitiesWithStats = await Promise.all(
    facilities.map(async (facility) => {
      const { data: sitesCount } = await supabaseAdmin
        .from('sites')
        .select('id', { count: 'exact' })
        .eq('facility_id', facility.id);

      const { data: activeSitesCount } = await supabaseAdmin
        .from('sites')
        .select('id', { count: 'exact' })
        .eq('facility_id', facility.id)
        .eq('is_active', true);

      return {
        ...facility,
        sites_count: sitesCount?.length || 0,
        active_sites_count: activeSitesCount?.length || 0
      };
    })
  );

  return createSuccessResponse({
    facilities: facilitiesWithStats,
    pagination: {
      limit,
      offset,
      total: facilitiesWithStats.length
    }
  }, '시설 목록 조회가 완료되었습니다.');
}

async function createFacilityHandler(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    throw ApiErrors.Forbidden(
      '관리자 권한이 필요합니다.',
      'ADMIN_ACCESS_REQUIRED'
    );
  }

  const body = await request.json();

  const { name, description, capacity, price_per_hour, is_active, features } = body;

  // 입력 검증
  if (!name?.trim() || !description?.trim()) {
    throw ApiErrors.BadRequest(
      '시설명과 설명은 필수 입력 항목입니다.',
      'REQUIRED_FIELDS_MISSING'
    );
  }

  if (capacity < 1 || price_per_hour < 0) {
    throw ApiErrors.BadRequest(
      '수용인원은 1명 이상, 요금은 0원 이상이어야 합니다.',
      'INVALID_CAPACITY_OR_PRICE'
    );
  }

  // 중복 시설명 확인
  const { data: existingFacility } = await supabaseAdmin
    .from('facilities')
    .select('id')
    .eq('name', name.trim())
    .single();

  if (existingFacility) {
    throw ApiErrors.Conflict(
      '동일한 이름의 시설이 이미 존재합니다.',
      'FACILITY_NAME_DUPLICATE'
    );
  }

  const facilityData: FacilityInsert = {
    name: name.trim(),
    description: description.trim(),
    capacity: parseInt(capacity),
    price_per_hour: parseInt(price_per_hour),
    is_active: Boolean(is_active),
    features: Array.isArray(features) ? features : []
  };

  const { data: facility, error } = await supabaseAdmin
    .from('facilities')
    .insert(facilityData)
    .select()
    .single();

  if (error) {
    console.error('Facility creation error:', error);
    throw ApiErrors.InternalServerError(
      '시설 등록 중 오류가 발생했습니다.',
      'FACILITY_CREATION_ERROR'
    );
  }

  return createSuccessResponse({
    facility
  }, '시설이 성공적으로 등록되었습니다.');
}

export const GET = withErrorHandling(getFacilitiesHandler);
export const POST = withErrorHandling(createFacilityHandler);