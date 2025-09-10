'use client';

import { useState } from 'react';

export default function QnaPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "예약은 어떻게 하나요?",
      answer: "홈페이지 상단의 '예약하기' 버튼을 클릭하시거나, 전화로 예약하실 수 있습니다. 온라인 예약이 더 편리하고 빠릅니다."
    },
    {
      question: "예약 취소는 언제까지 가능한가요?",
      answer: "이용일 3일 전까지 무료 취소가 가능합니다. 2일 전부터는 취소 수수료가 발생할 수 있습니다."
    },
    {
      question: "음식이나 음료 반입이 가능한가요?",
      answer: "네, 외부 음식과 음료 반입이 자유롭습니다. 또한 현장에서 식재료와 음료를 구매하실 수도 있습니다."
    },
    {
      question: "주차는 가능한가요?",
      answer: "무료 주차장이 완비되어 있습니다. 승용차 기준 약 50대 주차 가능합니다."
    },
    {
      question: "반려동물 동반이 가능한가요?",
      answer: "네, 반려동물과 함께 이용하실 수 있습니다. 다만 다른 고객님들을 위해 목줄 착용과 배변 처리는 필수입니다."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">자주 묻는 질문</h1>
      <p className="text-gray-600 mb-8">
        궁금한 사항이 있으시면 아래 FAQ를 확인해 보세요. 더 자세한 문의는 카카오톡이나 전화로 연락해 주세요.
      </p>

      <div className="max-w-3xl mx-auto">
        {/* FAQ 아코디언 */}
        <div className="space-y-4 mb-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md">
              <button
                className="w-full text-left p-6 focus:outline-none"
                onClick={() => toggleFaq(index)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
                  <span className="text-2xl text-gray-500">
                    {openIndex === index ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 1:1 문의 섹션 */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">1:1 문의</h3>
          <p className="text-gray-600 mb-4">
            FAQ에서 답을 찾지 못하셨나요? 직접 문의해 주세요!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#"
              className="flex-1 bg-yellow-400 text-gray-800 py-3 px-6 rounded-md text-center font-medium hover:bg-yellow-500 transition-colors"
            >
              카카오톡 문의
            </a>
            <a
              href="tel:02-1234-5678"
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md text-center font-medium hover:bg-green-700 transition-colors"
            >
              전화 문의: 02-1234-5678
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}