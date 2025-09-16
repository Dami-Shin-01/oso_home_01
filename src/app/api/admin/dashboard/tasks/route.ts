import { NextRequest } from 'next/server';
import { supabaseAdmin, type Database } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';

async function getDashboardTasksHandler(request: NextRequest) {
  const today = new Date().toISOString().split('T')[0];

  // 1. 승인 대기 중인 예약 수
  const { data: pendingReservations, error: pendingError } = await supabaseAdmin
    .from('reservations')
    .select('id')
    .eq('status', 'PENDING')
    .eq('payment_status', 'WAITING');

  if (pendingError) {
    console.error('Pending reservations fetch error:', pendingError);
    throw ApiErrors.InternalServerError(
      '대기 중인 예약을 가져올 수 없습니다.',
      'PENDING_RESERVATIONS_ERROR'
    );
  }

  // 2. 취소 요청이 있는 예약 수 (여기서는 최근 취소된 예약으로 대체)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data: cancelledReservations, error: cancelledError } = await supabaseAdmin
    .from('reservations')
    .select('id')
    .eq('status', 'CANCELLED')
    .gte('updated_at', yesterday.toISOString());

  if (cancelledError) {
    console.error('Cancelled reservations fetch error:', cancelledError);
    throw ApiErrors.InternalServerError(
      '취소된 예약을 가져올 수 없습니다.',
      'CANCELLED_RESERVATIONS_ERROR'
    );
  }

  // 3. 오늘 예약된 건수 (시설 점검 관련)
  const { data: todayReservations, error: todayError } = await supabaseAdmin
    .from('reservations')
    .select('id')
    .eq('reservation_date', today)
    .neq('status', 'CANCELLED');

  if (todayError) {
    console.error('Today reservations fetch error:', todayError);
    throw ApiErrors.InternalServerError(
      '오늘 예약 현황을 가져올 수 없습니다.',
      'TODAY_RESERVATIONS_ERROR'
    );
  }

  // 4. 공지사항 미발행 건수
  const { data: unpublishedNotices, error: noticesError } = await supabaseAdmin
    .from('notices')
    .select('id')
    .eq('is_published', false);

  // notices 테이블이 없을 수 있으므로 에러를 무시
  const unpublishedCount = noticesError ? 0 : (unpublishedNotices?.length || 0);

  // 업무 목록 생성
  const tasks = [
    {
      id: 1,
      title: '신규 예약 승인 대기',
      count: pendingReservations?.length || 0,
      urgent: (pendingReservations?.length || 0) > 0,
      type: 'pending_reservations',
      description: '입금 확인 후 예약을 승인해주세요'
    },
    {
      id: 2,
      title: '최근 취소 요청',
      count: cancelledReservations?.length || 0,
      urgent: (cancelledReservations?.length || 0) > 0,
      type: 'cancelled_reservations',
      description: '환불 처리가 필요한 취소 건'
    },
    {
      id: 3,
      title: '오늘 예약 현황 점검',
      count: todayReservations?.length || 0,
      urgent: false,
      type: 'today_reservations',
      description: '시설 준비 상태를 확인해주세요'
    },
    {
      id: 4,
      title: '공지사항 발행 대기',
      count: unpublishedCount,
      urgent: unpublishedCount > 0,
      type: 'unpublished_notices',
      description: '작성된 공지사항을 검토하고 발행해주세요'
    }
  ];

  // 긴급한 업무 우선 정렬
  tasks.sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return b.count - a.count;
  });

  return createSuccessResponse({
    tasks,
    summary: {
      total_tasks: tasks.length,
      urgent_tasks: tasks.filter(task => task.urgent).length,
      total_items: tasks.reduce((sum, task) => sum + task.count, 0)
    }
  }, '대시보드 업무 목록 조회가 완료되었습니다.');
}

export const GET = withErrorHandling(getDashboardTasksHandler);