'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import { getAllTimeSlots } from '@/lib/time-slots';

interface TimeSlot {
  id: number;
  name: string;
  time: string;
  available: boolean;
}

interface SiteAvailability {
  site_id: string;
  site_name: string;
  site_number: string;
  capacity: number;
  occupied_time_slots: number[];
  available_time_slots: number[];
}

interface FacilityAvailability {
  facility_name: string;
  facility_type: string;
  sites: Record<string, SiteAvailability>;
}

interface CalendarProps {
  onDateSelect: (date: string) => void;
  onTimeSlotSelect: (timeSlots: number[]) => void;
  onSiteSelect: (facilityId: string, siteId: string) => void;
  selectedDate?: string;
  selectedTimeSlots?: number[];
  selectedFacilityId?: string;
  selectedSiteId?: string;
}

export default function Calendar({
  onDateSelect,
  onTimeSlotSelect,
  onSiteSelect,
  selectedDate,
  selectedTimeSlots = [],
  selectedFacilityId,
  selectedSiteId
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, FacilityAvailability>>({});
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // 시간대 정보를 비동기로 로드
  useEffect(() => {
    getAllTimeSlots().then(setTimeSlots);
  }, []);

  // 달력 날짜 계산
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const current = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 선택된 날짜의 가용성 조회
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailability = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reservations/lookup?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data.data.availability);
      }
    } catch (error) {
      console.error('가용성 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return; // 과거 날짜는 선택 불가

    const dateString = date.toISOString().split('T')[0];
    onDateSelect(dateString);
  };

  const handleTimeSlotToggle = (slotId: number) => {
    const newSlots = selectedTimeSlots.includes(slotId)
      ? selectedTimeSlots.filter(id => id !== slotId)
      : [...selectedTimeSlots, slotId].sort();

    onTimeSlotSelect(newSlots);
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toISOString().split('T')[0] === selectedDate;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getMonth() !== month;
  };

  const isTimeSlotAvailable = (slotId: number, siteId: string) => {
    if (!selectedDate || !availability) return true;

    for (const facilityData of Object.values(availability)) {
      const site = facilityData.sites[siteId];
      if (site) {
        return site.available_time_slots.includes(slotId);
      }
    }
    return true;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* 달력 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
        >
          ‹ 이전
        </Button>

        <h2 className="text-xl font-bold text-gray-800">
          {year}년 {month + 1}월
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
        >
          다음 ›
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* 달력 날짜 */}
      <div className="grid grid-cols-7 gap-1 mb-8">
        {days.map((date, index) => {
          const isSelected = isDateSelected(date);
          const isDisabled = isDateDisabled(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <button
              key={index}
              onClick={() => !isDisabled && handleDateClick(date)}
              disabled={isDisabled}
              className={`
                p-3 text-sm font-medium rounded-md transition-colors
                ${isSelected
                  ? 'bg-green-600 text-white'
                  : isDisabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : isToday
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* 선택된 날짜 정보 */}
      {selectedDate && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {selectedDate} 예약 가능 현황
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">조회 중...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 시간대 선택 */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">이용 시간대</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => handleTimeSlotToggle(slot.id)}
                        className={`
                          p-3 rounded-md border-2 transition-colors text-sm
                          ${selectedTimeSlots.includes(slot.id)
                            ? 'border-green-600 bg-green-50 text-green-800'
                            : 'border-gray-300 hover:border-gray-400 text-gray-700'
                          }
                        `}
                      >
                        <div className="font-medium">{slot.name}</div>
                        <div className="text-xs text-gray-500">{slot.time}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 시설별 가용성 */}
                {Object.entries(availability).map(([facilityId, facilityData]) => (
                  <div key={facilityId} className="border rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-800 mb-3">
                      {facilityData.facility_name} ({facilityData.facility_type})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(facilityData.sites).map(([siteId, site]) => (
                        <button
                          key={siteId}
                          onClick={() => onSiteSelect(facilityId, siteId)}
                          className={`
                            p-3 rounded-md border text-left transition-colors
                            ${selectedSiteId === siteId
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="font-medium text-sm">{site.site_name}</div>
                          <div className="text-xs text-gray-500 mb-2">
                            {site.site_number} (최대 {site.capacity}명)
                          </div>

                          <div className="flex space-x-1">
                            {timeSlots.map(slot => {
                              const available = site.available_time_slots.includes(slot.id);
                              return (
                                <div
                                  key={slot.id}
                                  className={`
                                    w-6 h-6 rounded text-xs flex items-center justify-center
                                    ${available
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                    }
                                  `}
                                  title={`${slot.name} ${available ? '예약 가능' : '예약 불가'}`}
                                >
                                  {slot.id}
                                </div>
                              );
                            })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(availability).length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    선택한 날짜에 예약 가능한 시설이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}