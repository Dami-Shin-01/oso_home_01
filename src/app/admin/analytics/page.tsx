'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';

type PeriodOption = 'week' | 'month' | 'quarter' | 'year';

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: 'week', label: '최근 7일' },
  { value: 'month', label: '이번 달' },
  { value: 'quarter', label: '최근 90일' },
  { value: 'year', label: '올해' }
];

interface RecentReservation {
  id: string;
  facility_name: string;
  site_name: string;
  total_amount: number;
  status: string;
  payment_status: string;
  reservation_date: string;
  created_at: string;
}

interface FacilityStat {
  facility_id: string;
  facility_name: string;
  facility_type?: string;
  total_reservations: number;
  total_revenue: number;
  site_count: number;
}

interface AnalyticsPayload {
  analytics: {
    total_reservations: number;
    total_facilities: number;
    total_revenue: number;
    occupancy_rate: number;
    recent_reservations: RecentReservation[];
  };
  period_stats: {
    period: string;
    start_date: string;
    end_date: string;
    confirmed_reservations: number;
    pending_reservations: number;
    cancelled_reservations: number;
    conversion_rate: number;
  };
  facility_stats: FacilityStat[];
  site_stats: {
    total_sites: number;
    reserved_sites_today: number;
    occupancy_rate: number;
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodOption>('month');
  const [reloadKey, setReloadKey] = useState(0);

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

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('인증 토큰을 찾을 수 없습니다.');
        }

        const response = await fetch(`/api/admin/analytics?period=${period}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(errorBody?.error || '분석 데이터를 불러오는데 실패했습니다.');
        }

        const payload = await response.json();
        setAnalytics(payload.data as AnalyticsPayload);
        setError(null);
      } catch (err) {
        console.error('Analytics data fetch error:', err);
        setAnalytics(null);
        setError(err instanceof Error ? err.message : '분석 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (checkAuth()) {
      fetchAnalyticsData();
    }
  }, [router, period, reloadKey]);

  const selectedPeriodLabel = PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? '선택한 기간';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">분석 데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">운영 분석 대시보드</h1>
          <p className="text-gray-600">시설과 예약 현황을 한눈에 확인하세요.</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Link href="/admin">
            <Button variant="outline">대시보드로 돌아가기</Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="mb-6">
          <div className="text-center py-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => setReloadKey((key) => key + 1)} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {!error && !analytics && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">표시할 분석 데이터가 없습니다.</p>
          </div>
        </Card>
      )}

      {analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <p className="text-sm font-medium text-gray-600">전체 예약</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.analytics.total_reservations}건</p>
              <p className="text-xs text-gray-500 mt-2">최근 10건의 예약 내역을 함께 확인하세요.</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(analytics.analytics.total_revenue)}원</p>
              <p className="text-xs text-gray-500 mt-2">{selectedPeriodLabel} 기준 누적 금액</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-gray-600">운영 중인 시설</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.analytics.total_facilities}개</p>
              <p className="text-xs text-gray-500 mt-2">활성화된 시설만 계산합니다.</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-gray-600">평균 점유율</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.analytics.occupancy_rate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">오늘 기준 실제 예약된 사이트 비율</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">기간별 요약</h2>
              <p className="text-sm text-gray-500 mb-4">
                {formatDate(analytics.period_stats.start_date)} ~ {formatDate(analytics.period_stats.end_date)} ({selectedPeriodLabel})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-500">확정 예약</p>
                  <p className="text-xl font-semibold text-gray-900">{analytics.period_stats.confirmed_reservations}건</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-500">대기 중</p>
                  <p className="text-xl font-semibold text-yellow-600">{analytics.period_stats.pending_reservations}건</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-500">취소</p>
                  <p className="text-xl font-semibold text-red-600">{analytics.period_stats.cancelled_reservations}건</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-500">전환율</p>
                  <p className="text-xl font-semibold text-blue-600">{analytics.period_stats.conversion_rate.toFixed(1)}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">사이트 운영 현황</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex justify-between items-center">
                  <span>총 사이트</span>
                  <span className="font-semibold">{analytics.site_stats.total_sites}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>오늘 예약된 사이트</span>
                  <span className="font-semibold text-green-600">{analytics.site_stats.reserved_sites_today}개</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>오늘 점유율</span>
                  <span className="font-semibold text-blue-600">{analytics.site_stats.occupancy_rate.toFixed(1)}%</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">시설별 성과</h2>
              {analytics.facility_stats.length > 0 ? (
                <div className="space-y-4">
                  {analytics.facility_stats.slice(0, 5).map((facility) => (
                    <div key={facility.facility_id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{facility.facility_name}</p>
                        <p className="text-xs text-gray-500">사이트 {facility.site_count}개 · 예약 {facility.total_reservations}건</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">{formatCurrency(facility.total_revenue)}원</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">시설 통계가 없습니다.</p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 예약</h2>
              {analytics.analytics.recent_reservations.length > 0 ? (
                <div className="space-y-3">
                  {analytics.analytics.recent_reservations.map((reservation) => (
                    <div key={reservation.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{reservation.facility_name}</p>
                          <p className="text-sm text-gray-500">{reservation.site_name} · {formatDate(reservation.reservation_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">{formatCurrency(reservation.total_amount)}원</p>
                          <p className="text-xs text-gray-500">{formatDateTime(reservation.created_at)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-2 text-xs">
                        <span className={`px-2 py-1 rounded-full font-medium ${reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : reservation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {reservation.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full font-medium ${reservation.payment_status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : reservation.payment_status === 'WAITING' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                          {reservation.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">최근 예약 내역이 없습니다.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
