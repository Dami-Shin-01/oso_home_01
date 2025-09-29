import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { verifyAdminAuth } from '@/lib/auth-utils';
import fs from 'fs';
import path from 'path';

// 환경변수 타입 정의
interface EnvironmentVariable {
  key: string;
  value: string;
  description: string;
  category: 'store' | 'operation' | 'payment' | 'email' | 'policy' | 'marketing' | 'social';
  required: boolean;
  sensitive: boolean;
}

// 관리 가능한 환경변수 목록 (비즈니스 설정 중심)
const MANAGEABLE_ENV_VARS: Record<string, Omit<EnvironmentVariable, 'value'>> = {
  // 매장 기본 정보
  'STORE_NAME': {
    key: 'STORE_NAME',
    description: '매장 이름',
    category: 'store',
    required: true,
    sensitive: false
  },
  'STORE_PHONE': {
    key: 'STORE_PHONE',
    description: '매장 전화번호',
    category: 'store',
    required: true,
    sensitive: false
  },
  'STORE_EMAIL': {
    key: 'STORE_EMAIL',
    description: '매장 이메일',
    category: 'store',
    required: true,
    sensitive: false
  },
  'STORE_NOREPLY_EMAIL': {
    key: 'STORE_NOREPLY_EMAIL',
    description: '자동 발송 이메일 주소',
    category: 'store',
    required: true,
    sensitive: false
  },
  'STORE_ADMIN_EMAIL': {
    key: 'STORE_ADMIN_EMAIL',
    description: '관리자 이메일',
    category: 'store',
    required: true,
    sensitive: false
  },

  // 매장 위치 및 운영 정보
  'STORE_ADDRESS': {
    key: 'STORE_ADDRESS',
    description: '매장 주소',
    category: 'store',
    required: true,
    sensitive: false
  },
  'STORE_DETAILED_ADDRESS': {
    key: 'STORE_DETAILED_ADDRESS',
    description: '매장 상세 주소',
    category: 'store',
    required: false,
    sensitive: false
  },
  'STORE_BUSINESS_HOURS': {
    key: 'STORE_BUSINESS_HOURS',
    description: '영업 시간',
    category: 'store',
    required: true,
    sensitive: false
  },
  'STORE_CLOSED_DAY': {
    key: 'STORE_CLOSED_DAY',
    description: '정기 휴무일',
    category: 'store',
    required: false,
    sensitive: false
  },

  // 시간대 설정
  'TIME_SLOT_1': {
    key: 'TIME_SLOT_1',
    description: '1시간대 (예: 10:00-14:00)',
    category: 'operation',
    required: true,
    sensitive: false
  },
  'TIME_SLOT_2': {
    key: 'TIME_SLOT_2',
    description: '2시간대 (예: 14:00-18:00)',
    category: 'operation',
    required: true,
    sensitive: false
  },
  'TIME_SLOT_3': {
    key: 'TIME_SLOT_3',
    description: '3시간대 (예: 18:00-22:00)',
    category: 'operation',
    required: true,
    sensitive: false
  },
  'TIME_SLOT_4': {
    key: 'TIME_SLOT_4',
    description: '4시간대 (예: 22:00-02:00)',
    category: 'operation',
    required: false,
    sensitive: false
  },
  'TIME_SLOT_1_NAME': {
    key: 'TIME_SLOT_1_NAME',
    description: '1시간대 이름 (예: 1부)',
    category: 'operation',
    required: true,
    sensitive: false
  },
  'TIME_SLOT_2_NAME': {
    key: 'TIME_SLOT_2_NAME',
    description: '2시간대 이름 (예: 2부)',
    category: 'operation',
    required: true,
    sensitive: false
  },
  'TIME_SLOT_3_NAME': {
    key: 'TIME_SLOT_3_NAME',
    description: '3시간대 이름 (예: 3부)',
    category: 'operation',
    required: true,
    sensitive: false
  },
  'TIME_SLOT_4_NAME': {
    key: 'TIME_SLOT_4_NAME',
    description: '4시간대 이름 (예: 4부)',
    category: 'operation',
    required: false,
    sensitive: false
  },

  // 은행 계좌 정보
  'BANK_NAME': {
    key: 'BANK_NAME',
    description: '은행명',
    category: 'payment',
    required: true,
    sensitive: false
  },
  'BANK_ACCOUNT_NUMBER': {
    key: 'BANK_ACCOUNT_NUMBER',
    description: '계좌번호',
    category: 'payment',
    required: true,
    sensitive: false
  },
  'BANK_ACCOUNT_HOLDER': {
    key: 'BANK_ACCOUNT_HOLDER',
    description: '예금주',
    category: 'payment',
    required: true,
    sensitive: false
  },

  // 비즈니스 정책
  'CANCELLATION_POLICY': {
    key: 'CANCELLATION_POLICY',
    description: '취소 정책',
    category: 'policy',
    required: true,
    sensitive: false
  },
  'REFUND_POLICY': {
    key: 'REFUND_POLICY',
    description: '환불 정책',
    category: 'policy',
    required: true,
    sensitive: false
  },
  'MAX_ADVANCE_BOOKING_DAYS': {
    key: 'MAX_ADVANCE_BOOKING_DAYS',
    description: '최대 예약 가능 일수',
    category: 'policy',
    required: true,
    sensitive: false
  },
  'MIN_ADVANCE_BOOKING_HOURS': {
    key: 'MIN_ADVANCE_BOOKING_HOURS',
    description: '최소 예약 선행 시간',
    category: 'policy',
    required: true,
    sensitive: false
  },

  // SEO 및 마케팅
  'SITE_TITLE': {
    key: 'SITE_TITLE',
    description: '사이트 제목',
    category: 'marketing',
    required: true,
    sensitive: false
  },
  'SITE_DESCRIPTION': {
    key: 'SITE_DESCRIPTION',
    description: '사이트 설명',
    category: 'marketing',
    required: true,
    sensitive: false
  },
  'SITE_KEYWORDS': {
    key: 'SITE_KEYWORDS',
    description: '사이트 키워드',
    category: 'marketing',
    required: false,
    sensitive: false
  },

  // 소셜 미디어
  'SOCIAL_INSTAGRAM_URL': {
    key: 'SOCIAL_INSTAGRAM_URL',
    description: '인스타그램 URL',
    category: 'social',
    required: false,
    sensitive: false
  },
  'SOCIAL_FACEBOOK_URL': {
    key: 'SOCIAL_FACEBOOK_URL',
    description: '페이스북 URL',
    category: 'social',
    required: false,
    sensitive: false
  },
  'SOCIAL_BLOG_URL': {
    key: 'SOCIAL_BLOG_URL',
    description: '블로그 URL',
    category: 'social',
    required: false,
    sensitive: false
  }
};

/**
 * 환경변수 목록 조회
 */
async function getEnvironmentHandler(request: NextRequest) {
  // 관리자 권한 확인
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    throw ApiErrors.Unauthorized('관리자 권한이 필요합니다.');
  }

  try {
    const envVars: EnvironmentVariable[] = [];

    // 관리 가능한 환경변수들 조회
    Object.entries(MANAGEABLE_ENV_VARS).forEach(([key, config]) => {
      const value = process.env[key] || '';

      envVars.push({
        ...config,
        value: config.sensitive && value ? '***HIDDEN***' : value
      });
    });

    // 카테고리별로 정렬
    envVars.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.key.localeCompare(b.key);
    });

    return createSuccessResponse({
      variables: envVars,
      count: envVars.length
    });

  } catch (error) {
    console.error('Environment variables fetch error:', error);
    throw ApiErrors.InternalServerError('환경변수를 가져오는 중 오류가 발생했습니다.');
  }
}

/**
 * 환경변수 업데이트
 */
async function updateEnvironmentHandler(request: NextRequest) {
  // 관리자 권한 확인
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    throw ApiErrors.Unauthorized('관리자 권한이 필요합니다.');
  }

  try {
    const { variables } = await request.json();

    if (!Array.isArray(variables)) {
      throw ApiErrors.BadRequest('variables 배열이 필요합니다.');
    }

    // .env.local 파일 경로
    const envFilePath = path.join(process.cwd(), '.env.local');

    // 기존 .env.local 파일 읽기
    let envContent = '';
    try {
      envContent = fs.readFileSync(envFilePath, 'utf8');
    } catch (error) {
      // 파일이 없으면 새로 생성
      envContent = '# Environment Variables\n';
    }

    // 각 환경변수 업데이트
    const updatedVars: string[] = [];

    for (const variable of variables) {
      const { key, value } = variable;

      // 관리 가능한 환경변수인지 확인
      if (!MANAGEABLE_ENV_VARS[key]) {
        throw ApiErrors.BadRequest(`관리할 수 없는 환경변수입니다: ${key}`);
      }

      // 필수 환경변수인데 빈 값인 경우 확인
      if (MANAGEABLE_ENV_VARS[key].required && !value.trim()) {
        throw ApiErrors.BadRequest(`필수 환경변수입니다: ${key}`);
      }

      updatedVars.push(key);

      // 기존 환경변수 값 대체 또는 추가
      const envRegex = new RegExp(`^${key}=.*$`, 'm');
      const newEnvLine = `${key}=${value}`;

      if (envRegex.test(envContent)) {
        envContent = envContent.replace(envRegex, newEnvLine);
      } else {
        envContent += `\n${newEnvLine}`;
      }
    }

    // 파일 저장
    fs.writeFileSync(envFilePath, envContent, 'utf8');

    return createSuccessResponse({
      message: '환경변수가 성공적으로 업데이트되었습니다.',
      updatedVariables: updatedVars,
      restartRequired: true,
      note: '변경사항을 적용하려면 애플리케이션을 재시작해야 합니다.'
    });

  } catch (error) {
    console.error('Environment variables update error:', error);

    if (error instanceof Error && error.message.includes('EACCES')) {
      throw ApiErrors.InternalServerError('파일 접근 권한이 없습니다. 서버 관리자에게 문의하세요.');
    }

    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw ApiErrors.InternalServerError('환경변수 파일을 찾을 수 없습니다.');
    }

    throw error;
  }
}

/**
 * 환경변수 검증
 */
async function validateEnvironmentHandler(request: NextRequest) {
  // 관리자 권한 확인
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    throw ApiErrors.Unauthorized('관리자 권한이 필요합니다.');
  }

  try {
    const validationResults: Array<{
      key: string;
      status: 'valid' | 'missing' | 'invalid';
      message: string;
    }> = [];

    // 각 환경변수 검증
    Object.entries(MANAGEABLE_ENV_VARS).forEach(([key, config]) => {
      const value = process.env[key];

      if (!value) {
        validationResults.push({
          key,
          status: config.required ? 'missing' : 'valid',
          message: config.required ? '필수 환경변수가 설정되지 않았습니다.' : '선택적 환경변수입니다.'
        });
        return;
      }

      // 특정 환경변수별 검증 로직
      let isValid = true;
      let message = '정상';

      switch (key) {
        case 'NEXT_PUBLIC_SUPABASE_URL':
          isValid = value.startsWith('https://') && value.includes('.supabase.co');
          message = isValid ? '정상' : '올바른 Supabase URL 형식이 아닙니다.';
          break;

        case 'SMTP_PORT':
          isValid = !isNaN(Number(value)) && Number(value) > 0;
          message = isValid ? '정상' : '올바른 포트 번호가 아닙니다.';
          break;

        case 'NODE_ENV':
          isValid = ['development', 'production', 'test'].includes(value);
          message = isValid ? '정상' : '올바른 환경값이 아닙니다 (development, production, test 중 하나).';
          break;
      }

      validationResults.push({
        key,
        status: isValid ? 'valid' : 'invalid',
        message
      });
    });

    const totalCount = validationResults.length;
    const validCount = validationResults.filter(r => r.status === 'valid').length;
    const missingCount = validationResults.filter(r => r.status === 'missing').length;
    const invalidCount = validationResults.filter(r => r.status === 'invalid').length;

    return createSuccessResponse({
      results: validationResults,
      summary: {
        total: totalCount,
        valid: validCount,
        missing: missingCount,
        invalid: invalidCount,
        isAllValid: missingCount === 0 && invalidCount === 0
      }
    });

  } catch (error) {
    console.error('Environment validation error:', error);
    throw ApiErrors.InternalServerError('환경변수 검증 중 오류가 발생했습니다.');
  }
}

// HTTP 메서드별 핸들러
export const GET = withErrorHandling(getEnvironmentHandler);
export const PUT = withErrorHandling(updateEnvironmentHandler);
export const POST = withErrorHandling(validateEnvironmentHandler);