'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';

interface TodayReservation {
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

interface FacilityStatus {
  facility_id: string;
  facility_name: string;
  facility_type: string;
  total_sites: number;
  occupied_sites: number;
  occupancy_rate: number;
  reservations: TodayReservation[];
}

export default function TodayReservationsPage() {
  const router = useRouter();
  const [todayReservations, setTodayReservations] = useState<TodayReservation[]>([]);
  const [facilityStatus, setFacilityStatus] = useState<FacilityStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'all' | 1 | 2 | 3>('all');
  const [selectedFacility, setSelectedFacility] = useState<'all' | string>('all');

  const today = new Date().toISOString().split('T')[0];

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

    fetchTodayReservations();
  }, [router]);

  const fetchTodayReservations = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`/api/admin/reservations/management?date=${today}&status=CONFIRMED`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTodayReservations(data.data.reservations || []);
      } else {
        // 샘플 데이터
        const sampleReservations: TodayReservation[] = [
          {
            id: 'today-1',
            customer: {
              type: 'member',
              name: '김가족',
              phone: '010-1111-2222',
              email: 'family@example.com'
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
              date: today,
              time_slots: [1],
              total_amount: 90000,
              status: 'CONFIRMED',
              payment_status: 'COMPLETED',
              special_requests: '어린이 의자 2개 준비 부탁드립니다.'
            },
            timestamps: {
              created_at: '2025-09-15T09:00:00Z',
              updated_at: '2025-09-16T10:00:00Z'
            }
          },
          {
            id: 'today-2',
            customer: {
              type: 'guest',
              name: '박커플',
              phone: '010-3333-4444'
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
              date: today,
              time_slots: [2],
              total_amount: 110000,
              status: 'CONFIRMED',
              payment_status: 'COMPLETED',
              special_requests: '로맨틱한 분위기로 준비해주세요.'
            },
            timestamps: {
              created_at: '2025-09-16T14:30:00Z',
              updated_at: '2025-09-16T15:00:00Z'
            }
          },
          {
            id: 'today-3',
            customer: {
              type: 'member',
              name: '이회사',
              phone: '010-5555-6666',
              email: 'company@example.com'
            },
            facility: {
              id: 'facility-1',
              name: '프라이빗룸 A',
              type: 'private'
            },
            site: {
              id: 'site-3',
              name: '프라이빗룸 A - 사이트 3',
              site_number: 'private-3',
              capacity: 6
            },
            reservation_details: {
              date: today,
              time_slots: [3],
              total_amount: 95000,
              status: 'CONFIRMED',
              payment_status: 'COMPLETED',
              special_requests: '회사 워크샵용 프로젝터 대여 가능한가요?'
            },
            timestamps: {
              created_at: '2025-09-14T11:20:00Z',
              updated_at: '2025-09-16T09:15:00Z'
            }
          },
          {
            id: 'today-4',
            customer: {
              type: 'guest',
              name: '최친구들',
              phone: '010-7777-8888'
            },
            facility: {
              id: 'facility-3',
              name: '야외 소파테이블 C',
              type: 'outdoor_sofa'
            },
            site: {
              id: 'site-4',
              name: '야외 소파테이블 C - 사이트 2',
              site_number: 'outdoor-2',
              capacity: 4
            },
            reservation_details: {
              date: today,
              time_slots: [2, 3],
              total_amount: 80000,
              status: 'CONFIRMED',
              payment_status: 'COMPLETED'
            },
            timestamps: {
              created_at: '2025-09-16T16:45:00Z',
              updated_at: '2025-09-16T17:00:00Z'
            }
          }
        ];
        setTodayReservations(sampleReservations);

        // 시설별 현황 계산
        const facilityMap = new Map<string, FacilityStatus>();

        sampleReservations.forEach(reservation => {
          const facilityId = reservation.facility.id;
          if (!facilityMap.has(facilityId)) {
            facilityMap.set(facilityId, {
              facility_id: facilityId,
              facility_name: reservation.facility.name,
              facility_type: reservation.facility.type,
              total_sites: 3, // 임시값
              occupied_sites: 0,
              occupancy_rate: 0,
              reservations: []
            });
          }

          const facility = facilityMap.get(facilityId)!;
          facility.reservations.push(reservation);
          facility.occupied_sites = new Set(facility.reservations.map(r => r.site.id)).size;
          facility.occupancy_rate = Math.round((facility.occupied_sites / facility.total_sites) * 100);
        });

        setFacilityStatus(Array.from(facilityMap.values()));
      }

      setError(null);
    } catch (err) {
      console.error('Today reservations fetch error:', err);
      setError('오늘 예약 현황을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSlotColor = (slot: number) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-purple-100 text-purple-800'
    };
    return colors[slot as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredReservations = todayReservations.filter(reservation => {
    const timeSlotMatch = selectedTimeSlot === 'all' || reservation.reservation_details.time_slots.includes(selectedTimeSlot);
    const facilityMatch = selectedFacility === 'all' || reservation.facility.id === selectedFacility;
    return timeSlotMatch && facilityMatch;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">오늘 예약 현황을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">오늘 예약 현황 점검</h1>
          <p className="text-gray-600">
            {new Date(today).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 예약 현황을 확인하고 시설을 준비하세요.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchTodayReservations} variant="outline" disabled={loading}>
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
            <Button onClick={fetchTodayReservations} variant="outline" className="mt-2">
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {/* 시설별 현황 개요 */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {facilityStatus.map((facility) => (
          <Card key={facility.facility_id} className="p-4">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-2">{facility.facility_name}</h4>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {facility.occupancy_rate}%
              </div>
              <p className="text-sm text-gray-600">
                {facility.occupied_sites}/{facility.total_sites} 사용 중
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${facility.occupancy_rate}%` }}
                ></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 필터 및 통계 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Card className="flex-1 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📅</span>
            <div>
              <h3 className="font-semibold text-blue-800">오늘 예약: {filteredReservations.length}건</h3>
              <p className="text-blue-700 text-sm">총 매출: {formatPrice(filteredReservations.reduce((sum, r) => sum + r.reservation_details.total_amount, 0))}원</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">시간대:</label>
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as 1 | 2 | 3)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">전체</option>
                <option value={1}>1부 (11:00-15:00)</option>
                <option value={2}>2부 (15:00-19:00)</option>
                <option value={3}>3부 (19:00-23:00)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">시설:</label>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">전체</option>
                {facilityStatus.map((facility) => (
                  <option key={facility.facility_id} value={facility.facility_id}>
                    {facility.facility_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* 예약 목록 */}
      {filteredReservations.length > 0 ? (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id} className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* 시간대 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">시간대</p>
                    <div className="space-y-1">
                      {reservation.reservation_details.time_slots.map((slot) => (
                        <span
                          key={slot}
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${getTimeSlotColor(slot)}`}
                        >
                          {slot}부
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 고객 정보 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">고객</p>
                    <p className="font-semibold">{reservation.customer.name}</p>
                    <p className="text-sm text-gray-600">{reservation.customer.phone}</p>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      {reservation.customer.type === 'member' ? '회원' : '비회원'}
                    </span>
                  </div>

                  {/* 시설 정보 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">시설</p>
                    <p className="font-semibold">{reservation.facility.name}</p>
                    <p className="text-sm text-gray-600">{reservation.site.name}</p>
                    <p className="text-xs text-gray-500">최대 {reservation.site.capacity}명</p>
                  </div>

                  {/* 금액 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">결제 금액</p>
                    <p className="font-bold text-green-600">{formatPrice(reservation.reservation_details.total_amount)}원</p>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      결제 완료
                    </span>
                  </div>
                </div>

                {/* 특별 요청사항 */}
                {reservation.reservation_details.special_requests && (
                  <div className="lg:w-1/3">
                    <p className="text-xs text-gray-500 mb-1">특별 요청사항</p>
                    <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
                      {reservation.reservation_details.special_requests}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🎉</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">예약이 없습니다</h3>
            <p className="text-gray-600 mb-4">
              {selectedTimeSlot !== 'all' || selectedFacility !== 'all'
                ? '선택한 조건에 맞는 예약이 없습니다.'
                : '오늘은 예약이 없는 날입니다.'}
            </p>
            <div className="flex justify-center space-x-2">
              <Button onClick={() => {
                setSelectedTimeSlot('all');
                setSelectedFacility('all');
              }} variant="outline">
                필터 초기화
              </Button>
              <Link href="/admin/reservations">
                <Button variant="primary">
                  예약 관리로 이동
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* 하단 유용한 정보 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h4 className="font-semibold mb-4">시설 준비 체크리스트</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>□ 테이블 및 의자 정리</p>
            <p>□ 바베큐 그릴 점검 및 청소</p>
            <p>□ 조미료 및 기본 도구 비치</p>
            <p>□ 화장실 및 세면대 점검</p>
            <p>□ 주차장 정리</p>
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold mb-4">시간대별 예약 현황</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>1부 (11:00-15:00)</span>
              <span className="font-semibold text-blue-600">
                {todayReservations.filter(r => r.reservation_details.time_slots.includes(1)).length}건
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>2부 (15:00-19:00)</span>
              <span className="font-semibold text-green-600">
                {todayReservations.filter(r => r.reservation_details.time_slots.includes(2)).length}건
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>3부 (19:00-23:00)</span>
              <span className="font-semibold text-purple-600">
                {todayReservations.filter(r => r.reservation_details.time_slots.includes(3)).length}건
              </span>
            </div>
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
            <Link href="/admin/facilities">
              <Button variant="outline" size="sm" className="w-full">
                시설 관리
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm" className="w-full">
                상세 분석 보기
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}