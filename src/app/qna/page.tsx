import { supabaseAdmin } from '@/lib/supabase';
import FaqAccordion from './components/FaqAccordion';

export default async function QnaPage() {
  // 발행된 FAQ만 가져오기
  const { data: faqs } = await supabaseAdmin
    .from('faqs')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">자주 묻는 질문</h1>
      <p className="text-gray-600 mb-8">
        궁금한 사항이 있으시면 아래 FAQ를 확인해 보세요. 더 자세한 문의는 카카오톡이나 전화로 연락해 주세요.
      </p>

      <div className="max-w-3xl mx-auto">
        <FaqAccordion faqs={faqs || []} />

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