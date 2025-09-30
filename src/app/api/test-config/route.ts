import { NextRequest } from 'next/server';
import { getPublicStoreConfig } from '@/lib/store-config';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-response';

async function testConfigHandler(request: NextRequest) {
  try {
    const config = await getPublicStoreConfig();

    return createSuccessResponse({
      config,
      configKeys: Object.keys(config),
      basicKeys: config.basic ? Object.keys(config.basic) : null,
      hasBasicName: !!config.basic?.name
    }, 'Config 테스트 완료');
  } catch (error: any) {
    return createSuccessResponse({
      error: error.message,
      stack: error.stack
    }, 'Config 테스트 - 에러 발생');
  }
}

export const GET = withErrorHandling(testConfigHandler);