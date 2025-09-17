import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
        {/* 히어로 섹션 */}
        <div className="hero min-h-screen bg-gradient-to-br from-primary to-primary-focus">
          <div className="hero-content text-center text-primary-content">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">
                자연 속에서 즐기는
                <br />
                특별한 바베큐 시간 🍖
              </h1>
              <p className="py-6 text-lg">
                가족, 친구들과 함께하는 소중한 추억을 만들어보세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/reservation" className="btn btn-accent btn-lg">
                  지금 예약하기
                </Link>
                <Link href="/facilities" className="btn btn-outline btn-lg">
                  시설 둘러보기
                </Link>
              </div>
            </div>
          </div>
        </div>

      {/* 특징 섹션 */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-base-content mb-4">
              오소 바베큐장만의 특별함
            </h2>
            <p className="text-lg text-base-content/70">
              편리한 예약 시스템과 최고의 시설로 완벽한 바베큐를 즐기세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="avatar">
                  <div className="w-16 rounded-full bg-primary text-primary-content flex items-center justify-center">
                    <span className="text-2xl">📅</span>
                  </div>
                </div>
                <h3 className="card-title">간편한 예약</h3>
                <p>1,2,3부 시간대를 한눈에 확인하고 원하는 시간에 바로 예약</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="avatar">
                  <div className="w-16 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                    <span className="text-2xl">🏞️</span>
                  </div>
                </div>
                <h3 className="card-title">최고의 자연환경</h3>
                <p>깨끗하고 쾌적한 자연 속에서 즐기는 프리미엄 바베큐 공간</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="avatar">
                  <div className="w-16 rounded-full bg-accent text-accent-content flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
                <h3 className="card-title">완벽한 시설</h3>
                <p>모든 필수 시설과 장비가 구비되어 편리하게 이용 가능</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 공간 소개 미리보기 */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-base-content mb-4">
              다양한 공간 타입
            </h2>
            <p className="text-lg text-base-content/70">
              용도와 인원에 맞는 최적의 공간을 선택하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['프라이빗룸', '텐트동', '야외 소파테이블', '야외 야장테이블', 'VIP동'].map((type) => (
              <div key={type} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <figure className="px-4 pt-4">
                  <div className="aspect-video bg-base-200 rounded-lg w-full flex items-center justify-center">
                    <span className="text-base-content/50">이미지 준비중</span>
                  </div>
                </figure>
                <div className="card-body">
                  <h3 className="card-title">{type}</h3>
                  <p className="text-sm text-base-content/70 mb-4">
                    {type}에 최적화된 바베큐 공간입니다.
                  </p>
                  <div className="card-actions justify-end">
                    <Link href="/facilities" className="btn btn-primary btn-sm">
                      자세히 보기
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/facilities" className="btn btn-primary btn-lg">
              모든 시설 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
