export default function LocationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">오시는 길</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 지도 영역 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">위치 안내</h3>
          <div className="bg-gray-200 h-64 rounded-md flex items-center justify-center mb-4">
            <p className="text-gray-600">카카오맵 API 연동 예정</p>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>주소:</strong> 서울특별시 강남구 테헤란로 123</p>
            <p><strong>지번:</strong> 서울특별시 강남구 역삼동 123-45</p>
          </div>
        </div>

        {/* 교통편 안내 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">교통편 안내</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-lg mb-2 text-blue-600">🚗 자동차</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 경부고속도로 → 서초IC → 강남역 방향 10분</li>
                <li>• 영동대교 → 테헤란로 → 2km 직진</li>
                <li>• 무료 주차 50대 완비</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2 text-green-600">🚇 지하철</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 2호선 강남역 3번 출구 도보 15분</li>
                <li>• 분당선 선릉역 4번 출구 도보 10분</li>
                <li>• 버스 142, 341, 472번 이용</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2 text-orange-600">🚌 버스</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 간선버스: 142, 341, 472</li>
                <li>• 지선버스: 2413, 3422</li>
                <li>• 테헤란로 정류장 하차 후 도보 3분</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-lg mb-2">📞 연락처</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>전화:</strong> 02-1234-5678</p>
              <p><strong>영업시간:</strong> 오전 10시 - 오후 10시</p>
              <p><strong>휴무일:</strong> 매주 월요일</p>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 안내사항 */}
      <div className="mt-8 bg-yellow-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-yellow-800">🔔 이용 안내</h3>
        <ul className="space-y-2 text-sm text-yellow-700">
          <li>• 예약 없이 방문 시 이용이 어려울 수 있으니 사전 예약을 권장합니다.</li>
          <li>• 주차장이 협소하니 대중교통 이용을 권장합니다.</li>
          <li>• 우천 시에도 실내 공간에서 이용 가능합니다.</li>
          <li>• 반려동물 동반 시 목줄 착용은 필수입니다.</li>
        </ul>
      </div>
    </div>
  );
}