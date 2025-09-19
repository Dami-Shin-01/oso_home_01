import { supabase } from '@/lib/supabase';

export default async function AnnouncementsPage() {
  // 발행된 공지사항만 가져오기
  const { data: notices } = await supabase
    .from('notices')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">공지사항</h1>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">번호</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">제목</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">작성일</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">조회수</th>
                </tr>
              </thead>
              <tbody>
                {notices && notices.length > 0 ? (
                  notices.map((notice, index) => (
                    <tr key={notice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {notice.is_important && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs mr-2">중요</span>
                        )}
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <a href="#" className="text-blue-600 hover:underline">
                          {notice.title}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{notice.view_count || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center text-gray-500">
                      등록된 공지사항이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="flex space-x-2">
          <button className="px-3 py-2 rounded-md bg-gray-200 text-gray-600">이전</button>
          <button className="px-3 py-2 rounded-md bg-green-600 text-white">1</button>
          <button className="px-3 py-2 rounded-md bg-gray-200 text-gray-600">2</button>
          <button className="px-3 py-2 rounded-md bg-gray-200 text-gray-600">다음</button>
        </div>
      </div>
    </div>
  );
}