// 타입 안전성을 위한 헬퍼 함수들

/**
 * 안전한 객체 속성 접근
 * @param obj 접근할 객체
 * @param path 점으로 구분된 경로 (예: 'users.name')
 * @param defaultValue 기본값
 */
export const safeAccess = <T = any>(obj: any, path: string, defaultValue: T = null as T): T => {
  try {
    return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * 안전한 숫자 변환
 * @param value 변환할 값
 * @param defaultValue 기본값 (기본: 0)
 */
export const ensureNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * 안전한 문자열 변환
 * @param value 변환할 값
 * @param defaultValue 기본값 (기본: '')
 */
export const ensureString = (value: any, defaultValue: string = ''): string => {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};

/**
 * 안전한 배열 변환
 * @param value 변환할 값
 * @param defaultValue 기본값 (기본: [])
 */
export const ensureArray = <T = any>(value: any, defaultValue: T[] = []): T[] => {
  return Array.isArray(value) ? value : defaultValue;
};

/**
 * null/undefined 안전한 계산
 * @param values 계산할 값들의 배열
 * @param operation 수행할 연산 ('sum', 'avg', 'max', 'min')
 */
export const safeCalculation = (values: (number | null | undefined)[], operation: 'sum' | 'avg' | 'max' | 'min'): number => {
  const validNumbers = values.filter(v => v !== null && v !== undefined && !isNaN(Number(v))).map(Number);
  
  if (validNumbers.length === 0) return 0;
  
  switch (operation) {
    case 'sum':
      return validNumbers.reduce((acc, val) => acc + val, 0);
    case 'avg':
      return validNumbers.reduce((acc, val) => acc + val, 0) / validNumbers.length;
    case 'max':
      return Math.max(...validNumbers);
    case 'min':
      return Math.min(...validNumbers);
    default:
      return 0;
  }
};

/**
 * 예약 관련 안전한 접근자들
 */
export const reservationHelpers = {
  getUserName: (reservation: any): string => 
    safeAccess(reservation, 'users.name', '') || safeAccess(reservation, 'non_member_name', '') || safeAccess(reservation, 'name', '알 수 없음'),
    
  getUserPhone: (reservation: any): string => 
    safeAccess(reservation, 'users.phone', '') || safeAccess(reservation, 'non_member_phone', '') || safeAccess(reservation, 'phone', ''),
    
  getUserEmail: (reservation: any): string => 
    safeAccess(reservation, 'users.email', '') || safeAccess(reservation, 'email', ''),
    
  getSiteName: (reservation: any): string => 
    safeAccess(reservation, 'sites.name', '') || safeAccess(reservation, 'service_type', '알 수 없는 사이트'),
    
  getFacilityName: (reservation: any): string => 
    safeAccess(reservation, 'sites.facilities.name', '') || safeAccess(reservation, 'service_type', '알 수 없는 시설'),
    
  getSiteId: (reservation: any): string => 
    safeAccess(reservation, 'sites.id', '') || safeAccess(reservation, 'sku_code', ''),
    
  getExtraGuestCount: (reservation: any): number => 
    ensureNumber(safeAccess(reservation, 'extra_guest_count', 0)),
    
  isMember: (reservation: any): boolean => 
    Boolean(safeAccess(reservation, 'users', null)) || Boolean(safeAccess(reservation, 'email', null))
};