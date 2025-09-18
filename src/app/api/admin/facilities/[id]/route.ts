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

type FacilityUpdate = Database['public']['Tables']['facilities']['Update'];

async function updateFacilityHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    throw ApiErrors.Forbidden(
      '관리자 권한이 필요합니다.',
      'ADMIN_ACCESS_REQUIRED'
    );
  }

  const params = await context.params;
  const facilityId = params.id;
  const body = await request.json();

  const { name, description, capacity, price_per_session, is_active } = body;

  // 입력 검증
  if (!name?.trim() || !description?.trim()) {
    throw ApiErrors.BadRequest(
      '시설명과 설명은 필수 입력 항목입니다.',
      'REQUIRED_FIELDS_MISSING'
    );
  }

  if (capacity < 1 || price_per_session < 0) {
    throw ApiErrors.BadRequest(
      '수용인원은 1명 이상, 요금은 0원 이상이어야 합니다.',
      'INVALID_CAPACITY_OR_PRICE'
    );
  }

  // 시설 존재 여부 확인
  const { data: existingFacility, error: fetchError } = await supabaseAdmin
    .from('facilities')
    .select('id, name')
    .eq('id', facilityId)
    .single();

  if (fetchError || !existingFacility) {
    throw ApiErrors.NotFound(
      '시설을 찾을 수 없습니다.',
      'FACILITY_NOT_FOUND'
    );
  }

  // 중복 시설명 확인 (자기 자신 제외)
  const { data: duplicateFacility } = await supabaseAdmin
    .from('facilities')
    .select('id')
    .eq('name', name.trim())
    .neq('id', facilityId)
    .single();

  if (duplicateFacility) {
    throw ApiErrors.Conflict(
      '동일한 이름의 시설이 이미 존재합니다.',
      'FACILITY_NAME_DUPLICATE'
    );
  }

  const facilityData: FacilityUpdate = {
    name: name.trim(),
    description: description.trim(),
    capacity: parseInt(capacity),
    is_active: Boolean(is_active),
    updated_at: new Date().toISOString()
  };

  const { data: facility, error } = await supabaseAdmin
    .from('facilities')
    .update(facilityData)
    .eq('id', facilityId)
    .select()
    .single();

  if (error) {
    console.error('Facility update error:', error);
    throw ApiErrors.InternalServerError(
      '시설 수정 중 오류가 발생했습니다.',
      'FACILITY_UPDATE_ERROR'
    );
  }

  return createSuccessResponse({
    facility
  }, '시설이 성공적으로 수정되었습니다.');
}

async function deleteFacilityHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    throw ApiErrors.Forbidden(
      '관리자 권한이 필요합니다.',
      'ADMIN_ACCESS_REQUIRED'
    );
  }

  const params = await context.params;
  const facilityId = params.id;

  // 시설 존재 여부 확인
  const { data: existingFacility, error: fetchError } = await supabaseAdmin
    .from('facilities')
    .select('id, name')
    .eq('id', facilityId)
    .single();

  if (fetchError || !existingFacility) {
    throw ApiErrors.NotFound(
      '시설을 찾을 수 없습니다.',
      'FACILITY_NOT_FOUND'
    );
  }

  // 관련된 구역들 확인
  const { data: relatedSites } = await supabaseAdmin
    .from('sites')
    .select('id')
    .eq('facility_id', facilityId);

  // 먼저 관련된 구역들 삭제
  if (relatedSites && relatedSites.length > 0) {
    const { error: sitesDeleteError } = await supabaseAdmin
      .from('sites')
      .delete()
      .eq('facility_id', facilityId);

    if (sitesDeleteError) {
      console.error('Related sites deletion error:', sitesDeleteError);
      throw ApiErrors.InternalServerError(
        '관련 구역 삭제 중 오류가 발생했습니다.',
        'RELATED_SITES_DELETE_ERROR'
      );
    }
  }

  // 시설 삭제
  const { error } = await supabaseAdmin
    .from('facilities')
    .delete()
    .eq('id', facilityId);

  if (error) {
    console.error('Facility deletion error:', error);
    throw ApiErrors.InternalServerError(
      '시설 삭제 중 오류가 발생했습니다.',
      'FACILITY_DELETE_ERROR'
    );
  }

  return createSuccessResponse({
    deletedFacilityId: facilityId,
    deletedSitesCount: relatedSites?.length || 0
  }, '시설이 성공적으로 삭제되었습니다.');
}

export const PUT = withErrorHandling(updateFacilityHandler);
export const DELETE = withErrorHandling(deleteFacilityHandler);