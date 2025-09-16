/**
 * @deprecated This API route is deprecated and will be removed in a future version.
 * It uses the old SKU-based database schema that has been replaced with the new facility-based system.
 * Please use /api/reservations/lookup instead.
 */

import { NextRequest, NextResponse } from 'next/server';

// Deprecated API - always return 410 Gone
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This user reservations API has been deprecated. Please use the new /api/reservations/lookup endpoint.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-16',
      migration_guide: 'Use /api/reservations/lookup with authentication or guest info'
    },
    { status: 410 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This user reservation creation API has been deprecated. Please use the new /api/reservations endpoint.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-16',
      migration_guide: 'Use POST /api/reservations for creating new reservations'
    },
    { status: 410 }
  );
}