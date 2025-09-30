/**
 * 시간대 관리 유틸리티 (데이터베이스 기반)
 * 데이터베이스 기반으로 동적 시간대 관리를 지원합니다.
 */

import { getStoreTimeSlots } from './store-config';

export interface TimeSlot {
  id: number;
  name: string;
  time: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface TimeSlotConfig {
  [key: number]: {
    name: string;
    time: string;
  };
}

/**
 * 데이터베이스에서 시간대 설정을 가져와서 구조화된 객체로 반환
 */
export async function getTimeSlotConfig(): Promise<TimeSlotConfig> {
  const slots = await getStoreTimeSlots();

  return {
    1: { name: slots.slot1Name, time: slots.slot1 },
    2: { name: slots.slot2Name, time: slots.slot2 },
    3: { name: slots.slot3Name, time: slots.slot3 },
    4: { name: slots.slot4Name, time: slots.slot4 }
  };
}

/**
 * 시간대 ID에 해당하는 라벨을 반환
 */
export async function getTimeSlotLabel(slotId: number): Promise<string> {
  const config = await getTimeSlotConfig();
  const slot = config[slotId];

  if (!slot) {
    return `${slotId}부 (시간 미정)`;
  }

  return `${slot.name} (${slot.time})`;
}

/**
 * 시간대 ID에 해당하는 시간만 반환
 */
export async function getTimeSlotTime(slotId: number): Promise<string> {
  const config = await getTimeSlotConfig();
  const slot = config[slotId];

  return slot?.time || '시간 미정';
}

/**
 * 시간대 ID에 해당하는 이름만 반환
 */
export async function getTimeSlotName(slotId: number): Promise<string> {
  const config = await getTimeSlotConfig();
  const slot = config[slotId];

  return slot?.name || `${slotId}부`;
}

/**
 * 시간대 ID로 전체 시간대 정보 반환
 */
export async function getTimeSlotById(slotId: number): Promise<TimeSlot | null> {
  const config = await getTimeSlotConfig();
  const slot = config[slotId];

  if (!slot) return null;

  const [startTime, endTime] = slot.time.split('-');

  return {
    id: slotId,
    name: slot.name,
    time: slot.time,
    startTime: startTime.trim(),
    endTime: endTime.trim(),
    available: true
  };
}

/**
 * 모든 활성화된 시간대 목록을 반환
 */
export async function getAllTimeSlots(): Promise<TimeSlot[]> {
  const config = await getTimeSlotConfig();

  return Object.entries(config).map(([id, slot]) => {
    const [startTime, endTime] = slot.time.split('-');

    return {
      id: parseInt(id),
      name: slot.name,
      time: slot.time,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      available: true // 기본값, 실제 사용 시 예약 상황에 따라 변경
    };
  });
}

/**
 * 예약 폼에서 사용할 시간대 옵션 반환
 */
export async function getTimeSlotOptions(): Promise<Array<{ value: number; label: string }>> {
  const config = await getTimeSlotConfig();

  return Object.entries(config).map(([id, slot]) => ({
    value: parseInt(id),
    label: `${slot.name} (${slot.time})`
  }));
}

/**
 * 시간 문자열을 파싱해서 시작/종료 시간 객체로 반환
 */
export function parseTimeSlot(timeString: string): { start: string; end: string } | null {
  if (!timeString || !timeString.includes('-')) {
    return null;
  }

  const [start, end] = timeString.split('-').map(t => t.trim());
  return { start, end };
}

/**
 * 시간대가 현재 시간 기준으로 예약 가능한지 확인
 */
export async function isTimeSlotBookable(slotId: number, reservationDate: Date): Promise<boolean> {
  try {
    const config = await getTimeSlotConfig();
    const slot = config[slotId];

    if (!slot) return false;

    const timeInfo = parseTimeSlot(slot.time);
    if (!timeInfo) return false;

    // 현재 시간
    const now = new Date();

    // 예약 날짜와 시간대 시작 시간을 조합
    const [startHour, startMinute] = timeInfo.start.split(':').map(Number);
    const slotDateTime = new Date(reservationDate);
    slotDateTime.setHours(startHour, startMinute, 0, 0);

    // 최소 사전 예약 시간 확인 (데이터베이스에서 가져옴)
    const { getBusinessPolicies } = await import('@/lib/store-settings');
    const policies = await getBusinessPolicies();
    const minAdvanceHours = policies.minAdvanceBookingHours;
    const minBookingTime = new Date(now.getTime() + (minAdvanceHours * 60 * 60 * 1000));

    return slotDateTime > minBookingTime;
  } catch (error) {
    console.error('Error checking time slot bookable status:', error);
    return false;
  }
}

/**
 * 특정 날짜의 모든 시간대 예약 가능 여부를 확인
 */
export async function getAvailableTimeSlotsForDate(date: Date): Promise<TimeSlot[]> {
  const allSlots = await getAllTimeSlots();

  const slotsWithAvailability = await Promise.all(
    allSlots.map(async (slot) => ({
      ...slot,
      available: await isTimeSlotBookable(slot.id, date)
    }))
  );

  return slotsWithAvailability;
}

/**
 * 시간대 설정을 데이터베이스나 API에서 사용할 형태로 변환
 */
export async function getTimeSlotForDatabase(): Promise<Record<number, string>> {
  const config = await getTimeSlotConfig();
  const result: Record<number, string> = {};

  Object.entries(config).forEach(([id, slot]) => {
    result[parseInt(id)] = `${slot.name} (${slot.time})`;
  });

  return result;
}

/**
 * 레거시 TIME_SLOT_LABELS 형태로 변환 (기존 코드 호환성)
 */
export async function getLegacyTimeSlotLabels(): Promise<Record<number, string>> {
  return await getTimeSlotForDatabase();
}

/**
 * 시간대 검증 - 올바른 형식인지 확인
 */
export function validateTimeSlotFormat(timeString: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

/**
 * 모든 시간대 설정이 유효한지 검증
 */
export async function validateAllTimeSlots(): Promise<{ isValid: boolean; errors: string[] }> {
  try {
    const slots = await getStoreTimeSlots();
    const errors: string[] = [];

    const timeSlots = [
      { key: 'slot1', value: slots.slot1 },
      { key: 'slot2', value: slots.slot2 },
      { key: 'slot3', value: slots.slot3 },
      { key: 'slot4', value: slots.slot4 }
    ];

    timeSlots.forEach(({ key, value }) => {
      if (!validateTimeSlotFormat(value)) {
        errors.push(`${key}: ${value} - 올바르지 않은 시간 형식입니다. (예: 10:00-14:00)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('Error validating time slots:', error);
    return {
      isValid: false,
      errors: ['Database connection error']
    };
  }
}

/**
 * 개발 모드에서 시간대 설정을 콘솔에 출력 (디버깅용)
 */
export async function debugTimeSlots(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    try {
      console.log('⏰ Time Slots Configuration:');
      const config = await getTimeSlotConfig();
      console.table(config);

      const validation = await validateAllTimeSlots();
      if (!validation.isValid) {
        console.warn('⚠️ Time Slot Validation Errors:', validation.errors);
      }
    } catch (error) {
      console.error('⏰ Time Slots Debug Error:', error);
    }
  }
}