import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ResourceCatalogRow } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 리소스 카탈로그에서 활성 항목들 조회
    const { data: resources, error } = await supabase
      .from('resource_catalog')
      .select('*')
      .eq('active', true)
      .order('display_name', { ascending: true }) as { data: ResourceCatalogRow[] | null; error: Error | null };

    if (error) {
      console.error('Site types fetch error:', error);
      return NextResponse.json(
        { error: '사이트 타입 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 카테고리별로 그룹핑
    const groupedByCategory = (resources || []).reduce((acc: Record<string, any[]>, resource) => {
      const category = resource.category_code || 'default';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: resource.internal_code,
        slug: resource.internal_code,
        name: resource.display_name,
        description: resource.description,
        max_guests: resource.max_guests,
        price: resource.price,
        category: resource.category_code,
        label: resource.label
      });
      return acc;
    }, {});

    const formattedData = Object.keys(groupedByCategory).map(categoryCode => ({
      id: categoryCode,
      name: categoryCode,
      site_types: groupedByCategory[categoryCode]
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