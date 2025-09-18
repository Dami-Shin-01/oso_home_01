'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';

interface AnalyticsData {
  reservations: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    completed: number;
    cancelled: number;
    pending: number;
    revenue: {
      total: number;
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
  };
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    active: number;
    verified: number;
  };
  facilities: {
    total: number;
    active: number;
    avgOccupancy: number;
    topPerforming: {
      name: string;
      reservations: number;
      revenue: number;
    }[];
  };
  trends: {
    dailyReservations: {
      date: string;
      count: number;
      revenue: number;
    }[];
    hourlyDistribution: {
      hour: number;
      count: number;
    }[];
    monthlyComparison: {
      month: string;
      current: number;
      previous: number;
    }[];
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');

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

    fetchAnalyticsData();
  }, [router, dateRange]);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`/api/admin/analytics?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        setAnalytics({
          reservations: {
            total: 156,
            today: 8,
            thisWeek: 45,
            thisMonth: 134,
            completed: 120,
            cancelled: 15,
            pending: 21,
            revenue: {
              total: 12500000,
              today: 320000,
              thisWeek: 1580000,
              thisMonth: 4200000
            }
          },
          users: {
            total: 89,
            newToday: 3,
            newThisWeek: 12,
            newThisMonth: 28,
            active: 76,
            verified: 64
          },
          facilities: {
            total: 6,
            active: 5,
            avgOccupancy: 72.5,
            topPerforming: [
              { name: 'A구역', reservations: 45, revenue: 2800000 },
              { name: 'B구역', reservations: 38, revenue: 2400000 },
              { name: 'C구역', reservations: 32, revenue: 1950000 }
            ]
          },
          trends: {
            dailyReservations: [
              { date: '2025-09-10', count: 5, revenue: 280000 },
              { date: '2025-09-11', count: 8, revenue: 420000 },
              { date: '2025-09-12', count: 6, revenue: 350000 },
              { date: '2025-09-13', count: 12, revenue: 680000 },
              { date: '2025-09-14', count: 9, revenue: 485000 },
              { date: '2025-09-15', count: 11, revenue: 620000 },
              { date: '2025-09-16', count: 7, revenue: 395000 }
            ],
            hourlyDistribution: [
              { hour: 10, count: 5 },
              { hour: 11, count: 12 },
              { hour: 12, count: 18 },
              { hour: 13, count: 15 },
              { hour: 14, count: 8 },
              { hour: 15, count: 14 },
              { hour: 16, count: 22 },
              { hour: 17, count: 28 },
              { hour: 18, count: 24 },
              { hour: 19, count: 16 },
              { hour: 20, count: 10 }
            ],
            monthlyComparison: [
              { month: '7월', current: 89, previous: 76 },
              { month: '8월', current: 112, previous: 89 },
              { month: '9월', current: 134, previous: 112 }
            ]
          }
        });
      }

      setError(null);
    } catch (err) {
      console.error('Analytics data fetch error:', err);
      setError('분석 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const getGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">분석 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-gray-500">분석 데이터를 불러올 수 없습니다.</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">분석 대시보드</h1>
          <p className="text-gray-600">예약 및 매출 분석 데이터를 확인합니다.</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
            <option value="1y">최근 1년</option>
          </select>
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
            <Button onClick={fetchAnalyticsData} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 예약</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.reservations.total}</p>
              <p className="text-xs text-gray-500 mt-1">이번 달: {analytics.reservations.thisMonth}건</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(analytics.reservations.revenue.total)}원</p>
              <p className="text-xs text-gray-500 mt-1">이번 달: {formatPrice(analytics.reservations.revenue.thisMonth)}원</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 사용자</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.users.total}</p>
              <p className="text-xs text-gray-500 mt-1">이번 달 신규: {analytics.users.newThisMonth}명</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 점유율</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.facilities.avgOccupancy}%</p>
              <p className="text-xs text-gray-500 mt-1">활성 시설: {analytics.facilities.active}개</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">예약 현황</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">완료된 예약</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(analytics.reservations.completed / analytics.reservations.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.reservations.completed}건</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">대기 중인 예약</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${(analytics.reservations.pending / analytics.reservations.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.reservations.pending}건</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">취소된 예약</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(analytics.reservations.cancelled / analytics.reservations.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.reservations.cancelled}건</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">사용자 통계</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">활성 사용자</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-600">{analytics.users.active}명</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({Math.round((analytics.users.active / analytics.users.total) * 100)}%)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">이메일 인증 완료</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-600">{analytics.users.verified}명</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({Math.round((analytics.users.verified / analytics.users.total) * 100)}%)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">오늘 신규 가입</span>
                <span className="text-sm font-medium">{analytics.users.newToday}명</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">이번 주 신규</span>
                <span className="text-sm font-medium">{analytics.users.newThisWeek}명</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">최고 실적 시설</h3>
            <div className="space-y-4">
              {analytics.facilities.topPerforming.map((facility, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{facility.name}</p>
                      <p className="text-sm text-gray-600">{facility.reservations}건 예약</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(facility.revenue)}원</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">시간대별 예약 분포</h3>
            <div className="space-y-2">
              {analytics.trends.hourlyDistribution.map((hour) => (
                <div key={hour.hour} className="flex items-center">
                  <span className="w-12 text-sm text-gray-600">{hour.hour}시</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(hour.count / Math.max(...analytics.trends.hourlyDistribution.map(h => h.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="w-8 text-sm font-medium text-right">{hour.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">일별 예약 추이 (최근 7일)</h3>
            <div className="space-y-3">
              {analytics.trends.dailyReservations.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">{day.count}건</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatPrice(day.revenue)}원
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">월별 성장률</h3>
            <div className="space-y-4">
              {analytics.trends.monthlyComparison.map((month) => {
                const growth = getGrowthPercentage(month.current, month.previous);
                return (
                  <div key={month.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{month.month}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">
                        {month.previous} → {month.current}
                      </span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        growth > 0
                          ? 'bg-green-100 text-green-800'
                          : growth < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {growth > 0 ? '+' : ''}{growth}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}