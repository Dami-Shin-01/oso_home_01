import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const { data: siteType, error: siteTypeError } = await supabase
      .from('facilities')
      .select(`
        id,
        slug,
        name,
        description,
        weekday_price,
        weekend_price,
        images,
        amenities
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (siteTypeError || !siteType) {
      return NextResponse.json(
        { error: '요청한 시설을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        capacity,
        is_active
      `)
      .eq('facility_id', siteType.id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (sitesError) {
      console.error('Sites fetch error:', sitesError);
      return NextResponse.json(
        { error: '사이트 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const responseData = {
      id: siteType.id,
      slug: siteType.slug,
      name: siteType.name,
      description: siteType.description,
      weekday_price: siteType.weekday_price,
      weekend_price: siteType.weekend_price,
      images: siteType.images || [],
      facilities: siteType.amenities || [],
      sites: sites || []
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Site type detail API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}