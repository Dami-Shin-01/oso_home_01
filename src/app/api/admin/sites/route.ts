import { NextRequest } from 'next/server';
import { supabaseAdmin, type Database } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { requireAdminAccess } from '@/lib/auth-helpers';

type Site = Database['public']['Tables']['sites']['Row'];
type SiteInsert = Database['public']['Tables']['sites']['Insert'];

async function getSitesHandler(request: NextRequest) {
  const admin = await requireAdminAccess(request);

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const facilityId = searchParams.get('facility_id');
  const isActive = searchParams.get('is_active');

  let query = supabaseAdmin
    .from('sites')
    .select(`
      *,
      facility:facilities(
        id,
        name,
        capacity,
        is_active
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // 시설 ID 필터링
  if (facilityId) {
    query = query.eq('facility_id', facilityId);
  }

  // 활성 상태 필터링
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  const { data: sites, error } = await query;

  if (error) {
    console.error('Sites fetch error:', error);
    throw ApiErrors.InternalServerError(
      '구역 목록을 가져올 수 없습니다.',
      'SITES_FETCH_ERROR'
    );
  }

  return createSuccessResponse({
    sites,
    pagination: {
      limit,
      offset,
      total: sites.length
    }
  }, '구역 목록 조회가 완료되었습니다.');
}

async function createSiteHandler(request: NextRequest) {
  const admin = await requireAdminAccess(request);

  const body = await request.json();

  const { facility_id, site_number, name, description, capacity, is_active } = body;

  // 입력 검증
  if (!facility_id || !site_number?.trim() || !name?.trim() || !capacity || capacity < 1) {
    throw ApiErrors.BadRequest(
      '소속 시설, 구역번호, 구역명, 수용인원(1명 이상)은 필수 입력 항목입니다.',
      'REQUIRED_FIELDS_MISSING'
    );
  }

  // 시설 존재 여부 및 활성 상태 확인
  const { data: facility, error: facilityError } = await supabaseAdmin
    .from('facilities')
    .select('id, name, is_active')
    .eq('id', facility_id)
    .single();

  if (facilityError || !facility) {
    throw ApiErrors.NotFound(
      '선택한 시설을 찾을 수 없습니다.',
      'FACILITY_NOT_FOUND'
    );
  }

  if (!facility.is_active) {
    throw ApiErrors.BadRequest(
      '비활성화된 시설에는 구역을 등록할 수 없습니다.',
      'FACILITY_INACTIVE'
    );
  }

  // 같은 시설 내 중복 구역번호 확인
  const { data: existingSite } = await supabaseAdmin
    .from('sites')
    .select('id')
    .eq('facility_id', facility_id)
    .eq('site_number', site_number.trim())
    .single();

  if (existingSite) {
    throw ApiErrors.Conflict(
      '동일한 시설 내에 같은 구역번호가 이미 존재합니다.',
      'SITE_NUMBER_DUPLICATE'
    );
  }

  const siteData: SiteInsert = {
    facility_id,
    site_number: site_number.trim(),
    name: name.trim(),
    description: description?.trim() || null,
    capacity: parseInt(capacity),
    is_active: Boolean(is_active)
  };

  const { data: site, error } = await supabaseAdmin
    .from('sites')
    .insert(siteData)
    .select(`
      *,
      facility:facilities(
        id,
        name,
        capacity,
        weekday_price,
        weekend_price,
        is_active
      )
    `)
    .single();

  if (error) {
    console.error('Site creation error:', error);
    throw ApiErrors.InternalServerError(
      '구역 등록 중 오류가 발생했습니다.',
      'SITE_CREATION_ERROR'
    );
  }

  return createSuccessResponse({
    site
  }, '구역이 성공적으로 등록되었습니다.');
}

export const GET = withErrorHandling(getSitesHandler);
export const POST = withErrorHandling(createSiteHandler);