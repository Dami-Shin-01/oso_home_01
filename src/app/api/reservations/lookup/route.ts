import { NextRequest } from 'next/server';
import { supabaseAdmin, type Database } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  validateRequiredFields,
  withErrorHandling
} from '@/lib/api-response';

async function lookupReservationHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reservation_id = searchParams.get('reservation_id');
  const guest_phone = searchParams.get('guest_phone');

  // 예약 ID와 연락처로 조회 (비회원 예약)
  if (reservation_id && guest_phone) {
    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .select(`
        id,
        guest_name,
        guest_phone,
        guest_email,
        reservation_date,
        time_slots,
        total_amount,
        status,
        payment_status,
        special_requests,
        admin_memo,
        created_at,
        updated_at,
        facilities!inner(id, name, type),
        sites!inner(id, name, site_number)
      `)
      .eq('id', reservation_id)
      .eq('guest_phone', guest_phone)
      .is('user_id', null)
      .single() as {
        data: Database['public']['Tables']['reservations']['Row'] & {
          facilities: Database['public']['Tables']['facilities']['Row'];
          sites: Database['public']['Tables']['sites']['Row'];
        } | null;
        error: any;
      };

    if (error || !reservation) {
      throw ApiErrors.NotFound(
        '예약 내역을 찾을 수 없습니다. 예약번호와 연락처를 확인해주세요.',
        'RESERVATION_NOT_FOUND'
      );
    }

    return createSuccessResponse({
      reservation_id: reservation.id,
      guest_name: reservation.guest_name,
      guest_phone: reservation.guest_phone,
      guest_email: reservation.guest_email,
      facility: {
        id: reservation.facilities.id,
        name: reservation.facilities.name,
        type: reservation.facilities.type
      },
      site: {
        id: reservation.sites.id,
        name: reservation.sites.name,
        site_number: reservation.sites.site_number
      },
      reservation_date: reservation.reservation_date,
      time_slots: reservation.time_slots,
      total_amount: reservation.total_amount,
      status: reservation.status,
      payment_status: reservation.payment_status,
      special_requests: reservation.special_requests,
      admin_memo: reservation.admin_memo,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at
    }, '예약 내역을 조회했습니다.');
  }

  // 날짜별/시설별 가용성 조회
  const date = searchParams.get('date');
  const facility_id = searchParams.get('facility_id');

  if (date) {
    // 해당 날짜의 모든 예약 조회
    let query = supabaseAdmin
      .from('reservations')
      .select(`
        site_id,
        time_slots,
        sites!inner(id, name, site_number, facility_id),
        facilities!inner(id, name, type)
      `)
      .eq('reservation_date', date)
      .neq('status', 'CANCELLED');

    if (facility_id) {
      query = query.eq('facility_id', facility_id);
    }

    const { data: reservations, error: reservationError } = await query;

    if (reservationError) {
      console.error('Reservation lookup error:', reservationError);
      throw ApiErrors.InternalServerError(
        '예약 조회에 실패했습니다.',
        'RESERVATION_LOOKUP_ERROR'
      );
    }

    // 시설별 가용성 계산
    const availability: Record<string, any> = {};

    // 먼저 모든 활성 시설과 사이트 가져오기
    let facilitiesQuery = supabaseAdmin
      .from('facilities')
      .select(`
        id,
        name,
        type,
        sites!inner(id, name, site_number, capacity, is_active)
      `)
      .eq('is_active', true)
      .eq('sites.is_active', true);

    if (facility_id) {
      facilitiesQuery = facilitiesQuery.eq('id', facility_id);
    }

    const { data: facilities, error: facilityError } = await facilitiesQuery;

    if (facilityError) {
      console.error('Facility lookup error:', facilityError);
      throw ApiErrors.InternalServerError(
        '시설 조회에 실패했습니다.',
        'FACILITY_LOOKUP_ERROR'
      );
    }

    // 각 시설의 사이트별 예약된 시간대 계산
    facilities?.forEach(facility => {
      availability[facility.id] = {
        facility_name: facility.name,
        facility_type: facility.type,
        sites: {}
      };

      facility.sites.forEach(site => {
        const siteReservations = reservations?.filter(r => r.site_id === site.id) || [];
        const occupiedSlots = siteReservations.flatMap(r => r.time_slots);

        availability[facility.id].sites[site.id] = {
          site_name: site.name,
          site_number: site.site_number,
          capacity: site.capacity,
          occupied_time_slots: occupiedSlots,
          available_time_slots: [1, 2, 3].filter(slot => !occupiedSlots.includes(slot))
        };
      });
    });

    return createSuccessResponse({
      date,
      facility_id: facility_id || null,
      availability
    }, '가용성 정보를 조회했습니다.');
  }

  throw ApiErrors.BadRequest(
    '예약 조회를 위해서는 예약번호+연락처 또는 날짜가 필요합니다.',
    'MISSING_REQUIRED_PARAMS'
  );
}

export const GET = withErrorHandling(lookupReservationHandler);