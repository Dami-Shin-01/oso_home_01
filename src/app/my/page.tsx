'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { RESERVATION_STATUS, PAYMENT_STATUS } from '@/constants';
import { getTimeSlotConfig } from '@/lib/time-slots';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  customer_profiles?: {
    address?: string;
    marketing_consent: boolean;
    preferred_contact?: string;
    notes?: string;
  }[];
}

interface Reservation {
  id: string;
  facility_id: string;
  site_id: string;
  reservation_date: string;
  time_slots: number[];
  total_amount: number;
  status: string;
  special_requests?: string;
  created_at: string;
  facilities?: {
    name: string;
    type: string;
  };
  sites?: {
    name: string;
    type: string;
  };
  reservation_payments?: {
    payment_method: string;
    amount: number;
    status: string;
  }[];
}

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [timeSlotTexts, setTimeSlotTexts] = useState<Record<string, string>>({});
  const { user } = useAuth();

  // 데이터 로드
  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/customer/reservations');
      const result = await response.json();

      if (response.ok && result.success) {
        const reservationData = result.data.reservations || [];
        setReservations(reservationData);

        // Pre-calculate time slot texts (N+1 prevention)
        if (reservationData.length > 0) {
          const config = await getTimeSlotConfig();
          const texts: Record<string, string> = {};

          reservationData.forEach((reservation: Reservation) => {
            const labels = reservation.time_slots.map(id => {
              const slot = config[id];
              return slot ? `${slot.name} (${slot.time})` : `${id}부`;
            });
            texts[reservation.id] = labels.join(', ');
          });

          setTimeSlotTexts(texts);
        }
      } else {
        console.error('Reservations fetch failed:', result.error);
      }
    } catch (error) {
      console.error('Reservations fetch error:', error);
    } finally {
      setReservationsLoading(false);
    }
  };


  // 예약 필터링
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingReservations = reservations.filter(r => {
    const reservationDate = new Date(r.reservation_date);
    reservationDate.setHours(0, 0, 0, 0);
    return reservationDate >= today;
  });

  const pastReservations = reservations.filter(r => {
    const reservationDate = new Date(r.reservation_date);
    reservationDate.setHours(0, 0, 0, 0);
    return reservationDate < today;
  });

  // 예약 취소 핸들러
  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('정말로 이 예약을 취소하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/customer/reservations/${reservationId}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (response.ok && result.success) {
        alert(result.message || '예약이 취소되었습니다.');
        await fetchReservations(); // 목록 새로고침
      } else {
        alert(result.error?.message || '예약 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string, reservation: Reservation) => {
    const paymentStatus = reservation.reservation_payments?.[0]?.status;

    if (status === 'PENDING') {
      return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">입금 대기</span>;
    }
    if (status === 'CONFIRMED') {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">예약 확정</span>;
    }
    if (status === 'CANCELLED') {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">취소됨</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">알 수 없음</span>;
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center">
            <p>사용자 정보를 불러오고 있습니다...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
                <span className="text-gray-600">이메일:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 예약:</span>
                <span className="font-medium">{reservations.length}건</span>
              </div>
              {user.customer_profiles?.[0]?.address && (
                <div className="flex justify-between">
                  <span className="text-gray-600">주소:</span>
                  <span className="font-medium text-xs">{user.customer_profiles[0].address}</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <Link href="/my/profile/edit">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  회원정보 수정
                </Button>
              </Link>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (confirm('정말로 회원탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    alert('회원탈퇴 기능은 고객센터를 통해 진행해주세요.');
                  }
                }}
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
              {reservationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="text-center">
                    <div className="loading loading-spinner loading-md mb-2"></div>
                    <p className="text-gray-600">예약 내역을 불러오는 중...</p>
                  </div>
                </div>
              ) : (
                (activeTab === 'upcoming' ? upcomingReservations : pastReservations).map((reservation) => (
                  <div key={reservation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">
                            {reservation.facilities?.name || '시설명 없음'}
                          </h4>
                          {getStatusBadge(reservation.status, reservation)}
                        </div>
                        <p className="text-gray-600 text-sm">예약번호: {reservation.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {reservation.total_amount.toLocaleString()}원
                        </p>
                        <p className="text-gray-500 text-sm">
                          {new Date(reservation.created_at).toLocaleDateString()} 예약
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
                          {timeSlotTexts[reservation.id] || '시간대 로딩 중...'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">장소:</span>
                        <p className="font-medium">{reservation.sites?.name || '사이트명 없음'}</p>
                      </div>
                    </div>

                    {/* 특별 요청사항 */}
                    {reservation.special_requests && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <span className="text-gray-600">특별 요청사항: </span>
                        <span className="text-gray-800">{reservation.special_requests}</span>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/my/reservations/${reservation.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        상세 보기
                      </Link>

                      {activeTab === 'upcoming' && reservation.status !== 'CANCELLED' && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => {
                              const reservationDate = new Date(reservation.reservation_date);
                              const today = new Date();
                              const diffDays = Math.ceil((reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                              if (diffDays <= 1) {
                                alert('예약일 당일 및 이후에는 취소할 수 없습니다.');
                                return;
                              }

                              handleCancelReservation(reservation.id);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            예약 취소
                          </button>
                        </>
                      )}

                      {activeTab === 'upcoming' && reservation.status === 'PENDING' && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => {
                              const paymentInfo = reservation.reservation_payments?.[0];
                              if (paymentInfo) {
                                alert(`입금 안내\n\n계좌: ${process.env.NEXT_PUBLIC_BANK_ACCOUNT || '문의 바랍니다'}\n금액: ${paymentInfo.amount.toLocaleString()}원\n\n입금 확인 후 예약이 확정됩니다.`);
                              } else {
                                alert('결제 정보를 찾을 수 없습니다.');
                              }
                            }}
                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                          >
                            입금 안내
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}

              {!reservationsLoading && (activeTab === 'upcoming' ? upcomingReservations : pastReservations).length === 0 && (
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
    </ProtectedRoute>
  );
}