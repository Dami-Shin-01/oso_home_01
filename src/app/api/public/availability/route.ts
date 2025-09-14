import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteTypeId = searchParams.get('site_type_id');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!siteTypeId || !year || !month) {
      return NextResponse.json(
        { error: 'site_type_id, year, month 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: '유효하지 않은 년도 또는 월입니다.' },
        { status: 400 }
      );
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id')
      .eq('facility_id', siteTypeId)
      .eq('is_active', true);

    if (sitesError) {
      console.error('Sites fetch error:', sitesError);
      return NextResponse.json(
        { error: '사이트 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const siteIds = sites.map(site => site.id);
    
    if (siteIds.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('reservation_date, time_slot, site_id')
      .in('site_id', siteIds)
      .gte('reservation_date', startDateStr)
      .lte('reservation_date', endDateStr)
      .in('status', ['confirmed', 'pending']);

    if (reservationsError) {
      console.error('Reservations fetch error:', reservationsError);
      return NextResponse.json(
        { error: '예약 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const availabilityMap: Record<string, string> = {};
    
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(yearNum, monthNum - 1, day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayReservations = reservations.filter(r => r.reservation_date === dateStr);
      
      const totalSlots = siteIds.length * 3;
      const bookedSlots = dayReservations.length;
      
      if (bookedSlots === 0) {
        availabilityMap[dateStr] = 'AVAILABLE';
      } else if (bookedSlots >= totalSlots) {
        availabilityMap[dateStr] = 'UNAVAILABLE';
      } else {
        availabilityMap[dateStr] = 'PARTIALLY_AVAILABLE';
      }
    }

    return NextResponse.json(availabilityMap, { status: 200 });

  } catch (error) {
    console.error('Availability API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}