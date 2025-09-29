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
  category: 'database' | 'auth' | 'payment' | 'email' | 'storage' | 'other';
  required: boolean;
  sensitive: boolean;
}

// 관리 가능한 환경변수 목록
const MANAGEABLE_ENV_VARS: Record<string, Omit<EnvironmentVariable, 'value'>> = {
  'NEXT_PUBLIC_SUPABASE_URL': {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase 프로젝트 URL',
    category: 'database',
    required: true,
    sensitive: false
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase 익명 키',
    category: 'database',
    required: true,
    sensitive: true
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase 서비스 역할 키 (서버 전용)',
    category: 'database',
    required: true,
    sensitive: true
  },
  'NEXTAUTH_SECRET': {
    key: 'NEXTAUTH_SECRET',
    description: 'NextAuth.js 암호화 시크릿',
    category: 'auth',
    required: true,
    sensitive: true
  },
  'NEXTAUTH_URL': {
    key: 'NEXTAUTH_URL',
    description: '애플리케이션 베이스 URL',
    category: 'auth',
    required: true,
    sensitive: false
  },
  'SMTP_HOST': {
    key: 'SMTP_HOST',
    description: 'SMTP 서버 호스트',
    category: 'email',
    required: false,
    sensitive: false
  },
  'SMTP_PORT': {
    key: 'SMTP_PORT',
    description: 'SMTP 서버 포트',
    category: 'email',
    required: false,
    sensitive: false
  },
  'SMTP_USER': {
    key: 'SMTP_USER',
    description: 'SMTP 사용자명',
    category: 'email',
    required: false,
    sensitive: false
  },
  'SMTP_PASS': {
    key: 'SMTP_PASS',
    description: 'SMTP 비밀번호',
    category: 'email',
    required: false,
    sensitive: true
  },
  'NODE_ENV': {
    key: 'NODE_ENV',
    description: '실행 환경 (development, production)',
    category: 'other',
    required: true,
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