'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Card from '@/components/atoms/Card';
import { RESERVATION_STATUS, PAYMENT_STATUS, getTimeSlotLabel } from '@/constants';
import { fetchWithAdminAuth } from '@/lib/admin-fetch';

interface ReservationItem {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_type: 'member' | 'guest';
  facility_name: string;
  site_name: string;
  reservation_date: string;
  time_slots: number[];
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at?: string;
  special_requests?: string | null;
}

interface ReservationsResponse {
  success: boolean;
  data?: {
    reservations?: Array<{
      id: string;
      customer: {
        type: 'member' | 'guest';
        name: string | null;
        email?: string | null;
        phone?: string | null;
      };
      facility: {
        id: string;
        name: string | null;
        type: string | null;
      };
      site: {
        id: string;
        name: string | null;
        site_number: string | null;
      };
      reservation_details: {
        date: string;
        time_slots: number[];
        total_amount: number;
        status: string;
        payment_status: string;
        special_requests?: string | null;
      };
      timestamps: {
        created_at: string;
        updated_at: string;
      };
    }>;
  };
  message?: string;
}

const STATUS_OPTIONS: Array<{ value: 'all' | string; label: string }> = [
  { value: 'all', label: '전체' },
  { value: RESERVATION_STATUS.PENDING, label: '결제 대기' },
  { value: RESERVATION_STATUS.CONFIRMED, label: '예약 확정' },
  { value: RESERVATION_STATUS.CANCELLED, label: '예약 취소' }
];

const PAYMENT_STATUS_TEXT: Record<string, string> = {
  [PAYMENT_STATUS.WAITING]: '결제 대기',
  [PAYMENT_STATUS.COMPLETED]: '결제 완료',
  [PAYMENT_STATUS.REFUNDED]: '환불 완료'
};

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  [PAYMENT_STATUS.WAITING]: 'px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800',
  [PAYMENT_STATUS.COMPLETED]: 'px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700',
  [PAYMENT_STATUS.REFUNDED]: 'px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800'
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatDate(value: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateTime(value?: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusBadge(status: string, paymentStatus: string) {
  if (status === RESERVATION_STATUS.PENDING && paymentStatus === PAYMENT_STATUS.WAITING) {
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">결제 대기</span>;
  }
  if (status === RESERVATION_STATUS.CONFIRMED) {
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">예약 확정</span>;
  }
  if (status === RESERVATION_STATUS.CANCELLED) {
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">예약 취소</span>;
  }
  return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">상태 미정</span>;
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAdminAuth<ReservationsResponse>('/api/admin/reservations/management?limit=100');
      const source = response.data?.reservations ?? [];

      const mapped: ReservationItem[] = source.map((reservation) => ({
        id: reservation.id,
        customer_name: reservation.customer?.name ?? '이름 없음',
        customer_phone: reservation.customer?.phone ?? '-',
        customer_type: reservation.customer?.type ?? 'guest',
        facility_name: reservation.facility?.name ?? '미지정 시설',
        site_name: reservation.site?.name ?? reservation.site?.site_number ?? '-',
        reservation_date: reservation.reservation_details.date,
        time_slots: reservation.reservation_details.time_slots ?? [],
        total_amount: reservation.reservation_details.total_amount ?? 0,
        status: reservation.reservation_details.status,
        payment_status: reservation.reservation_details.payment_status,
        created_at: reservation.timestamps.created_at,
        updated_at: reservation.timestamps.updated_at,
        special_requests: reservation.reservation_details.special_requests ?? null
      }));

      setReservations(mapped);
      setError(null);
    } catch (err) {
      console.error('Reservations fetch error:', err);
      setReservations([]);
      setError(err instanceof Error ? err.message : '예약 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        reservation.customer_name.toLowerCase().includes(keyword) ||
        reservation.customer_phone.replace(/[^0-9]/g, '').includes(keyword.replace(/[^0-9]/g, '')) ||
        reservation.id.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === 'all' || reservation.status === statusFilter;

      const matchesDate =
        !dateFilter || reservation.reservation_date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [reservations, searchTerm, statusFilter, dateFilter]);

  const handleStatusChange = (reservationId: string, newStatus: string) => {
    console.log(`Reservation ${reservationId} status -> ${newStatus}`);
    alert(`Status change not implemented: ${reservationId} -> ${newStatus}`);
  };



  const handleExportExcel = () => {
    alert('Export to Excel not implemented yet.');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">예약 데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">예약 관리</h1>
            <p className="text-gray-600">모든 예약을 조회하고 관리할 수 있습니다.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={fetchReservations}>
              새로고침
            </Button>
            <Link href="/admin">
              <Button variant="outline">대시보드로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <Card className="mb-6">
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchReservations} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Input
            placeholder="고객명, 연락처, 예약번호 검색"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />

          <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter(''); }}>
            필터 초기화
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            총 {filteredReservations.length}건의 예약
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
              결제 대기 {filteredReservations.filter((reservation) => reservation.status === RESERVATION_STATUS.PENDING).length}건
            </span>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
              예약 확정 {filteredReservations.filter((reservation) => reservation.status === RESERVATION_STATUS.CONFIRMED).length}건
            </span>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredReservations.map((reservation) => (
          <Card key={reservation.id} hover>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{reservation.customer_name}</h3>
                    <span className={px-2 py-1 text-xs font-medium rounded-full }>
                      {reservation.customer_type === 'member' ? '회원' : '비회원'}
                    </span>
                    {getStatusBadge(reservation.status, reservation.payment_status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {reservation.id} | {reservation.customer_phone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold">{formatCurrency(reservation.total_amount)}원</p>
                <p className="text-xs text-gray-500">{formatDate(reservation.created_at)} 예약</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-600">시설</span>
                <p className="font-medium">{reservation.facility_name}</p>
                <p className="text-gray-500">{reservation.site_name}</p>
              </div>
              <div>
                <span className="text-gray-600">이용일</span>
                <p className="font-medium">{reservation.reservation_date}</p>
              </div>
              <div>
                <span className="text-gray-600">이용 시간</span>
                <p className="font-medium">
                  {reservation.time_slots.map((slot) => getTimeSlotLabel(slot)).join(', ')}
                </p>
              </div>
              <div>
                <span className="text-gray-600">결제 상태</span>
                <p className="font-medium">
                  <span className={PAYMENT_STATUS_BADGE[reservation.payment_status] ?? PAYMENT_STATUS_BADGE[PAYMENT_STATUS.WAITING]}>
                    {PAYMENT_STATUS_TEXT[reservation.payment_status] ?? reservation.payment_status}
                  </span>
                </p>
              </div>
            </div>

            {reservation.special_requests && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <span className="text-sm text-blue-700 font-medium">특별 요청사항:</span>
                <p className="text-sm text-blue-800">{reservation.special_requests}</p>
              </div>
            )}

            <div className="flex justify-between text-xs text-gray-500 mt-4 border-t pt-2">
              <span>예약 생성: {formatDateTime(reservation.created_at)}</span>
              <span>최종 갱신: {formatDateTime(reservation.updated_at ?? reservation.created_at)}</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Button size="sm" variant="outline">
                상세 보기
              </Button>
              {reservation.status === RESERVATION_STATUS.PENDING && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStatusChange(reservation.id, RESERVATION_STATUS.CONFIRMED)}
                >
                  예약 확정
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => alert('메모 기능은 준비 중입니다.')}
              >
                메모 추가
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleStatusChange(reservation.id, RESERVATION_STATUS.CANCELLED)}
              >
                강제 취소
              </Button>
            </div>
          </Card>
        ))}

        {filteredReservations.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">조건에 맞는 예약이 없습니다.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter(''); }}>
                필터 초기화
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
