'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { RESERVATION_STATUS, PAYMENT_STATUS, TIME_SLOT_LABELS } from '@/constants';

// 임시 데이터 - 추후 실제 API로 대체
const mockUser = {
  id: '1',
  name: '홍길동',
  email: 'hong@example.com',
  phone: '010-1234-5678',
  created_at: '2024-08-15'
};

const mockReservations = [
  {
    id: 'RES001',
    facility_name: '프라이빗룸 A',
    site_name: 'A-1',
    reservation_date: '2024-09-20',
    time_slots: [2],
    total_amount: 90000,
    status: RESERVATION_STATUS.CONFIRMED,
    payment_status: PAYMENT_STATUS.COMPLETED,
    created_at: '2024-09-10'
  },
  {
    id: 'RES002', 
    facility_name: '텐트동 B',
    site_name: 'B-3',
    reservation_date: '2024-09-25',
    time_slots: [1, 2],
    total_amount: 150000,
    status: RESERVATION_STATUS.PENDING,
    payment_status: PAYMENT_STATUS.WAITING,
    created_at: '2024-09-11'
  },
  {
    id: 'RES003',
    facility_name: 'VIP동',
    site_name: 'VIP-1',
    reservation_date: '2024-08-15',
    time_slots: [3],
    total_amount: 120000,
    status: RESERVATION_STATUS.CONFIRMED,
    payment_status: PAYMENT_STATUS.COMPLETED,
    created_at: '2024-08-10'
  }
];

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [user] = useState(mockUser);
  const [reservations] = useState(mockReservations);

  // 예약 필터링
  const today = new Date();
  const upcomingReservations = reservations.filter(
    r => new Date(r.reservation_date) >= today
  );
  const pastReservations = reservations.filter(
    r => new Date(r.reservation_date) < today
  );

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === RESERVATION_STATUS.PENDING && paymentStatus === PAYMENT_STATUS.WAITING) {
      return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">입금 대기</span>;
    }
    if (status === RESERVATION_STATUS.CONFIRMED) {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">예약 확정</span>;
    }
    if (status === RESERVATION_STATUS.CANCELLED) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">취소됨</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">알 수 없음</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">마이페이지</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 사용자 정보 */}
        <div className="lg:col-span-1">
          <Card>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">
                  {user.name.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">연락처:</span>
                <span className="font-medium">{user.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">가입일:</span>
                <span className="font-medium">{user.created_at}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 예약:</span>
                <span className="font-medium">{reservations.length}건</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => alert('회원정보 수정 기능 구현 예정')}
              >
                회원정보 수정
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => alert('회원탈퇴 기능 구현 예정')}
              >
                회원탈퇴
              </Button>
            </div>
          </Card>
        </div>

        {/* 예약 내역 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">나의 예약 내역</h3>
              
              {/* 탭 */}
              <div className="border-b">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'upcoming'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    다가오는 예약 ({upcomingReservations.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('past')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'past'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    지난 예약 ({pastReservations.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* 예약 목록 */}
            <div className="space-y-4">
              {(activeTab === 'upcoming' ? upcomingReservations : pastReservations).map((reservation) => (
                <div key={reservation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg">{reservation.facility_name}</h4>
                        {getStatusBadge(reservation.status, reservation.payment_status)}
                      </div>
                      <p className="text-gray-600 text-sm">예약번호: {reservation.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {reservation.total_amount.toLocaleString()}원
                      </p>
                      <p className="text-gray-500 text-sm">
                        {reservation.created_at} 예약
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">이용일:</span>
                      <p className="font-medium">{reservation.reservation_date}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">시간:</span>
                      <p className="font-medium">
                        {reservation.time_slots.map(slot => TIME_SLOT_LABELS[slot]).join(', ')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">장소:</span>
                      <p className="font-medium">{reservation.site_name}</p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/my/reservations/${reservation.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      상세 보기
                    </Link>
                    
                    {activeTab === 'upcoming' && reservation.status === RESERVATION_STATUS.CONFIRMED && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => alert('예약 변경 기능 구현 예정')}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          예약 변경
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => alert('예약 취소 기능 구현 예정')}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          취소 문의
                        </button>
                      </>
                    )}

                    {activeTab === 'upcoming' && reservation.status === RESERVATION_STATUS.PENDING && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => alert('입금 안내 확인')}
                          className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        >
                          입금 안내
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {(activeTab === 'upcoming' ? upcomingReservations : pastReservations).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    {activeTab === 'upcoming' ? '다가오는 예약이' : '지난 예약이'} 없습니다.
                  </p>
                  <Link href="/reservation">
                    <Button variant="primary">
                      지금 예약하기
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}