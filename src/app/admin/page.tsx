'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';

// 임시 데이터 - 추후 실제 API로 대체
const mockStats = {
  monthlyRevenue: 4580000,
  monthlyReservations: 87,
  occupancyRate: 73.2,
  conversionRate: 12.8
};

const mockRecentReservations = [
  {
    id: 'RES001',
    guest_name: '김철수',
    facility: '프라이빗룸 A',
    date: '2024-09-20',
    amount: 90000,
    status: 'confirmed'
  },
  {
    id: 'RES002',
    guest_name: '박영희',
    facility: '텐트동 B',
    date: '2024-09-21',
    amount: 120000,
    status: 'pending'
  },
  {
    id: 'RES003',
    guest_name: '이민수',
    facility: 'VIP동',
    date: '2024-09-22',
    amount: 150000,
    status: 'pending'
  }
];

const mockTasks = [
  { id: 1, title: '신규 예약 승인 대기', count: 5, urgent: true },
  { id: 2, title: '취소 요청 처리', count: 2, urgent: true },
  { id: 3, title: '시설 점검 일정', count: 1, urgent: false },
  { id: 4, title: '공지사항 업데이트', count: 3, urgent: false }
];

export default function AdminDashboard() {
  const [stats] = useState(mockStats);
  const [recentReservations] = useState(mockRecentReservations);
  const [tasks] = useState(mockTasks);
  const [showDbTest, setShowDbTest] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">확정</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">대기</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">취소</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">알 수 없음</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
        <p className="text-gray-600">오소 바베큐장 운영 현황을 한눈에 확인하세요.</p>
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
                {stats.monthlyRevenue.toLocaleString()}원
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
              <p className="text-2xl font-semibold text-gray-900">{stats.monthlyReservations}건</p>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">가동률</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.occupancyRate}%</p>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전환율</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.conversionRate}%</p>
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
              {recentReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-semibold">{reservation.guest_name}</p>
                      <p className="text-sm text-gray-600">
                        {reservation.facility} | {reservation.date}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold">
                      {reservation.amount.toLocaleString()}원
                    </span>
                    {getStatusBadge(reservation.status)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 업무 목록 */}
        <div>
          <Card>
            <h3 className="text-lg font-semibold mb-6">오늘의 업무</h3>
            
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {task.urgent && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.count > 0 && (
                        <p className="text-xs text-gray-600">{task.count}건</p>
                      )}
                    </div>
                  </div>
                  
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    처리
                  </button>
                </div>
              ))}
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
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

      {/* 임시 알림 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-blue-500 mr-2">ℹ️</span>
          <p className="text-blue-800 font-medium">
            관리자 기능이 구현 중입니다. 현재는 데모 데이터를 표시하고 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}