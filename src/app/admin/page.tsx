'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { getTimeSlotLabel } from '@/lib/time-slots';

interface DashboardStats {
  monthlyRevenue: number;
  monthlyReservations: number;
  occupancyRate: number;
  conversionRate: number;
}

interface RecentReservation {
  id: string;
  customer_name: string;
  customer_type: 'member' | 'guest';
  contact: string;
  facility_name: string;
  site_name: string;
  reservation_date: string;
  time_slots: number[];
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

interface DashboardTask {
  id: number;
  title: string;
  count: number;
  urgent: boolean;
  type: string;
  description: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [showDbTest, setShowDbTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // 인증 확인 및 데이터 로딩
  useEffect(() => {
    // 로그인 상태 확인
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (!userData || !accessToken) {
        // 로그인되지 않은 경우
        router.push('/login');
        return false;
      }

      const parsedUser = JSON.parse(userData);

      // 관리자 권한 확인
      if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'MANAGER') {
        // 관리자가 아닌 경우
        alert('관리자 권한이 필요합니다.');
        router.push('/');
        return false;
      }

      setUser(parsedUser);
      return true;
    };

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 인증 확인
        if (!checkAuth()) {
          return;
        }

        const accessToken = localStorage.getItem('accessToken');

        // 병렬로 모든 대시보드 데이터 요청
        const [statsRes, reservationsRes, tasksRes] = await Promise.all([
          fetch('/api/admin/dashboard/stats', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          fetch('/api/admin/dashboard/recent-reservations?limit=5', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }),
          fetch('/api/admin/dashboard/tasks', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          })
        ]);

        if (!statsRes.ok) throw new Error('통계 데이터를 가져올 수 없습니다.');
        if (!reservationsRes.ok) throw new Error('예약 데이터를 가져올 수 없습니다.');
        if (!tasksRes.ok) throw new Error('업무 데이터를 가져올 수 없습니다.');

        const [statsData, reservationsData, tasksData] = await Promise.all([
          statsRes.json(),
          reservationsRes.json(),
          tasksRes.json()
        ]);

        setStats(statsData.data);
        setRecentReservations(reservationsData.data.reservations);
        setTasks(tasksData.data.tasks);
        setError(null);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    if (status === 'PENDING' && paymentStatus === 'WAITING') {
      return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">입금 대기</span>;
    }
    switch (status) {
      case 'CONFIRMED':
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">확정</span>;
      case 'PENDING':
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">대기</span>;
      case 'CANCELLED':
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">취소</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">알 수 없음</span>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">대시보드 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h3 className="text-lg font-semibold text-red-600 mb-2">데이터 로딩 오류</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="primary">
              다시 시도
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
          <p className="text-gray-600">오소 바베큐장 운영 현황을 한눈에 확인하세요.</p>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.role === 'ADMIN' ? '관리자' : '매니저'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                router.push('/login');
              }}
            >
              로그아웃
            </Button>
          </div>
        )}
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card hover>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">월간 매출</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.monthlyRevenue.toLocaleString() || 0}원
              </p>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">월간 예약</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.monthlyReservations || 0}건</p>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">오늘 가동률</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.occupancyRate || 0}%</p>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">예약 확정률</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.conversionRate || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 최근 예약 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">최근 예약</h3>
              <Link href="/admin/reservations">
                <Button variant="outline" size="sm">
                  전체 보기
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {recentReservations.length > 0 ? (
                recentReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{reservation.customer_name}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            reservation.customer_type === 'member'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {reservation.customer_type === 'member' ? '회원' : '비회원'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {reservation.facility_name} | {reservation.reservation_date}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reservation.time_slots.map(slot => getTimeSlotLabel(slot)).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="font-semibold">
                          {reservation.total_amount.toLocaleString()}원
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(reservation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(reservation.status, reservation.payment_status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  최근 예약이 없습니다.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 업무 목록 */}
        <div>
          <Card>
            <h3 className="text-lg font-semibold mb-6">오늘의 업무</h3>
            
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      {task.urgent && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.description}</p>
                        {task.count > 0 && (
                          <p className="text-xs text-gray-600 font-medium">{task.count}건</p>
                        )}
                      </div>
                    </div>

                    <Link href={`/admin/${task.type.replace('_', '-')}`} className="text-blue-600 hover:text-blue-800 text-sm">
                      처리
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  처리할 업무가 없습니다.
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button className="w-full" variant="outline">
                모든 업무 보기
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-semibold mb-6">빠른 액션</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Link href="/admin/reservations">
              <div className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl mb-2 block">📋</span>
                <p className="text-sm font-medium">예약 관리</p>
              </div>
            </Link>

            <Link href="/admin/content">
              <div className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl mb-2 block">📝</span>
                <p className="text-sm font-medium">콘텐츠 관리</p>
              </div>
            </Link>

            <Link href="/admin/facilities">
              <div className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl mb-2 block">🏢</span>
                <p className="text-sm font-medium">시설 관리</p>
              </div>
            </Link>

            <Link href="/admin/users">
              <div className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl mb-2 block">👥</span>
                <p className="text-sm font-medium">회원 관리</p>
              </div>
            </Link>

            <Link href="/admin/environment">
              <div className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl mb-2 block">⚙️</span>
                <p className="text-sm font-medium">환경변수 설정</p>
              </div>
            </Link>

            <button
              onClick={() => setShowDbTest(!showDbTest)}
              className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mb-2 block">🔧</span>
              <p className="text-sm font-medium">DB 테스트</p>
            </button>
          </div>
        </Card>
      </div>

      {/* DB 테스트 섹션 */}
      {showDbTest && (
        <div className="mt-8">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">데이터베이스 연결 테스트</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDbTest(false)}
              >
                닫기
              </Button>
            </div>
            
            <div className="mb-4">
              <Link href="/test-db">
                <Button className="mr-4">
                  전체 DB 테스트 실행
                </Button>
              </Link>
              <Link href="/test-connection">
                <Button variant="outline">
                  연결 테스트만 실행
                </Button>
              </Link>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">테스트 설명</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>전체 DB 테스트:</strong> 모든 테이블 존재 여부와 데이터 샘플 확인</li>
                <li>• <strong>연결 테스트:</strong> Supabase 연결 상태만 간단히 확인</li>
                <li>• 테스트 결과는 새 탭에서 확인할 수 있습니다</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* 실시간 업데이트 알림 */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            <p className="text-green-800 font-medium">
              실시간 데이터 연동 완료! 모든 통계와 예약 현황이 실제 데이터베이스와 동기화됩니다.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
}