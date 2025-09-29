'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/components/molecules/Calendar';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Card from '@/components/atoms/Card';
import { useAuth } from '@/contexts/AuthContext';
import { getTimeSlotConfig } from '@/lib/time-slots';

interface ReservationData {
  facility_id: string;
  site_id: string;
  reservation_date: string;
  time_slots: number[];
  total_amount: number;
  user_id?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  special_requests?: string;
}

interface Facility {
  id: string;
  name: string;
  type: string;
  weekday_price: number;
  weekend_price: number;
  amenities?: string[];
}

interface Site {
  id: string;
  name: string;
  type: string;
  capacity: number;
}

interface ReservationFormProps {
  onSubmit?: (data: ReservationData) => void;
}

export default function ReservationForm({ onSubmit }: ReservationFormProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [facilityLoading, setFacilityLoading] = useState(true);

  const { user, isAuthenticated } = useAuth();

  // 실제 시설 데이터 로드
  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFacilities(result.data.facilities || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch facilities:', error);
    } finally {
      setFacilityLoading(false);
    }
  };

  // 실제 가격 계산 (시설별 주중/주말 가격 적용)
  const calculateTotal = () => {
    if (!selectedFacilityId || selectedTimeSlots.length === 0) return 0;

    const facility = facilities.find(f => f.id === selectedFacilityId);
    if (!facility) return 0;

    const selectedDateObj = new Date(selectedDate);
    const isWeekend = selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6;
    const basePrice = isWeekend ? facility.weekend_price : facility.weekday_price;

    return basePrice * selectedTimeSlots.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || selectedTimeSlots.length === 0 || !selectedSiteId) {
      alert('날짜, 시간대, 사이트를 모두 선택해주세요.');
      return;
    }

    if (!isAuthenticated && (!guestInfo.name || !guestInfo.phone)) {
      alert('이름과 연락처를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const reservationData: ReservationData = {
        facility_id: selectedFacilityId,
        site_id: selectedSiteId,
        reservation_date: selectedDate,
        time_slots: selectedTimeSlots,
        total_amount: calculateTotal(),
        special_requests: specialRequests || undefined
      };

      let apiEndpoint = '/api/reservations'; // 게스트 예약용

      if (isAuthenticated && user) {
        reservationData.user_id = user.id;
        apiEndpoint = '/api/customer/reservations'; // 고객 예약용
      } else {
        reservationData.guest_name = guestInfo.name;
        reservationData.guest_phone = guestInfo.phone;
        reservationData.guest_email = guestInfo.email || undefined;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(result.message || '예약이 완료되었습니다!');

        // 무통장 입금 안내 표시 (인증된 사용자의 경우)
        if (isAuthenticated && result.data.reservation.payment_info) {
          const paymentInfo = result.data.reservation.payment_info;
          alert(`예약이 완료되었습니다!\n\n입금 정보:\n계좌: ${paymentInfo.bank_account}\n금액: ${paymentInfo.amount.toLocaleString()}원\n\n입금 확인 후 예약이 확정됩니다.`);
        }

        if (onSubmit) {
          onSubmit(reservationData);
        }

        // 폼 초기화
        setSelectedDate('');
        setSelectedTimeSlots([]);
        setSelectedFacilityId('');
        setSelectedSiteId('');
        setGuestInfo({ name: '', phone: '', email: '' });
        setSpecialRequests('');
      } else {
        // API 에러 메시지 처리
        const errorMessage = result.error?.message || result.message || '예약에 실패했습니다.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('예약 요청 실패:', error);
      alert('예약 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSelect = (facilityId: string, siteId: string) => {
    setSelectedFacilityId(facilityId);
    setSelectedSiteId(siteId);
  };

  const getTimeSlotText = () => {
    const timeSlotConfig = getTimeSlotConfig();
    return selectedTimeSlots.map(id => {
      const slot = timeSlotConfig[id];
      return slot ? `${slot.name} (${slot.time})` : `${id}부`;
    }).join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">바베큐장 예약</h1>
          <p className="text-gray-600">원하는 날짜와 시간을 선택하여 예약하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 달력 및 시설 선택 */}
          <div className="lg:col-span-2">
            <Calendar
              onDateSelect={setSelectedDate}
              onTimeSlotSelect={setSelectedTimeSlots}
              onSiteSelect={handleSiteSelect}
              selectedDate={selectedDate}
              selectedTimeSlots={selectedTimeSlots}
              selectedFacilityId={selectedFacilityId}
              selectedSiteId={selectedSiteId}
            />
          </div>

          {/* 예약 정보 및 폼 */}
          <div className="space-y-6">
            {/* 선택 정보 요약 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">예약 정보</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">날짜:</span>
                  <span className="ml-2 text-gray-600">
                    {selectedDate || '선택되지 않음'}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">시간:</span>
                  <span className="ml-2 text-gray-600">
                    {selectedTimeSlots.length > 0 ? getTimeSlotText() : '선택되지 않음'}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">사이트:</span>
                  <span className="ml-2 text-gray-600">
                    {selectedSiteId || '선택되지 않음'}
                  </span>
                </div>

                {selectedTimeSlots.length > 0 && (
                  <div className="pt-3 border-t">
                    <span className="font-medium text-gray-700">예상 금액:</span>
                    <span className="ml-2 text-lg font-bold text-green-600">
                      {calculateTotal().toLocaleString()}원
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* 예약자 정보 입력 */}
            {!isAuthenticated && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">예약자 정보</h3>

                <div className="space-y-4">
                  <Input
                    label="이름"
                    type="text"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="이름을 입력하세요"
                    required
                  />

                  <Input
                    label="연락처"
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    required
                  />

                  <Input
                    label="이메일 (선택)"
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
              </Card>
            )}

            {/* 특별 요청사항 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">특별 요청사항</h3>

              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="특별한 요청사항이 있으시면 입력해주세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={4}
              />
            </Card>

            {/* 예약 버튼 */}
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!selectedDate || selectedTimeSlots.length === 0 || !selectedSiteId}
              className="w-full py-4 text-lg"
              size="lg"
            >
              {loading ? '예약 진행 중...' : '예약하기'}
            </Button>

            {/* 안내사항 */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">예약 안내사항</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 예약은 이용일 3일 전까지 무료 취소 가능합니다.</li>
                <li>• 당일 취소 시 위약금이 발생할 수 있습니다.</li>
                <li>• 우천 시 실내 시설로 변경 가능합니다.</li>
                <li>• 추가 문의사항은 고객센터로 연락해주세요.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}