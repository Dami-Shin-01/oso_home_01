import { supabase } from '@/lib/supabase';
import FacilitiesClient from '@/components/facilities/FacilitiesClient';

export const revalidate = 300; // 5분마다 캐시 갱신

export default async function FacilitiesPage() {
  // 활성화된 시설 데이터 가져오기
  const { data: facilities } = await supabase
    .from('facilities')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return <FacilitiesClient facilities={facilities || []} />;
}