import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AvailabilityRow } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const resource_code = searchParams.get('resource_code');

    if (!date) {
      return NextResponse.json(
        { error: 'date 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 가용성 정보 조회 (실제 테이블 구조에 맞게)
    let query = supabase
      .from('availability')
      .select('*')
      .eq('date', date);

    if (resource_code) {
      query = query.eq('sku_code', resource_code);
    }

    const { data: availability, error: availabilityError } = await query as { data: AvailabilityRow[] | null; error: Error | null };

    if (availabilityError) {
      console.error('Availability fetch error:', availabilityError);
      return NextResponse.json(
        { error: '가용성 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 응답 데이터 구성
    const responseData = {
      date: date,
      availability: (availability || []).map(item => ({
        sku_code: item.sku_code,
        date: item.date,
        available_slots: item.available_slots || 0,
        booked_slots: item.booked_slots || 0,
        blocked: item.blocked || false,
        block_reason: item.block_reason
      }))
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}