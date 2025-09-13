import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-green-50 to-white">
        {/* 히어로 섹션 */}
        <section className="relative bg-green-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                자연 속에서 즐기는
                <br />
                특별한 바베큐 시간
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-green-100">
                가족, 친구들과 함께하는 소중한 추억을 만들어보세요
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/reservation"
                  className="inline-block bg-white text-green-700 hover:bg-green-50 px-8 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  지금 예약하기
                </Link>
                <Link
                  href="/facilities"
                  className="inline-block border-2 border-white text-white hover:bg-white hover:text-green-700 px-8 py-3 rounded-md text-lg font-medium transition-colors"
                >
                  시설 둘러보기
                </Link>
              </div>
            </div>
          </div>
        </section>

      {/* 특징 섹션 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              오소 바베큐장만의 특별함
            </h2>
            <p className="text-lg text-gray-600">
              편리한 예약 시스템과 최고의 시설로 완벽한 바베큐를 즐기세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">간편한 예약</h3>
              <p className="text-gray-600">
                1,2,3부 시간대를 한눈에 확인하고 원하는 시간에 바로 예약
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🏞️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">최고의 자연환경</h3>
              <p className="text-gray-600">
                깨끗하고 쾌적한 자연 속에서 즐기는 프리미엄 바베큐 공간
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">완벽한 시설</h3>
              <p className="text-gray-600">
                모든 필수 시설과 장비가 구비되어 편리하게 이용 가능
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 공간 소개 미리보기 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              다양한 공간 타입
            </h2>
            <p className="text-lg text-gray-600">
              용도와 인원에 맞는 최적의 공간을 선택하세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['프라이빗룸', '텐트동', '야외 소파테이블', '야외 야장테이블', 'VIP동'].map((type) => (
              <div key={type} className="bg-gray-100 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                  <span className="text-gray-500">이미지 준비중</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{type}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {type}에 최적화된 바베큐 공간입니다.
                </p>
                <Link
                  href="/facilities"
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  자세히 보기 →
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/facilities"
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
            >
              모든 시설 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
