/**
 * @deprecated This API route is deprecated and will be removed in a future version.
 * It uses the old SKU-based database schema that has been replaced with the new facility-based system.
 * Please use the auth APIs and user management through the new system.
 */

import { NextRequest, NextResponse } from 'next/server';

// Deprecated API - always return 410 Gone
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This admin user detail API has been deprecated. Please use the auth system for user management.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-16',
      migration_guide: 'Use auth endpoints and direct database queries with proper permissions'
    },
    { status: 410 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This admin user update API has been deprecated.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-16',
      migration_guide: 'Use auth endpoints for user management'
    },
    { status: 410 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This API endpoint is deprecated',
      message: 'This admin user delete API has been deprecated.',
      code: 'API_DEPRECATED',
      deprecated_since: '2024-09-16',
      migration_guide: 'Use auth endpoints for user management'
    },
    { status: 410 }
  );
}