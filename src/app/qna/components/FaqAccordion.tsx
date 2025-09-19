'use client';

import { useState } from 'react';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

interface FaqAccordionProps {
  faqs: Faq[];
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!faqs || faqs.length === 0) {
    return (
      <div className="space-y-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">등록된 FAQ가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      {faqs.map((faq, index) => (
        <div key={faq.id} className="bg-white rounded-lg shadow-md">
          <button
            className="w-full text-left p-6 focus:outline-none"
            onClick={() => toggleFaq(index)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
                {faq.category && (
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {faq.category}
                  </span>
                )}
              </div>
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
  );
}