/**
 * @deprecated This API route is deprecated and will be removed in a future version.
 * Admin users should be created through Supabase Dashboard or CLI.
 * This was only intended for initial testing purposes.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'Test admin creation API has been deprecated. Please create admin users through Supabase Dashboard.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-17',
      migration_guide: 'Use Supabase Dashboard or CLI to create admin users'
    },
    {
      status: 410,
      headers: {
        'X-API-Deprecated': 'true',
        'X-API-Sunset': '2024-12-31',
        'X-API-Migration-Guide': 'https://supabase.com/docs/guides/cli'
      }
    }
  );
}