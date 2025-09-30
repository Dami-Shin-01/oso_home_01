import { NextRequest } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';
import { verifyAdminAuth } from '@/lib/auth-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import type { StoreSetting } from '@/lib/store-settings';

// 환경변수 타입 정의 (데이터베이스 기반)
interface EnvironmentVariable {
  key: string;
  value: string;
  description: string;
  category: 'store' | 'operation' | 'payment' | 'policy' | 'marketing' | 'social';
  required: boolean;
  sensitive: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  isPublic: boolean;
}

// 데이터베이스에서 관리되는 설정들은 더 이상 하드코딩하지 않음
// 모든 설정은 store_settings 테이블에서 동적으로 로드됨

/**
 * 환경변수 목록 조회 (데이터베이스 기반)
 */
async function getEnvironmentHandler(request: NextRequest) {
  // 관리자 권한 확인
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    throw ApiErrors.Unauthorized('관리자 권한이 필요합니다.');
  }

  try {
    const supabase = createAdminClient();

    // 모든 설정을 데이터베이스에서 조회
    const { data: settings, error } = await supabase
      .from('store_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    if (error) {
      console.error('Database query error:', error);
      throw ApiErrors.InternalServerError('설정을 조회하는 중 오류가 발생했습니다.');
    }

    // 데이터베이스 형식을 환경변수 형식으로 변환
    const envVars: EnvironmentVariable[] = settings?.map((setting: StoreSetting) => ({
      key: setting.key,
      value: setting.value,
      description: setting.description ?? '',
      category: setting.category,
      required: setting.is_required,
      sensitive: false, // 데이터베이스 설정은 민감하지 않음
      dataType: setting.data_type,
      isPublic: setting.is_public
    })) || [];

    return createSuccessResponse({
      variables: envVars,
      count: envVars.length
    });

  } catch (error) {
    console.error('Environment variables fetch error:', error);
    throw error instanceof Error && error.message.includes('ApiError')
      ? error
      : ApiErrors.InternalServerError('환경변수를 가져오는 중 오류가 발생했습니다.');
  }
}

/**
 * 환경변수 업데이트 (데이터베이스 기반)
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

    const supabase = createAdminClient();
    const updatedVars: string[] = [];
    const errors: string[] = [];

    // 각 환경변수 업데이트
    for (const variable of variables) {
      const { key, value } = variable;

      if (!key) {
        errors.push('설정 키가 필요합니다.');
        continue;
      }

      try {
        // 해당 설정이 존재하는지 먼저 확인
        const { data: existing, error: fetchError } = await supabase
          .from('store_settings')
          .select('key, is_required')
          .eq('key', key)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error(`Error fetching setting ${key}:`, fetchError);
          errors.push(`설정 조회 오류: ${key}`);
          continue;
        }

        if (!existing) {
          errors.push(`존재하지 않는 설정입니다: ${key}`);
          continue;
        }

        // 필수 설정인데 빈 값인 경우 확인
        if (existing.is_required && !value?.toString().trim()) {
          errors.push(`필수 설정입니다: ${key}`);
          continue;
        }

        // 데이터베이스 업데이트
        const { error: updateError } = await supabase
          .from('store_settings')
          .update({
            value: value?.toString() || '',
            updated_at: new Date().toISOString()
          })
          .eq('key', key);

        if (updateError) {
          console.error(`Error updating setting ${key}:`, updateError);
          errors.push(`설정 업데이트 오류: ${key}`);
          continue;
        }

        updatedVars.push(key);

      } catch (error) {
        console.error(`Unexpected error updating ${key}:`, error);
        errors.push(`예상치 못한 오류: ${key}`);
      }
    }

    if (errors.length > 0) {
      throw ApiErrors.BadRequest(`일부 설정 업데이트에 실패했습니다: ${errors.join(', ')}`);
    }

    return createSuccessResponse({
      message: '설정이 성공적으로 업데이트되었습니다.',
      updatedVariables: updatedVars,
      restartRequired: false,
      note: '데이터베이스 기반 설정이므로 즉시 적용됩니다.'
    });

  } catch (error) {
    console.error('Environment variables update error:', error);

    if (error instanceof Error && error.message.includes('ApiError')) {
      throw error;
    }

    throw ApiErrors.InternalServerError('설정 업데이트 중 오류가 발생했습니다.');
  }
}

/**
 * 환경변수 검증 (데이터베이스 기반)
 */
async function validateEnvironmentHandler(request: NextRequest) {
  // 관리자 권한 확인
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    throw ApiErrors.Unauthorized('관리자 권한이 필요합니다.');
  }

  try {
    const supabase = createAdminClient();

    // 모든 설정을 데이터베이스에서 조회
    const { data: settings, error } = await supabase
      .from('store_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    if (error) {
      console.error('Database query error:', error);
      throw ApiErrors.InternalServerError('설정을 조회하는 중 오류가 발생했습니다.');
    }

    const validationResults: Array<{
      key: string;
      status: 'valid' | 'missing' | 'invalid';
      message: string;
    }> = [];

    // 각 설정 검증
    settings?.forEach((setting: StoreSetting) => {
      const { key, value, is_required, data_type } = setting;

      if (!value || value.trim() === '') {
        validationResults.push({
          key,
          status: is_required ? 'missing' : 'valid',
          message: is_required ? '필수 설정이 비어있습니다.' : '선택적 설정입니다.'
        });
        return;
      }

      // 데이터 타입별 검증 로직
      let isValid = true;
      let message = '정상';

      switch (data_type) {
        case 'number':
          isValid = !isNaN(Number(value)) && Number(value) >= 0;
          message = isValid ? '정상' : '올바른 숫자 형식이 아닙니다.';
          break;

        case 'boolean':
          isValid = ['true', 'false', '1', '0'].includes(value.toLowerCase());
          message = isValid ? '정상' : '올바른 불린 값이 아닙니다 (true/false).';
          break;

        case 'json':
          try {
            JSON.parse(value);
            isValid = true;
            message = '정상';
          } catch {
            isValid = false;
            message = '올바른 JSON 형식이 아닙니다.';
          }
          break;

        case 'string':
        default:
          // 특정 키별 추가 검증
          if (key.includes('URL') && value) {
            isValid = value.startsWith('http://') || value.startsWith('https://');
            message = isValid ? '정상' : '올바른 URL 형식이 아닙니다.';
          } else if (key.includes('EMAIL') && value) {
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            message = isValid ? '정상' : '올바른 이메일 형식이 아닙니다.';
          } else if (key.includes('PHONE') && value) {
            isValid = /^[0-9-+()\s]+$/.test(value);
            message = isValid ? '정상' : '올바른 전화번호 형식이 아닙니다.';
          } else {
            message = '정상';
          }
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
    throw error instanceof Error && error.message.includes('ApiError')
      ? error
      : ApiErrors.InternalServerError('환경변수 검증 중 오류가 발생했습니다.');
  }
}

// HTTP 메서드별 핸들러
export const GET = withErrorHandling(getEnvironmentHandler);
export const PUT = withErrorHandling(updateEnvironmentHandler);
export const POST = withErrorHandling(validateEnvironmentHandler);