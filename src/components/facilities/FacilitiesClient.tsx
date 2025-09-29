'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FACILITY_TYPE_LABELS } from '@/constants';
import { getFeaturedImageUrl, getAllImageUrls } from '@/lib/image-utils';
import { getAllTimeSlots } from '@/lib/time-slots';

interface Facility {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  weekday_price: number;
  weekend_price: number;
  amenities: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
}

interface FacilitiesClientProps {
  facilities: Facility[];
}

export default function FacilitiesClient({ facilities }: FacilitiesClientProps) {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // 대표 이미지 (첫 번째 이미지) 가져오기
  const getFeaturedImage = (facility: Facility) => {
    return getFeaturedImageUrl(facility.images);
  };

  // 모든 이미지 URL 가져오기
  const getAllImages = (facility: Facility): string[] => {
    return getAllImageUrls(facility.images);
  };

  // 이미지 로딩 오류 처리
  const handleImageError = (imageUrl: string) => {
    setImageErrors(prev => ({ ...prev, [imageUrl]: true }));
  };

  // 이미지가 오류인지 확인
  const isImageError = (imageUrl: string) => {
    return imageErrors[imageUrl] || false;
  };

  // 필터링된 시설 목록
  const filteredFacilities = facilities?.filter(facility => {
    if (filterType === 'all') return true;
    return facility.type === filterType;
  }) || [];

  // 정렬된 시설 목록
  const sortedFacilities = [...filteredFacilities].sort((a, b) => {
    switch (sortBy) {
      case 'capacity':
        return b.capacity - a.capacity;
      case 'price_low':
        return a.weekday_price - b.weekday_price;
      case 'price_high':
        return b.weekday_price - a.weekday_price;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleDetailClick = (facility: Facility) => {
    setSelectedFacility(facility);
    (document.getElementById('facility_detail_modal') as HTMLDialogElement)?.showModal();
  };

  const closeModal = () => {
    setSelectedFacility(null);
    (document.getElementById('facility_detail_modal') as HTMLDialogElement)?.close();
  };

  const uniqueTypes = Array.from(new Set(facilities?.map(f => f.type) || []));

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-base-content mb-4">
            🏕️ 시설 소개
          </h1>
          <p className="text-base-content/70 text-lg max-w-2xl mx-auto">
            오소 바베큐장의 다양한 공간 타입을 확인하고 예약하세요.<br />
            자연 속에서 특별한 추억을 만들어보세요.
          </p>
        </div>

        {/* 필터 섹션 */}
        <div className="card bg-base-100 shadow-lg mb-8">
          <div className="card-body">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  className={`badge badge-lg ${filterType === 'all' ? 'badge-primary' : 'badge-outline'}`}
                  onClick={() => setFilterType('all')}
                >
                  전체 ({facilities?.length || 0})
                </button>
                {uniqueTypes.map(type => (
                  <button
                    key={type}
                    className={`badge badge-lg ${filterType === type ? 'badge-primary' : 'badge-outline'}`}
                    onClick={() => setFilterType(type)}
                  >
                    {FACILITY_TYPE_LABELS[type as keyof typeof FACILITY_TYPE_LABELS] || type}
                    ({facilities?.filter(f => f.type === type).length || 0})
                  </button>
                ))}
              </div>
              <div className="form-control">
                <select
                  className="select select-bordered select-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="created_at">등록순</option>
                  <option value="capacity">인원순</option>
                  <option value="price_low">가격 낮은순</option>
                  <option value="price_high">가격 높은순</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 시설 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFacilities.length > 0 ? (
            sortedFacilities.map((facility) => (
              <div key={facility.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                {/* 이미지 영역 */}
                <figure className="px-4 pt-4">
                  {getFeaturedImage(facility) && !isImageError(getFeaturedImage(facility)!) ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden">
                      <Image
                        src={getFeaturedImage(facility)!}
                        alt={facility.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        onError={() => handleImageError(getFeaturedImage(facility)!)}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏕️</div>
                        <span className="text-base-content/60 text-sm">
                          {getFeaturedImage(facility) ? '이미지 로딩 실패' : '이미지 준비중'}
                        </span>
                      </div>
                    </div>
                  )}
                </figure>

                {/* 카드 본문 */}
                <div className="card-body">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="card-title text-xl">{facility.name}</h2>
                    <div className="badge badge-primary badge-sm">
                      {FACILITY_TYPE_LABELS[facility.type as keyof typeof FACILITY_TYPE_LABELS] || facility.type}
                    </div>
                  </div>

                  <p className="text-base-content/70 text-sm mb-4 line-clamp-2">
                    {facility.description || '편안하고 쾌적한 공간에서 바베큐를 즐기세요.'}
                  </p>

                  {/* 정보 섹션 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="badge badge-outline badge-sm">
                        👥 {facility.capacity}명
                      </div>
                    </div>

                    <div className="divider my-2"></div>

                    {/* 가격 정보 */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/70">평일</span>
                        <span className="font-bold text-primary">
                          {facility.weekday_price?.toLocaleString() || '0'}원
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/70">주말</span>
                        <span className="font-bold text-secondary">
                          {facility.weekend_price?.toLocaleString() || '0'}원
                        </span>
                      </div>
                    </div>

                    {/* 편의시설 */}
                    {facility.amenities && facility.amenities.length > 0 && (
                      <div className="space-y-2">
                        <div className="divider my-2"></div>
                        <div>
                          <span className="text-sm text-base-content/70 block mb-2">편의시설</span>
                          <div className="flex flex-wrap gap-1">
                            {facility.amenities.slice(0, 4).map((amenity, index) => (
                              <div key={index} className="badge badge-ghost badge-xs">
                                {amenity}
                              </div>
                            ))}
                            {facility.amenities.length > 4 && (
                              <div className="badge badge-ghost badge-xs">
                                +{facility.amenities.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="card-actions justify-end mt-6">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDetailClick(facility)}
                    >
                      상세보기
                    </button>
                    <Link href="/reservation" className="btn btn-primary btn-sm">
                      예약하기
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body text-center py-16">
                  <div className="text-6xl mb-4">🏕️</div>
                  <h3 className="text-xl font-bold mb-2">해당 조건의 시설이 없습니다</h3>
                  <p className="text-base-content/70">
                    다른 필터 조건을 선택해 보세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 CTA 섹션 */}
        <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl mt-12">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-2xl mb-4">
              🔥 지금 바로 예약하고 특별한 시간을 만들어보세요!
            </h2>
            <p className="mb-6">
              원하는 시설을 선택하고 간편하게 예약하세요.
            </p>
            <div className="card-actions justify-center">
              <Link href="/reservation" className="btn btn-accent btn-lg">
                예약 페이지로 이동
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 시설 상세 모달 */}
      <dialog id="facility_detail_modal" className="modal">
        <div className="modal-box max-w-4xl">
          {selectedFacility && (
            <>
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
              </form>

              <div className="space-y-6">
                {/* 모달 헤더 */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-2xl mb-2">{selectedFacility.name}</h3>
                    <div className="badge badge-primary">
                      {FACILITY_TYPE_LABELS[selectedFacility.type as keyof typeof FACILITY_TYPE_LABELS] || selectedFacility.type}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="badge badge-outline badge-lg">
                      👥 {selectedFacility.capacity}명
                    </div>
                  </div>
                </div>

                {/* 이미지 갤러리 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 메인 이미지 */}
                  <div className="aspect-video">
                    {getFeaturedImage(selectedFacility) && !isImageError(getFeaturedImage(selectedFacility)!) ? (
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <Image
                          src={getFeaturedImage(selectedFacility)!}
                          alt={`${selectedFacility.name} 메인 이미지`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          onError={() => handleImageError(getFeaturedImage(selectedFacility)!)}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-4">🏕️</div>
                          <span className="text-base-content/60">
                            {getFeaturedImage(selectedFacility) ? '이미지 로딩 실패' : '메인 이미지'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 서브 이미지들 */}
                  <div className="grid grid-cols-2 gap-2">
                    {getAllImages(selectedFacility).slice(1, 5).map((imageUrl, index) => (
                      <div key={index} className="aspect-square">
                        {!isImageError(imageUrl) ? (
                          <div className="relative w-full h-full rounded-lg overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={`${selectedFacility.name} 이미지 ${index + 2}`}
                              fill
                              className="object-cover"
                              sizes="25vw"
                              onError={() => handleImageError(imageUrl)}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-info/20 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-center text-base-content/60">이미지<br/>로딩 실패</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* 빈 슬롯을 placeholder로 채우기 */}
                    {Array.from({ length: Math.max(0, 4 - getAllImages(selectedFacility).slice(1).length) }).map((_, index) => (
                      <div key={`placeholder-${index}`} className="aspect-square bg-gradient-to-br from-accent/20 to-info/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📸</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 추가 이미지가 있는 경우 더보기 표시 */}
                {getAllImages(selectedFacility).length > 5 && (
                  <div className="text-center">
                    <div className="badge badge-outline badge-lg">
                      +{getAllImages(selectedFacility).length - 5}개 이미지 더보기
                    </div>
                  </div>
                )}

                {/* 상세 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 시설 설명 */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-lg mb-2">시설 소개</h4>
                      <p className="text-base-content/80 leading-relaxed">
                        {selectedFacility.description || '편안하고 쾌적한 공간에서 바베큐를 즐기세요. 자연과 함께하는 특별한 시간을 만들어보세요.'}
                      </p>
                    </div>

                    {/* 편의시설 상세 */}
                    {selectedFacility.amenities && selectedFacility.amenities.length > 0 && (
                      <div>
                        <h4 className="font-bold text-lg mb-2">편의시설</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedFacility.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <span className="text-sm">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 가격 및 예약 정보 */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-lg mb-3">이용 요금</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                          <span className="font-medium">평일 (월~목)</span>
                          <span className="font-bold text-primary text-lg">
                            {selectedFacility.weekday_price?.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                          <span className="font-medium">주말 (금~일)</span>
                          <span className="font-bold text-secondary text-lg">
                            {selectedFacility.weekend_price?.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-2">이용 시간</h4>
                      <div className="space-y-2">
                        {getAllTimeSlots().map(slot => (
                          <div key={slot.id} className="badge badge-outline">
                            {slot.name}: {slot.time}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg mb-2">추가 정보</h4>
                      <ul className="text-sm space-y-1 text-base-content/80">
                        <li>• 최대 수용인원: {selectedFacility.capacity}명</li>
                        <li>• 현장 결제 가능</li>
                        <li>• 무료 주차 제공</li>
                        <li>• 당일 취소 불가</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 모달 액션 버튼 */}
                <div className="modal-action">
                  <button className="btn btn-outline" onClick={closeModal}>
                    닫기
                  </button>
                  <Link href="/reservation" className="btn btn-primary">
                    이 시설 예약하기
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>
      </dialog>
    </div>
  );
}