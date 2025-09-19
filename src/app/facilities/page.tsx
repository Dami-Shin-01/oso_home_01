import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';

export default async function FacilitiesPage() {
  // 활성화된 시설 데이터 가져오기
  const { data: facilities } = await supabaseAdmin
    .from('facilities')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">시설 소개</h1>
      <p className="text-gray-600 mb-8">
        오소 바베큐장의 다양한 공간 타입을 확인하고 예약하세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities && facilities.length > 0 ? (
          facilities.map((facility) => (
            <div key={facility.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">{facility.name}</h3>
              <p className="text-gray-600 mb-4">{facility.description}</p>

              <div className="bg-gray-200 h-48 rounded-md mb-4 flex items-center justify-center">
                <span className="text-gray-500">이미지 준비중</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">시설 유형:</span>
                  <span className="badge badge-outline badge-sm">{facility.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">수용인원:</span>
                  <span className="text-sm font-medium">{facility.capacity}명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">평일 요금:</span>
                  <span className="text-sm font-medium">{facility.weekday_price.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">주말 요금:</span>
                  <span className="text-sm font-medium">{facility.weekend_price.toLocaleString()}원</span>
                </div>
                {facility.amenities && facility.amenities.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600 block mb-1">편의시설:</span>
                    <div className="flex flex-wrap gap-1">
                      {facility.amenities.map((amenity, index) => (
                        <span key={index} className="badge badge-ghost badge-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/reservation"
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors block text-center"
              >
                예약하기
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">등록된 시설이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}