import { NextRequest } from 'next/server';
import { supabaseAdmin, type Database } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { requireAdminAccess } from '@/lib/auth-helpers';

type SiteUpdate = Database['public']['Tables']['sites']['Update'];

async function updateSiteHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);

  const params = await context.params;
  const siteId = params.id;
  const body = await request.json();

  const { site_number, name, description, capacity, is_active } = body;

  // 입력 검증
  if (!name?.trim()) {
    throw ApiErrors.BadRequest(
      '구역명은 필수 입력 항목입니다.',
      'REQUIRED_FIELDS_MISSING'
    );
  }

  // 구역 존재 여부 확인
  const { data: existingSite, error: fetchError } = await supabaseAdmin
    .from('sites')
    .select('id, name, facility_id')
    .eq('id', siteId)
    .single();

  if (fetchError || !existingSite) {
    throw ApiErrors.NotFound(
      '구역을 찾을 수 없습니다.',
      'SITE_NOT_FOUND'
    );
  }

  // 같은 시설 내 중복 구역명 확인 (자기 자신 제외)
  const { data: duplicateSite } = await supabaseAdmin
    .from('sites')
    .select('id')
    .eq('facility_id', existingSite.facility_id)
    .eq('name', name.trim())
    .neq('id', siteId)
    .single();

  if (duplicateSite) {
    throw ApiErrors.Conflict(
      '동일한 시설 내에 같은 이름의 구역이 이미 존재합니다.',
      'SITE_NAME_DUPLICATE'
    );
  }

  const siteData: SiteUpdate = {
    site_number: site_number?.trim(),
    name: name.trim(),
    description: description?.trim() || null,
    capacity: capacity ? parseInt(capacity) : undefined,
    is_active: Boolean(is_active),
    updated_at: new Date().toISOString()
  };

  const { data: site, error } = await supabaseAdmin
    .from('sites')
    .update(siteData)
    .eq('id', siteId)
    .select(`
      *,
      facility:facilities(
        id,
        name,
        capacity,
        is_active
      )
    `)
    .single();

  if (error) {
    console.error('Site update error:', error);
    throw ApiErrors.InternalServerError(
      '구역 수정 중 오류가 발생했습니다.',
      'SITE_UPDATE_ERROR'
    );
  }

  return createSuccessResponse({
    site
  }, '구역이 성공적으로 수정되었습니다.');
}

async function deleteSiteHandler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess(request);

  const params = await context.params;
  const siteId = params.id;

  // 구역 존재 여부 확인
  const { data: existingSite, error: fetchError } = await supabaseAdmin
    .from('sites')
    .select('id, name, facility_id')
    .eq('id', siteId)
    .single();

  if (fetchError || !existingSite) {
    throw ApiErrors.NotFound(
      '구역을 찾을 수 없습니다.',
      'SITE_NOT_FOUND'
    );
  }

  // 관련된 예약들 확인 (필요시 제약 사항 추가)
  const { data: relatedReservations } = await supabaseAdmin
    .from('reservations')
    .select('id')
    .eq('site_id', siteId)
    .neq('status', 'CANCELLED');

  if (relatedReservations && relatedReservations.length > 0) {
    throw ApiErrors.BadRequest(
      '해당 구역에 활성 예약이 있어 삭제할 수 없습니다. 먼저 예약을 취소하거나 완료해주세요.',
      'SITE_HAS_ACTIVE_RESERVATIONS'
    );
  }

  // 구역 삭제
  const { error } = await supabaseAdmin
    .from('sites')
    .delete()
    .eq('id', siteId);

  if (error) {
    console.error('Site deletion error:', error);
    throw ApiErrors.InternalServerError(
      '구역 삭제 중 오류가 발생했습니다.',
      'SITE_DELETE_ERROR'
    );
  }

  return createSuccessResponse({
    deletedSiteId: siteId,
    facilityId: existingSite.facility_id
  }, '구역이 성공적으로 삭제되었습니다.');
}

export const PUT = withErrorHandling(updateSiteHandler);
export const DELETE = withErrorHandling(deleteSiteHandler);