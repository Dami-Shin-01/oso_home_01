import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { requireAdminAccess } from '@/lib/auth-helpers';

interface ReservationRow {
  user_id: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  total_amount: number | null;
}

interface UserReservationStats {
  total_count: number;
  completed_count: number;
  cancelled_count: number;
  pending_count: number;
  total_amount: number;
}

async function getUserStatsHandler(request: NextRequest) {
  await requireAdminAccess(request);

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('user_id, status, total_amount');

  if (error) {
    console.error('Admin user stats fetch error:', error);
    throw ApiErrors.InternalServerError(
      '����� ���� �հ� ������ �� ������ �߻��߽��ϴ�.',
      'USER_STATS_FETCH_ERROR'
    );
  }

  const statsMap = new Map<string, UserReservationStats>();

  (data as ReservationRow[] | null)?.forEach((reservation) => {
    if (!reservation.user_id) {
      return;
    }

    const existing = statsMap.get(reservation.user_id) ?? {
      total_count: 0,
      completed_count: 0,
      cancelled_count: 0,
      pending_count: 0,
      total_amount: 0
    };

    existing.total_count += 1;

    if (reservation.status === 'CONFIRMED') {
      existing.completed_count += 1;
    } else if (reservation.status === 'CANCELLED') {
      existing.cancelled_count += 1;
    } else if (reservation.status === 'PENDING') {
      existing.pending_count += 1;
    }

    if (typeof reservation.total_amount === 'number') {
      existing.total_amount += reservation.total_amount;
    }

    statsMap.set(reservation.user_id, existing);
  });

  const stats = Array.from(statsMap.entries()).map(([user_id, stat]) => ({
    user_id,
    ...stat
  }));

  const summary = {
    total_users_with_reservations: stats.length,
    total_reservations: stats.reduce((sum, stat) => sum + stat.total_count, 0),
    completed_reservations: stats.reduce((sum, stat) => sum + stat.completed_count, 0),
    cancelled_reservations: stats.reduce((sum, stat) => sum + stat.cancelled_count, 0),
    pending_reservations: stats.reduce((sum, stat) => sum + stat.pending_count, 0),
    total_amount: stats.reduce((sum, stat) => sum + stat.total_amount, 0)
  };

  return createSuccessResponse({
    stats,
    summary
  }, '���� �հ� ������ �����߽��ϴ�.');
}

export const GET = withErrorHandling(getUserStatsHandler);
