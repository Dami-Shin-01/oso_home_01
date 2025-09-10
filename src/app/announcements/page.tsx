export default function AnnouncementsPage() {
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
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs mr-2">중요</span>
                    1
                  </td>
                  <td className="py-3 px-4">
                    <a href="#" className="text-blue-600 hover:underline">
                      오소 바베큐장 이용 안내사항
                    </a>
                  </td>
                  <td className="py-3 px-4 text-gray-600">2024-09-10</td>
                  <td className="py-3 px-4 text-gray-600">156</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">2</td>
                  <td className="py-3 px-4">
                    <a href="#" className="text-blue-600 hover:underline">
                      추석 연휴 운영 일정 안내
                    </a>
                  </td>
                  <td className="py-3 px-4 text-gray-600">2024-09-08</td>
                  <td className="py-3 px-4 text-gray-600">89</td>
                </tr>
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