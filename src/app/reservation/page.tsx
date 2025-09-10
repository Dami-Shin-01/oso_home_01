export default function ReservationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">예약하기</h1>
      
      <div className="max-w-4xl mx-auto">
        {/* 4단계 예약 프로세스 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <span className="ml-2 text-sm font-medium">공간 선택</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <span className="ml-2 text-sm font-medium">상세 정보</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <span className="ml-2 text-sm font-medium">날짜/시간</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
              <span className="ml-2 text-sm font-medium">예약자 정보</span>
            </div>
          </div>
        </div>

        {/* STEP 1: 공간 타입 선택 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">STEP 1. 공간 타입 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 hover:border-green-500 cursor-pointer">
              <h3 className="font-semibold">프라이빗룸</h3>
              <p className="text-sm text-gray-600 mt-1">독립적인 가족 공간</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-green-500 cursor-pointer">
              <h3 className="font-semibold">텐트동</h3>
              <p className="text-sm text-gray-600 mt-1">야외 캠핑 느낌</p>
            </div>
          </div>
        </div>

        {/* 다른 STEP들은 추후 구현 */}
        <div className="text-center text-gray-500">
          <p>추가 단계들은 구현 중입니다...</p>
        </div>
      </div>
    </div>
  );
}