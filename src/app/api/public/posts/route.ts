/**
 * @deprecated This API route is deprecated and will be removed in a future version.
 * Please use the new dedicated endpoints:
 * - For notices: /api/public/notices
 * - For FAQs: /api/public/faqs
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  // Provide migration guidance
  const migrationMap = {
    'NOTICE': '/api/public/notices',
    'QNA': '/api/public/faqs'
  };

  const newEndpoint = type && migrationMap[type as keyof typeof migrationMap];

  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: `This posts API has been deprecated. Please use the new dedicated endpoint: ${newEndpoint || '/api/public/notices or /api/public/faqs'}`,
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-17',
      migration_guide: {
        notices: '/api/public/notices',
        faqs: '/api/public/faqs'
      }
    },
    {
      status: 410,
      headers: {
        'X-API-Deprecated': 'true',
        'X-API-Sunset': '2024-12-31',
        'X-API-Migration-Guide': newEndpoint || '/docs/api-migration'
      }
    }
  );
}