'use client';

import { useState } from 'react';

export default function GuestReservationPage() {
  const [reservationNumber, setReservationNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [searchResult, setSearchResult] = useState<'none' | 'found' | 'confirmed' | 'error'>('none');

  const handleSearch = () => {
    // 임시로 예약번호에 따라 다른 결과를 보여줌
    if (reservationNumber === 'RES001' && phone === '010-1234-5678') {
      setSearchResult('found');
    } else if (reservationNumber === 'RES002' && phone === '010-9876-5432') {
      setSearchResult('confirmed');
    } else if (reservationNumber && phone) {
      setSearchResult('error');
    }
  };

  const renderSearchResult = () => {
    switch (searchResult) {
      case 'found':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold">예약 조회 결과 - 입금 대기</h3>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-orange-800 font-medium mb-2">입금을 기다리고 있습니다.</p>
              <p className="text-sm text-orange-700">
                예약 확정을 위해 24시간 내에 입금해 주세요. 입금이 확인되면 예약이 확정됩니다.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">예약 정보</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">예약번호:</span> RES001</p>
                  <p><span className="text-gray-600">예약자:</span> 홍길동</p>
                  <p><span className="text-gray-600">연락처:</span> 010-1234-5678</p>
                  <p><span className="text-gray-600">이용일:</span> 2024년 9월 15일</p>
                  <p><span className="text-gray-600">시간:</span> 1부 (10:00-14:00)</p>
                  <p><span className="text-gray-600">공간:</span> 프라이빗룸 A</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">입금 정보</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">입금 금액:</span> 80,000원</p>
                  <p><span className="text-gray-600">입금 계좌:</span> 농협 123-456-789012</p>
                  <p><span className="text-gray-600">예금주:</span> 오소바베큐장</p>
                  <p><span className="text-gray-600">입금 마감:</span> 2024년 9월 11일 오후 6시</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
                예약 변경
              </button>
              <button className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700">
                예약 취소
              </button>
            </div>
          </div>
        );

      case 'confirmed':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold">예약 조회 결과 - 예약 확정</h3>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium mb-2">예약이 확정되었습니다! 🎉</p>
              <p className="text-sm text-green-700">
                예약일에 맞춰 방문해 주세요. 즐거운 시간 되시길 바랍니다.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">예약 정보</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">예약번호:</span> RES002</p>
                  <p><span className="text-gray-600">예약자:</span> 김영희</p>
                  <p><span className="text-gray-600">연락처:</span> 010-9876-5432</p>
                  <p><span className="text-gray-600">이용일:</span> 2024년 9월 20일</p>
                  <p><span className="text-gray-600">시간:</span> 2부 (14:00-18:00)</p>
                  <p><span className="text-gray-600">공간:</span> 텐트동 B</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">결제 정보</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">결제 금액:</span> 90,000원</p>
                  <p><span className="text-gray-600">결제 상태:</span> <span className="text-green-600 font-medium">완료</span></p>
                  <p><span className="text-gray-600">입금일:</span> 2024년 9월 10일</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 mr-3">
                예약 변경
              </button>
              <button className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700">
                취소 문의
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold">예약 조회 실패</h3>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">입력하신 정보와 일치하는 예약을 찾을 수 없습니다.</p>
              <div className="text-sm text-red-700 space-y-1">
                <p>• 예약번호와 연락처를 정확히 입력했는지 확인해 주세요.</p>
                <p>• 예약번호는 예약 완료 시 발송된 문자에서 확인할 수 있습니다.</p>
                <p>• 문제가 지속되면 고객센터로 문의해 주세요. (02-1234-5678)</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">비회원 예약 조회</h1>
      <p className="text-gray-600 mb-8">
        예약번호와 연락처를 입력하시면 예약 현황을 확인하실 수 있습니다.
      </p>

      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">예약 조회</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예약번호
              </label>
              <input
                type="text"
                placeholder="예: RES001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={reservationNumber}
                onChange={(e) => setReservationNumber(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연락처
              </label>
              <input
                type="tel"
                placeholder="010-1234-5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleSearch}
              className="w-full bg-green-600 text-white py-3 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-300"
              disabled={!reservationNumber || !phone}
            >
              예약 조회하기
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              예약번호는 예약 완료 시 발송된 문자에서 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {renderSearchResult()}

        {searchResult === 'none' && (
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">💡 테스트용 예약번호</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>입금 대기:</strong> RES001 / 010-1234-5678</p>
              <p>• <strong>예약 확정:</strong> RES002 / 010-9876-5432</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}