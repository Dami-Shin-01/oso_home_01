export default function FacilitiesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">시설 소개</h1>
      <p className="text-gray-600 mb-8">
        오소 바베큐장의 다양한 공간 타입을 확인하고 예약하세요.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 시설 카드들이 여기에 추가될 예정 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">프라이빗룸</h3>
          <p className="text-gray-600 mb-4">가족 단위에 최적화된 독립적인 공간</p>
          <div className="bg-gray-200 h-48 rounded-md mb-4"></div>
          <button className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
            자세히 보기
          </button>
        </div>
      </div>
    </div>
  );
}