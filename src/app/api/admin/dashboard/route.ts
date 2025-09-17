/**
 * @deprecated This API route is deprecated and will be removed in a future version.
 * Please use the new analytics endpoint: /api/admin/analytics
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This admin dashboard API has been deprecated. Please use the new analytics endpoint: /api/admin/analytics',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-17',
      migration_guide: '/api/admin/analytics'
    },
    {
      status: 410,
      headers: {
        'X-API-Deprecated': 'true',
        'X-API-Sunset': '2024-12-31',
        'X-API-Migration-Guide': '/api/admin/analytics'
      }
    }
  );
}