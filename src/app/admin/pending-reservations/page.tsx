'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';

interface PendingReservation {
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
  };
  timestamps: {
    created_at: string;
    updated_at: string;
  };
}

export default function PendingReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<PendingReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

    fetchPendingReservations();
  }, [router]);

  const fetchPendingReservations = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/reservations/management?status=PENDING&payment_status=WAITING', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReservations(data.data.reservations || []);
      } else {
        setReservations([
          {
            id: 'pending-1',
            customer: {
              type: 'guest',
              name: '김철수',
              phone: '010-1234-5678',
              email: 'customer@example.com'
            },
            facility: {
              id: 'facility-1',
              name: '프라이빗룸 A',
              type: 'private'
            },
            site: {
              id: 'site-1',
              name: '프라이빗룸 A - 사이트 1',
              site_number: 'private-1',
              capacity: 6
            },
            reservation_details: {
              date: '2025-09-20',
              time_slots: [1, 2],
              total_amount: 120000,
              status: 'PENDING',
              payment_status: 'WAITING',
              special_requests: '창문 쪽 자리로 부탁드립니다.'
            },
            timestamps: {
              created_at: '2025-09-17T10:30:00Z',
              updated_at: '2025-09-17T10:30:00Z'
            }
          },
          {
            id: 'pending-2',
            customer: {
              type: 'member',
              name: '박영희',
              phone: '010-9876-5432',
              email: 'member@example.com'
            },
            facility: {
              id: 'facility-2',
              name: '텐트동 B',
              type: 'tent'
            },
            site: {
              id: 'site-2',
              name: '텐트동 B - 사이트 1',
              site_number: 'tent-1',
              capacity: 8
            },
            reservation_details: {
              date: '2025-09-21',
              time_slots: [2, 3],
              total_amount: 150000,
              status: 'PENDING',
              payment_status: 'WAITING',
              special_requests: '생일파티용 준비 부탁드립니다.'
            },
            timestamps: {
              created_at: '2025-09-17T14:15:00Z',
              updated_at: '2025-09-17T14:15:00Z'
            }
          }
        ]);
      }

      setError(null);
    } catch (err) {
      console.error('Pending reservations fetch error:', err);
      setError('대기 중인 예약을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReservationAction = async (reservationId: string, action: 'approve' | 'reject', memo?: string) => {
    try {
      setProcessingId(reservationId);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch('/api/admin/reservations/management', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          status: action === 'approve' ? 'CONFIRMED' : 'CANCELLED',
          payment_status: action === 'approve' ? 'COMPLETED' : 'REFUNDED',
          admin_memo: memo || `${action === 'approve' ? '승인' : '거부'} 처리됨`
        })
      });

      if (response.ok) {
        alert(`예약이 성공적으로 ${action === 'approve' ? '승인' : '거부'}되었습니다.`);
        fetchPendingReservations();
      } else {
        throw new Error('처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Reservation action error:', err);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">대기 중인 예약을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">신규 예약 승인 대기</h1>
          <p className="text-gray-600">입금 확인 후 예약을 승인하거나 거부할 수 있습니다.</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchPendingReservations} variant="outline" disabled={loading}>
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
            <Button onClick={fetchPendingReservations} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-6">
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800">승인 대기 중인 예약: {reservations.length}건</h3>
              <p className="text-yellow-700 text-sm">입금 확인 후 빠른 승인 처리를 부탁드립니다.</p>
            </div>
          </div>
        </Card>
      </div>

      {reservations.length > 0 ? (
        <div className="space-y-6">
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    승인 대기
                  </span>
                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                    {reservation.customer.type === 'member' ? '회원' : '비회원'}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>신청일: {formatDateTime(reservation.timestamps.created_at)}</p>
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
                    <p><span className="font-medium">수용인원:</span> 최대 {reservation.site.capacity}명</p>
                    <p><span className="font-medium">예약일:</span> {formatDate(reservation.reservation_details.date)}</p>
                    <p><span className="font-medium">시간:</span> {getTimeSlotText(reservation.reservation_details.time_slots)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">결제 정보</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">총 금액:</span> <span className="text-lg font-bold text-green-600">{formatPrice(reservation.reservation_details.total_amount)}원</span></p>
                    <p><span className="font-medium">결제 상태:</span>
                      <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        입금 대기
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {reservation.reservation_details.special_requests && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">특별 요청사항</h4>
                  <p className="text-blue-800 text-sm">{reservation.reservation_details.special_requests}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const memo = prompt('거부 사유를 입력해주세요:');
                    if (memo !== null) {
                      handleReservationAction(reservation.id, 'reject', memo);
                    }
                  }}
                  disabled={processingId === reservation.id}
                >
                  거부
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (confirm('입금을 확인하셨나요? 예약을 승인하시겠습니까?')) {
                      handleReservationAction(reservation.id, 'approve', '입금 확인 완료');
                    }
                  }}
                  disabled={processingId === reservation.id}
                >
                  {processingId === reservation.id ? '처리 중...' : '승인'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">✅</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">모든 예약이 처리되었습니다</h3>
            <p className="text-gray-600 mb-4">현재 승인 대기 중인 예약이 없습니다.</p>
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
          <h4 className="font-semibold mb-4">처리 안내</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. 고객의 입금을 확인합니다</p>
            <p>2. 예약 정보를 검토합니다</p>
            <p>3. 승인 또는 거부를 결정합니다</p>
            <p>4. 고객에게 알림이 자동 발송됩니다</p>
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
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm" className="w-full">
                예약 분석 보기
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">통계</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>대기 중인 예약</span>
              <span className="font-semibold text-yellow-600">{reservations.length}건</span>
            </div>
            <div className="flex justify-between">
              <span>총 예상 매출</span>
              <span className="font-semibold text-green-600">
                {formatPrice(reservations.reduce((sum, r) => sum + r.reservation_details.total_amount, 0))}원
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}