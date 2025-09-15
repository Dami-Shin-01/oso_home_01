'use client';

import { useState } from 'react';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Card from '@/components/atoms/Card';
import { RESERVATION_STATUS, PAYMENT_STATUS, getTimeSlotLabel } from '@/constants';

// 임시 데이터
const mockReservations = [
  {
    id: 'RES001',
    guest_name: '김철수',
    guest_phone: '010-1234-5678',
    facility_name: '프라이빗룸 A',
    site_name: 'A-1',
    reservation_date: '2024-09-20',
    time_slots: [2],
    total_amount: 90000,
    status: RESERVATION_STATUS.CONFIRMED,
    payment_status: PAYMENT_STATUS.COMPLETED,
    created_at: '2024-09-10T10:30:00Z',
    special_requests: '생일 파티용 테이블 세팅 요청'
  },
  {
    id: 'RES002',
    guest_name: '박영희',
    guest_phone: '010-2345-6789',
    facility_name: '텐트동 B',
    site_name: 'B-3',
    reservation_date: '2024-09-21',
    time_slots: [1, 2],
    total_amount: 150000,
    status: RESERVATION_STATUS.PENDING,
    payment_status: PAYMENT_STATUS.WAITING,
    created_at: '2024-09-11T14:20:00Z',
    special_requests: null
  },
  {
    id: 'RES003',
    guest_name: '이민수',
    guest_phone: '010-3456-7890',
    facility_name: 'VIP동',
    site_name: 'VIP-1',
    reservation_date: '2024-09-22',
    time_slots: [3],
    total_amount: 120000,
    status: RESERVATION_STATUS.PENDING,
    payment_status: PAYMENT_STATUS.WAITING,
    created_at: '2024-09-11T16:45:00Z',
    special_requests: '반려동물 동반 예정'
  }
];

export default function AdminReservationsPage() {
  const [reservations] = useState(mockReservations);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  // 필터링
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.guest_phone.includes(searchTerm) ||
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    const matchesDate = !dateFilter || reservation.reservation_date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const handleStatusChange = (reservationId: string, newStatus: string) => {
    console.log(`예약 ${reservationId}의 상태를 ${newStatus}로 변경`);
    alert(`예약 상태 변경 기능 구현 예정: ${reservationId} -> ${newStatus}`);
  };

  const handleExportExcel = () => {
    alert('엑셀 다운로드 기능 구현 예정');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">예약 관리</h1>
        <p className="text-gray-600">모든 예약을 조회하고 관리할 수 있습니다.</p>
      </div>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Input
            placeholder="예약자명, 연락처, 예약번호 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">전체 상태</option>
            <option value={RESERVATION_STATUS.PENDING}>입금 대기</option>
            <option value={RESERVATION_STATUS.CONFIRMED}>예약 확정</option>
            <option value={RESERVATION_STATUS.CANCELLED}>취소됨</option>
          </select>
          
          <Input
            type="date"
            placeholder="이용일 필터"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          
          <Button onClick={handleExportExcel} variant="outlined">
            📊 엑셀 다운로드
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            총 {filteredReservations.length}건의 예약
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
              입금 대기: {filteredReservations.filter(r => r.status === RESERVATION_STATUS.PENDING).length}건
            </span>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
              확정: {filteredReservations.filter(r => r.status === RESERVATION_STATUS.CONFIRMED).length}건
            </span>
          </div>
        </div>
      </Card>

      {/* 예약 목록 */}
      <div className="space-y-4">
        {filteredReservations.map((reservation) => (
          <Card key={reservation.id} hover>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{reservation.guest_name}</h3>
                    {getStatusBadge(reservation.status, reservation.payment_status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {reservation.id} | {reservation.guest_phone}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {reservation.total_amount.toLocaleString()}원
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(reservation.created_at).toLocaleDateString()} 예약
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-600">시설:</span>
                <p className="font-medium">{reservation.facility_name}</p>
                <p className="text-gray-500">{reservation.site_name}</p>
              </div>
              <div>
                <span className="text-gray-600">이용일:</span>
                <p className="font-medium">{reservation.reservation_date}</p>
              </div>
              <div>
                <span className="text-gray-600">시간:</span>
                <p className="font-medium">
                  {reservation.time_slots.map(slot => getTimeSlotLabel(slot)).join(', ')}
                </p>
              </div>
              <div>
                <span className="text-gray-600">결제 상태:</span>
                <p className="font-medium">
                  {reservation.payment_status === PAYMENT_STATUS.WAITING ? '입금 대기' : '결제 완료'}
                </p>
              </div>
            </div>

            {reservation.special_requests && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <span className="text-sm text-blue-700 font-medium">특별 요청사항:</span>
                <p className="text-sm text-blue-800">{reservation.special_requests}</p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button size="small" variant="outlined">
                상세 보기
              </Button>
              
              {reservation.status === RESERVATION_STATUS.PENDING && (
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => handleStatusChange(reservation.id, RESERVATION_STATUS.CONFIRMED)}
                >
                  예약 확정
                </Button>
              )}
              
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => alert('메모 추가 기능 구현 예정')}
              >
                메모 추가
              </Button>
              
              <Button 
                size="small" 
                variant="contained"
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
              <Button variant="outlined" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('');
              }}>
                필터 초기화
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}