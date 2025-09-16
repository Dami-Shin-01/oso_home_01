import { NextRequest } from 'next/server';
import { supabaseAdmin, type Database } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';

async function getRecentReservationsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  // 최근 예약 목록 조회 (시설, 사이트 정보 포함)
  const { data: reservations, error: reservationError } = await supabaseAdmin
    .from('reservations')
    .select(`
      id,
      user_id,
      guest_name,
      guest_phone,
      reservation_date,
      time_slots,
      total_amount,
      status,
      payment_status,
      created_at,
      facilities:facility_id(name, type),
      sites:site_id(name, site_number)
    `)
    .order('created_at', { ascending: false })
    .limit(limit) as {
      data: Array<{
        id: string;
        user_id: string | null;
        guest_name: string | null;
        guest_phone: string | null;
        reservation_date: string;
        time_slots: number[];
        total_amount: number;
        status: string;
        payment_status: string;
        created_at: string;
        facilities: { name: string; type: string } | null;
        sites: { name: string; site_number: string } | null;
      }> | null;
      error: any;
    };

  if (reservationError || !reservations) {
    console.error('Recent reservations fetch error:', reservationError);
    throw ApiErrors.InternalServerError(
      '최근 예약 목록을 가져올 수 없습니다.',
      'RECENT_RESERVATIONS_ERROR'
    );
  }

  // 회원 정보가 있는 예약의 경우 사용자 이름 조회
  const userIds = reservations
    .filter(res => res.user_id)
    .map(res => res.user_id!)
    .filter((id, index, self) => self.indexOf(id) === index); // 중복 제거

  let users: Array<{ id: string; name: string }> = [];
  if (userIds.length > 0) {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('id', userIds);

    if (userError) {
      console.error('Users fetch error:', userError);
      // 사용자 정보 오류는 치명적이지 않으므로 빈 배열로 처리
    } else {
      users = userData || [];
    }
  }

  // 데이터 매핑
  const formattedReservations = reservations.map(reservation => {
    const user = users.find(u => u.id === reservation.user_id);
    const customerName = user?.name || reservation.guest_name || '알 수 없음';
    const facilityName = reservation.facilities?.name || '알 수 없음';
    const siteName = reservation.sites?.name || `사이트 ${reservation.sites?.site_number || '?'}`;

    return {
      id: reservation.id,
      customer_name: customerName,
      customer_type: reservation.user_id ? 'member' : 'guest',
      contact: reservation.guest_phone || '회원',
      facility_name: facilityName,
      site_name: siteName,
      reservation_date: reservation.reservation_date,
      time_slots: reservation.time_slots,
      total_amount: reservation.total_amount,
      status: reservation.status,
      payment_status: reservation.payment_status,
      created_at: reservation.created_at
    };
  });

  return createSuccessResponse({
    reservations: formattedReservations,
    total: formattedReservations.length
  }, '최근 예약 목록 조회가 완료되었습니다.');
}

export const GET = withErrorHandling(getRecentReservationsHandler);