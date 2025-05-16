import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaArrowLeft, FaGraduationCap, FaQuestion, FaListAlt, FaInfoCircle, FaLightbulb } from 'react-icons/fa';

const UserGuide = () => {
  const { isDarkMode } = useTheme();

  const guideItems = [
    {
      id: 1,
      title: "Câu hỏi về tuyển sinh",
      icon: <FaGraduationCap className="w-6 h-6 text-blue-500" />,
      examples: [
        "Trường Đại học Phú Yên có những phương thức xét tuyển nào?",
        "Thời gian xét tuyển năm 2024 là khi nào?",
        "Chỉ tiêu tuyển sinh năm nay là bao nhiêu?",
        "Điểm chuẩn năm 2023 của các ngành như thế nào?"
      ]
    },
    {
      id: 2,
      title: "Câu hỏi về ngành đào tạo",
      icon: <FaListAlt className="w-6 h-6 text-green-500" />,
      examples: [
        "Trường có những ngành nào?",
        "Ngành Quản trị kinh doanh học những gì?",
        "Chương trình đào tạo ngành Sư phạm Toán học như thế nào?",
        "Cơ hội việc làm sau khi tốt nghiệp ngành Công nghệ thông tin?"
      ]
    },
    {
      id: 3,
      title: "Câu hỏi về chi phí học tập",
      icon: <FaInfoCircle className="w-6 h-6 text-red-500" />,
      examples: [
        "Học phí các ngành năm 2024 là bao nhiêu?",
        "Trường có chính sách học bổng nào không?",
        "Chi phí sinh hoạt ở Phú Yên khoảng bao nhiêu?",
        "Có chế độ miễn giảm học phí không?"
      ]
    },
    {
      id: 4,
      title: "Câu hỏi về cơ sở vật chất",
      icon: <FaLightbulb className="w-6 h-6 text-yellow-500" />,
      examples: [
        "Ký túc xá của trường như thế nào?",
        "Thư viện trường có đầy đủ tài liệu không?",
        "Cơ sở vật chất phục vụ học tập ra sao?",
        "Có khu vực thể thao, giải trí không?"
      ]
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link 
            to="/"
            className={`mr-4 p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            Hướng dẫn sử dụng chatbot tư vấn tuyển sinh
          </h1>
        </div>

        <div className={`p-6 rounded-xl mb-8 ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-md'
        }`}>
          <div className="flex items-center mb-4">
            <FaQuestion className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <h2 className="text-xl font-semibold">Giới thiệu</h2>
          </div>
          <p className="leading-relaxed mb-4">
            Chatbot tư vấn tuyển sinh của Trường Đại học Phú Yên được thiết kế để hỗ trợ thí sinh và phụ huynh 
            tìm hiểu thông tin về trường, các ngành đào tạo, chính sách tuyển sinh, học phí và các vấn đề liên quan.
          </p>
          <p className="leading-relaxed">
            Chatbot có thể trả lời các câu hỏi bằng tiếng Việt có dấu, cung cấp thông tin chính xác và cập nhật 
            về kỳ tuyển sinh năm 2024 của Trường Đại học Phú Yên.
          </p>
        </div>

        <div className={`p-6 rounded-xl mb-8 ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-md'
        }`}>
          <h2 className="text-xl font-semibold mb-6">Cách sử dụng chatbot</h2>
          <ol className="space-y-3 ml-5 list-decimal">
            <li className="leading-relaxed">
              <span className="font-medium">Đặt câu hỏi rõ ràng:</span> Hãy đặt câu hỏi ngắn gọn, rõ ràng và tập trung vào một chủ đề cụ thể để nhận được câu trả lời chính xác.
            </li>
            <li className="leading-relaxed">
              <span className="font-medium">Sử dụng từ khóa:</span> Sử dụng các từ khóa liên quan đến tuyển sinh, ngành học, học phí... để chatbot dễ dàng xác định nội dung bạn quan tâm.
            </li>
            <li className="leading-relaxed">
              <span className="font-medium">Hỏi tiếp:</span> Nếu câu trả lời chưa đầy đủ, bạn có thể đặt câu hỏi tiếp theo để có thêm thông tin chi tiết.
            </li>
            <li className="leading-relaxed">
              <span className="font-medium">Xem gợi ý:</span> Tham khảo các câu hỏi gợi ý trên trang chủ để biết chatbot có thể hỗ trợ những vấn đề gì.
            </li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {guideItems.map(item => (
            <div 
              key={item.id}
              className={`p-6 rounded-xl ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-md'
              }`}
            >
              <div className="flex items-center mb-4">
                {item.icon}
                <h3 className="text-lg font-semibold ml-3">{item.title}</h3>
              </div>
              <ul className="space-y-2">
                {item.examples.map((example, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className={`inline-block w-5 h-5 flex-shrink-0 rounded-full mt-1 mr-2 ${
                      isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'
                    } text-xs flex items-center justify-center font-bold`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1">{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={`p-6 rounded-xl ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-md'
        }`}>
          <h2 className="text-xl font-semibold mb-4">Lưu ý khi sử dụng</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className={`inline-block w-4 h-4 flex-shrink-0 rounded-full mt-1 mr-2 ${
                isDarkMode ? 'bg-yellow-500/30' : 'bg-yellow-200'
              }`}></span>
              <span>
                Chatbot cung cấp thông tin tham khảo, để có thông tin chính thức và đầy đủ nhất, vui lòng liên hệ trực tiếp với Phòng Đào tạo của trường.
              </span>
            </li>
            <li className="flex items-start">
              <span className={`inline-block w-4 h-4 flex-shrink-0 rounded-full mt-1 mr-2 ${
                isDarkMode ? 'bg-yellow-500/30' : 'bg-yellow-200'
              }`}></span>
              <span>
                Trong trường hợp chatbot không thể trả lời câu hỏi của bạn, hãy liên hệ qua email hoặc hotline của trường để được hỗ trợ.
              </span>
            </li>
            <li className="flex items-start">
              <span className={`inline-block w-4 h-4 flex-shrink-0 rounded-full mt-1 mr-2 ${
                isDarkMode ? 'bg-yellow-500/30' : 'bg-yellow-200'
              }`}></span>
              <span>
                Thông tin tuyển sinh có thể thay đổi, vui lòng kiểm tra website chính thức của trường để có thông tin cập nhật nhất.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/"
            className={`inline-block px-6 py-3 rounded-lg font-medium transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Quay lại trang chính
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserGuide; 