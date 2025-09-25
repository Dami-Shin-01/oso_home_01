import { supabase } from '@/lib/supabase';
import FacilitiesClient from '@/components/facilities/FacilitiesClient';

export const revalidate = 300; // 5분마다 캐시 갱신

export default async function FacilitiesPage() {
  // 활성화된 시설 데이터 가져오기 (이미지 포함)
  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, name, description, type, capacity, weekday_price, weekend_price, amenities, images, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return <FacilitiesClient facilities={facilities || []} />;
}