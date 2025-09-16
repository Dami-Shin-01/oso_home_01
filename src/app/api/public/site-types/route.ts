/**
 * @deprecated This API route is deprecated and will be removed in a future version.
 * It uses the old SKU-based database schema that has been replaced with the new facility-based system.
 * Please use /api/facilities instead.
 */

import { NextResponse } from 'next/server';

// Deprecated API - always return 410 Gone
export async function GET() {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This public site-types API has been deprecated. Please use the new /api/facilities endpoint.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-16',
      migration_guide: 'Use /api/facilities to get facility types and information'
    },
    { status: 410 }
  );
}