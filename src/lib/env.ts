/**
 * 환경 변수 검증 및 타입 안전성 보장
 */

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}

// 필수 환경 변수 검증
export const env = {
  // Supabase 설정 (필수)
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),

  // 외부 API 키 (선택사항)
  NEXT_PUBLIC_KAKAO_MAP_API_KEY: getOptionalEnvVar('NEXT_PUBLIC_KAKAO_MAP_API_KEY'),
  SMS_API_KEY: getOptionalEnvVar('SMS_API_KEY'),
  SMS_SECRET: getOptionalEnvVar('SMS_SECRET'),

  // 애플리케이션 설정
  NODE_ENV: getOptionalEnvVar('NODE_ENV', 'development'),
  NEXT_PUBLIC_APP_URL: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
} as const;

// 개발 모드 체크
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';

// 환경 변수 검증 함수
export function validateEnv(): void {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  // URL 형식 검증
  try {
    new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
  }

  try {
    new URL(env.NEXT_PUBLIC_APP_URL);
  } catch {
    throw new Error('NEXT_PUBLIC_APP_URL must be a valid URL');
  }
}

// 앱 시작 시 환경 변수 검증 실행
if (typeof window === 'undefined') {
  // 서버 사이드에서만 실행
  validateEnv();
}