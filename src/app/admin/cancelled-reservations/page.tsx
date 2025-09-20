'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import { fetchWithAdminAuth } from '@/lib/admin-fetch';

interface CancelledReservation {
  id: string;
  customer: {
    type: 'member' | 'guest';
    name: string;
    email?: string;
    phone: string;
  };
  facility: {
    id: string;
    name: string;
    type: string;
  };
  site: {
    id: string;
    name: string;
    site_number: string;
    capacity: number;
  };
  reservation_details: {
    date: string;
    time_slots: number[];
    total_amount: number;
    status: string;
    payment_status: string;
    special_requests?: string;
    admin_memo?: string;
    cancellation_reason?: string;
  };
  timestamps: {
    created_at: string;
    updated_at: string;
    cancelled_at?: string;
  };
}

export default function CancelledReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<CancelledReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'refund_pending' | 'refunded'>('all');

  const fetchCancelledReservations = useCallback(async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        status: 'CANCELLED',
        limit: '20'
      });

      if (filterStatus !== 'all') {
        queryParams.append('payment_status', filterStatus === 'refund_pending' ? 'WAITING' : 'REFUNDED');
      }

      const response = await fetchWithAdminAuth<{
        success: boolean;
        data?: { reservations?: CancelledReservation[] };
        message?: string;
      }>(`/api/admin/reservations/management?${queryParams.toString()}`);

      setReservations(response.data?.reservations ?? []);
      setError(null);
    } catch (err) {
      console.error('Cancelled reservations fetch error:', err);
      setReservations([]);
      setError(err instanceof Error ? err.message : '취소된 예약을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

const handleRefundAction = async (reservationId: string, action: 'process_refund' | 'mark_refunded', memo?: string) => {
    try {
      setProcessingId(reservationId);
      const payload = await fetchWithAdminAuth<{ message?: string }>('/api/admin/reservations/management', {
        method: 'PUT',
        body: JSON.stringify({
          reservation_id: reservationId,
          payment_status: 'REFUNDED',
          admin_memo: memo || '환불 처리 완료'
        })
      });

      alert(payload?.message ?? '환불 처리가 완료되었습니다.');
      fetchCancelledReservations();
    } catch (err) {
      console.error('Refund action error:', err);
      alert(err instanceof Error ? err.message : '환불 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (!userData || !accessToken) {
        router.push('/login');
        return false;
      }

      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'MANAGER') {
        alert('관리자 권한이 필요합니다.');
        router.push('/admin');
        return false;
      }

      return true;
    };

    if (!checkAuth()) return;

    fetchCancelledReservations();
  }, [router, fetchCancelledReservations]);

const getTimeSlotText = (slots: number[]) => {
    const timeMap: Record<number, string> = {
      1: '1부 (11:00-15:00)',
      2: '2부 (15:00-19:00)',
      3: '3부 (19:00-23:00)'
    };
    return slots.map(slot => timeMap[slot]).join(', ');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'REFUNDED': return 'bg-green-100 text-green-800';
      case 'WAITING': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'REFUNDED': return '환불 완료';
      case 'WAITING': return '환불 대기';
      default: return '상태 불명';
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'refund_pending') return reservation.reservation_details.payment_status === 'WAITING';
    if (filterStatus === 'refunded') return reservation.reservation_details.payment_status === 'REFUNDED';
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">취소된 예약을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">취소된 예약 관리</h1>
          <p className="text-gray-600">취소된 예약의 환불 처리를 관리합니다.</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchCancelledReservations} variant="outline" disabled={loading}>
            {loading ? '새로고침 중...' : '새로고침'}
          </Button>
          <Link href="/admin">
            <Button variant="outline">
              ← 대시보드로 돌아가기
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="mb-6">
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchCancelledReservations} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Card className="flex-1 p-4 bg-red-50 border-red-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📋</span>
            <div>
              <h3 className="font-semibold text-red-800">취소된 예약: {filteredReservations.length}건</h3>
              <p className="text-red-700 text-sm">환불 처리가 필요한 예약을 확인하세요.</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">필터:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">전체</option>
              <option value="refund_pending">환불 대기</option>
              <option value="refunded">환불 완료</option>
            </select>
          </div>
        </Card>
      </div>

      {filteredReservations.length > 0 ? (
        <div className="space-y-6">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                    취소됨
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusColor(reservation.reservation_details.payment_status)}`}>
                    {getPaymentStatusText(reservation.reservation_details.payment_status)}
                  </span>
                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                    {reservation.customer.type === 'member' ? '회원' : '비회원'}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>취소일: {reservation.timestamps.cancelled_at ? formatDateTime(reservation.timestamps.cancelled_at) : '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">고객 정보</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">이름:</span> {reservation.customer.name}</p>
                    <p><span className="font-medium">전화:</span> {reservation.customer.phone}</p>
                    {reservation.customer.email && (
                      <p><span className="font-medium">이메일:</span> {reservation.customer.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">예약 정보</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">시설:</span> {reservation.facility.name}</p>
                    <p><span className="font-medium">구역:</span> {reservation.site.name}</p>
                    <p><span className="font-medium">예약일:</span> {formatDate(reservation.reservation_details.date)}</p>
                    <p><span className="font-medium">시간:</span> {getTimeSlotText(reservation.reservation_details.time_slots)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">환불 정보</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">환불 금액:</span> <span className="text-lg font-bold text-red-600">{formatPrice(reservation.reservation_details.total_amount)}원</span></p>
                    <p><span className="font-medium">환불 상태:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getPaymentStatusColor(reservation.reservation_details.payment_status)}`}>
                        {getPaymentStatusText(reservation.reservation_details.payment_status)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {reservation.reservation_details.cancellation_reason && (
                <div className="mb-4 p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">취소 사유</h4>
                  <p className="text-red-800 text-sm">{reservation.reservation_details.cancellation_reason}</p>
                </div>
              )}

              {reservation.reservation_details.admin_memo && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">관리자 메모</h4>
                  <p className="text-gray-800 text-sm">{reservation.reservation_details.admin_memo}</p>
                </div>
              )}

              {reservation.reservation_details.payment_status === 'WAITING' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const memo = prompt('환불 처리 메모를 입력해주세요:', '계좌이체로 환불 완료');
                      if (memo !== null) {
                        handleRefundAction(reservation.id, 'mark_refunded', memo);
                      }
                    }}
                    disabled={processingId === reservation.id}
                  >
                    환불 완료 처리
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (confirm(`${formatPrice(reservation.reservation_details.total_amount)}원을 환불 처리하시겠습니까?`)) {
                        handleRefundAction(reservation.id, 'process_refund', '환불 처리 완료');
                      }
                    }}
                    disabled={processingId === reservation.id}
                  >
                    {processingId === reservation.id ? '처리 중...' : '환불 처리'}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">✅</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">처리할 취소 건이 없습니다</h3>
            <p className="text-gray-600 mb-4">
              {filterStatus === 'all' ? '모든 취소된 예약이 처리되었습니다.' :
               filterStatus === 'refund_pending' ? '환불 대기 중인 예약이 없습니다.' :
               '환불 완료된 예약만 표시됩니다.'}
            </p>
            <Link href="/admin">
              <Button variant="primary">
                대시보드로 돌아가기
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h4 className="font-semibold mb-4">환불 처리 안내</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. 취소 사유를 확인합니다</p>
            <p>2. 환불 정책에 따라 금액을 계산합니다</p>
            <p>3. 고객에게 환불 처리를 진행합니다</p>
            <p>4. 환불 완료 후 상태를 업데이트합니다</p>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">빠른 액션</h4>
          <div className="space-y-2">
            <Link href="/admin/reservations">
              <Button variant="outline" size="sm" className="w-full">
                전체 예약 관리
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" size="sm" className="w-full">
                환불 정책 설정
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">통계</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>총 취소 건수</span>
              <span className="font-semibold text-red-600">{reservations.length}건</span>
            </div>
            <div className="flex justify-between">
              <span>환불 대기</span>
              <span className="font-semibold text-orange-600">
                {reservations.filter(r => r.reservation_details.payment_status === 'WAITING').length}건
              </span>
            </div>
            <div className="flex justify-between">
              <span>환불 완료</span>
              <span className="font-semibold text-green-600">
                {reservations.filter(r => r.reservation_details.payment_status === 'REFUNDED').length}건
              </span>
            </div>
            <div className="flex justify-between">
              <span>총 환불 금액</span>
              <span className="font-semibold text-red-600">
                {formatPrice(reservations.reduce((sum, r) => sum + r.reservation_details.total_amount, 0))}원
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}