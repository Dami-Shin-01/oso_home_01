/**
 * @deprecated This API route is deprecated and will be removed in a future version.
 * It uses the old SKU-based database schema that has been replaced with the new facility-based system.
 * Please use /api/reservations with PUT/DELETE methods instead.
 */

import { NextRequest, NextResponse } from 'next/server';

// Deprecated API - always return 410 Gone
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This admin reservation detail API has been deprecated. Please use the new /api/reservations endpoint.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-16',
      migration_guide: 'Use /api/reservations with PUT/DELETE methods for updates'
    },
    { status: 410 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This admin reservation update API has been deprecated. Please use the new /api/reservations endpoint.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-16',
      migration_guide: 'Use PUT /api/reservations for updates'
    },
    { status: 410 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This admin reservation delete API has been deprecated. Please use the new /api/reservations endpoint.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-16',
      migration_guide: 'Use DELETE /api/reservations for cancellations'
    },
    { status: 410 }
  );
}