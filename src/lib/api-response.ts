/**
 * API 응답 및 에러 처리 표준화
 */

import { NextResponse } from 'next/server';

// 표준 API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

// 커스텀 API 에러 클래스
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// 표준 에러 생성 함수들
export const ApiErrors = {
  BadRequest: (message = '잘못된 요청입니다.', code?: string) =>
    new ApiError(400, message, code),

  Unauthorized: (message = '인증이 필요합니다.', code?: string) =>
    new ApiError(401, message, code),

  Forbidden: (message = '접근 권한이 없습니다.', code?: string) =>
    new ApiError(403, message, code),

  NotFound: (message = '요청한 리소스를 찾을 수 없습니다.', code?: string) =>
    new ApiError(404, message, code),

  Conflict: (message = '리소스 충돌이 발생했습니다.', code?: string) =>
    new ApiError(409, message, code),

  ValidationError: (message = '입력값이 올바르지 않습니다.', code?: string) =>
    new ApiError(422, message, code),

  InternalServerError: (message = '서버 내부 오류가 발생했습니다.', code?: string) =>
    new ApiError(500, message, code),

  ServiceUnavailable: (message = '서비스를 사용할 수 없습니다.', code?: string) =>
    new ApiError(503, message, code),
} as const;

// 성공 응답 생성
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  }, { status });
}

// 에러 응답 생성
export function createErrorResponse(
  error: ApiError | Error | string,
  status?: number
): NextResponse<ApiResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
    }, { status: error.status });
  }

  if (error instanceof Error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: status || 500 });
  }

  // string 타입 에러
  return NextResponse.json({
    success: false,
    error: error,
  }, { status: status || 500 });
}

// API 핸들러 래퍼 함수
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }

      return createErrorResponse(
        new ApiError(500, '서버 내부 오류가 발생했습니다.')
      );
    }
  };
}

// 입력값 검증 헬퍼
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field =>
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw ApiErrors.ValidationError(
      `다음 필드가 필요합니다: ${missingFields.join(', ')}`,
      'MISSING_REQUIRED_FIELDS'
    );
  }
}

// 이메일 형식 검증
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw ApiErrors.ValidationError(
      '올바른 이메일 형식이 아닙니다.',
      'INVALID_EMAIL_FORMAT'
    );
  }
}

// 전화번호 형식 검증 (한국 형식)
export function validatePhoneNumber(phone: string): void {
  const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    throw ApiErrors.ValidationError(
      '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)',
      'INVALID_PHONE_FORMAT'
    );
  }
}