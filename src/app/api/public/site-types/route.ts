import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: siteTypes, error } = await supabase
      .from('facilities')
      .select(`
        id,
        slug,
        name,
        description,
        weekday_price,
        weekend_price,
        images
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Site types fetch error:', error);
      return NextResponse.json(
        { error: '시설 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const formattedData = siteTypes.map(siteType => ({
      id: siteType.id,
      slug: siteType.slug,
      name: siteType.name,
      description: siteType.description,
      weekday_price: siteType.weekday_price,
      representative_image_url: siteType.images?.[0] || null
    }));

    return NextResponse.json(formattedData, { status: 200 });

  } catch (error) {
    console.error('Site types API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}