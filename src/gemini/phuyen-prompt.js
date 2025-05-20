import PHU_YEN_UNIVERSITY_DATA from './phuyen-data';

/**
 * Tạo prompt cơ sở để Gemini hoạt động như chatbot tư vấn tuyển sinh Đại học Phú Yên
 * @returns {string} Prompt cơ sở
 */
export const createBasePrompt = () => {
  return `
Bạn là trợ lý tư vấn tuyển sinh AI của Trường Đại học Phú Yên. Tên của bạn là "ĐHPY-Bot". 
Nhiệm vụ của bạn là cung cấp thông tin chính xác, đầy đủ và hữu ích về tuyển sinh, các ngành đào tạo, 
chương trình học, học phí và các vấn đề khác liên quan đến trường Đại học Phú Yên.

THÔNG TIN VỀ TRƯỜNG:
${JSON.stringify(PHU_YEN_UNIVERSITY_DATA.thongTinChung, null, 2)}

THÔNG TIN CÁC NGÀNH ĐÀO TẠO:
${JSON.stringify(PHU_YEN_UNIVERSITY_DATA.nganhDaoTao, null, 2)}

THÔNG TIN TUYỂN SINH 2024:
${JSON.stringify(PHU_YEN_UNIVERSITY_DATA.thongTinTuyenSinh2024, null, 2)}

THÔNG TIN HỌC BỔNG:
${JSON.stringify(PHU_YEN_UNIVERSITY_DATA.hocBong, null, 2)}

THÔNG TIN CƠ SỞ VẬT CHẤT:
${JSON.stringify(PHU_YEN_UNIVERSITY_DATA.coSoVatChat, null, 2)}

HOẠT ĐỘNG SINH VIÊN:
${JSON.stringify(PHU_YEN_UNIVERSITY_DATA.hoatDongSinhVien, null, 2)}

LIÊN KẾT QUỐC TẾ:
${JSON.stringify(PHU_YEN_UNIVERSITY_DATA.lienKetQuocTe, null, 2)}

CHƯƠNG TRÌNH ĐẶC BIỆT:
${JSON.stringify(PHU_YEN_UNIVERSITY_DATA.chuongTrinhDacBiet, null, 2)}

HƯỚNG DẪN PHẢN HỒI:

1. Luôn trả lời bằng tiếng Việt có dấu, thân thiện, rõ ràng và NGẮN GỌN.
2. Cung cấp thông tin TÓM TẮT và SÚC TÍCH, không dài dòng. Chỉ trả lời đúng nội dung chính mà người dùng hỏi.
3. Sau phần trả lời ngắn gọn, LUÔN đề xuất 2-3 câu hỏi tiếp theo liên quan mà người dùng có thể quan tâm. Định dạng gợi ý dưới dạng: "**Bạn muốn biết thêm về:**" và liệt kê các câu hỏi.
4. Luôn sử dụng thông tin chính xác từ dữ liệu được cung cấp. Không tự tạo thông tin không có trong dữ liệu.
5. Nếu không có thông tin về một câu hỏi cụ thể, hãy đề nghị người dùng liên hệ trực tiếp với phòng tuyển sinh qua email: tuyensinh@pyu.edu.vn hoặc số điện thoại: 0257 3843 867.
6. Tập trung vào việc cung cấp thông tin tuyển sinh, không trả lời các câu hỏi không liên quan đến Đại học Phú Yên hoặc tuyển sinh đại học.
7. Khi trả lời về một ngành đào tạo, chỉ cung cấp thông tin cốt lõi: mã ngành, chỉ tiêu, tổ hợp xét tuyển, điểm chuẩn năm trước, cơ hội việc làm chính.
8. Khi được hỏi về học phí, nêu rõ mức học phí theo từng nhóm ngành và nhấn mạnh các chính sách học bổng quan trọng nhất.
9. Giữ câu trả lời có định dạng tốt - sử dụng gạch đầu dòng, số thứ tự cho danh sách, và in đậm cho các thông tin quan trọng.
10. Câu trả lời nên ngắn gọn không quá 5-7 dòng văn bản (trừ khi bắt buộc phải chi tiết). Tránh dài dòng và lặp lại thông tin.

VÍ DỤ VỀ CÁC CÂU TRẢ LỜI MẪU:

Câu hỏi: "Ngành Công nghệ thông tin học những gì?"
Trả lời: "Ngành CNTT tại ĐH Phú Yên đào tạo về thiết kế, xây dựng và phát triển phần mềm. Sinh viên học 145 tín chỉ (4 năm) với mức học phí 17 triệu đồng/năm. Điểm chuẩn 2023: 19.0.

**Bạn muốn biết thêm về:**
1. Các môn học chính trong ngành CNTT?
2. Cơ hội việc làm sau tốt nghiệp?
3. Học bổng dành cho sinh viên CNTT?"

Câu hỏi: "Cách thức xét tuyển như thế nào?"
Trả lời: "ĐH Phú Yên xét tuyển 2024 qua 3 phương thức: xét điểm thi THPT (70% chỉ tiêu), xét học bạ (20%, yêu cầu TB từ 6.5), và xét tuyển thẳng (10%). Thời gian xét tuyển đợt 1: 20/7-31/8/2024.

**Bạn muốn biết thêm về:**
1. Hồ sơ xét tuyển cần chuẩn bị những gì?
2. Thời gian công bố kết quả trúng tuyển?
3. Chỉ tiêu tuyển sinh cho từng ngành?"

Giờ hãy trả lời câu hỏi của người dùng dựa trên thông tin và hướng dẫn trên.
`;
};

/**
 * Tạo prompt động dựa trên lịch sử chat
 * @param {string} userMessage - Tin nhắn hiện tại của người dùng
 * @param {Array} messageHistory - Lịch sử chat trước đó
 * @returns {string} - Prompt hoàn chỉnh để gửi đến Gemini
 */
export const createDynamicPrompt = (userMessage, messageHistory = []) => {
  // Tạo prompt cơ sở
  let prompt = createBasePrompt();

  // Thêm lịch sử chat nếu có
  if (messageHistory && messageHistory.length > 0) {
    prompt += "\n\nLỊCH SỬ CUỘC TRÒ CHUYỆN:\n";
    
    // Chỉ lấy tối đa 5 tin nhắn gần nhất để giữ cho context window không quá lớn
    const recentMessages = messageHistory.slice(-5);
    
    recentMessages.forEach(message => {
      const role = message.isBot ? "ĐHPY-Bot" : "Người dùng";
      // Làm sạch tin nhắn (loại bỏ HTML nếu có)
      const cleanText = message.text.replace(/<[^>]*>/g, '');
      prompt += `${role}: ${cleanText}\n`;
    });
  }

  // Thêm tin nhắn hiện tại
  prompt += `\nNgười dùng: ${userMessage}\n\nĐHPY-Bot: `;

  return prompt;
};

/**
 * Phân tích câu hỏi người dùng để tạo prompt tối ưu
 * @param {string} userMessage - Tin nhắn của người dùng
 * @returns {Object} - Các thông tin đã phân tích
 */
export const analyzeUserQuery = (userMessage) => {
  const lowerQuery = userMessage.toLowerCase();
  
  // Xác định các từ khóa
  const keywords = {
    nganhDaoTao: ['ngành', 'chuyên ngành', 'khoa', 'đào tạo', 'học gì', 'chương trình', 'môn học', 'chuyên môn'],
    hocPhi: ['học phí', 'chi phí', 'đóng tiền', 'tiền học', 'phí', 'học bổng', 'miễn giảm', 'hỗ trợ tài chính'],
    diemChuan: ['điểm chuẩn', 'điểm đầu vào', 'điểm xét tuyển', 'điểm trúng tuyển', 'điểm sàn', 'điểm cần đạt'],
    xetTuyen: ['xét tuyển', 'đăng ký', 'hồ sơ', 'nộp hồ sơ', 'đăng ký xét tuyển', 'đăng ký thi', 'thời gian', 'cách thức', 'thủ tục'],
    kyTucXa: ['ký túc xá', 'ktx', 'phòng ở', 'chỗ ở', 'nội trú', 'ngoại trú', 'nhà ở', 'thuê trọ'],
    hocBong: ['học bổng', 'hỗ trợ', 'miễn giảm', 'khen thưởng', 'đãi ngộ', 'chính sách'],
    coHoiViecLam: ['việc làm', 'ra trường', 'tốt nghiệp', 'nghề nghiệp', 'công việc', 'cơ hội', 'định hướng nghề', 'lương'],
    coSoVatChat: ['cơ sở vật chất', 'phòng học', 'thư viện', 'phòng thí nghiệm', 'cantin', 'wifi', 'thiết bị', 'sân vận động'],
    sinhVien: ['đời sống', 'sinh viên', 'câu lạc bộ', 'hoạt động', 'ngoại khóa', 'đoàn hội', 'sự kiện', 'cuộc thi'],
    thongTinChung: ['giới thiệu', 'lịch sử', 'thông tin', 'địa chỉ', 'liên hệ', 'website', 'hotline', 'email']
  };
  
  // Xác định chủ đề chính của câu hỏi
  let mainTopic = null;
  let highestMatchCount = 0;
  
  Object.entries(keywords).forEach(([topic, wordList]) => {
    const matchCount = wordList.filter(word => lowerQuery.includes(word)).length;
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      mainTopic = topic;
    }
  });
  
  // Xác định ngành học cụ thể nếu có đề cập
  const nganhs = PHU_YEN_UNIVERSITY_DATA.nganhDaoTao.map(nganh => ({
    id: nganh.tenNganh,
    keywords: [
      nganh.tenNganh.toLowerCase(), 
      nganh.maNganh.toLowerCase(),
      ...nganh.tenNganh.toLowerCase().split(' ')
    ]
  }));
  
  let mentionedNganh = null;
  nganhs.forEach(nganh => {
    if (nganh.keywords.some(keyword => lowerQuery.includes(keyword) && keyword.length > 3)) {
      mentionedNganh = nganh.id;
    }
  });

  // Phát hiện cảm xúc và ý định
  const sentiments = {
    greeting: ['chào', 'xin chào', 'hi', 'hello', 'hey'],
    farewell: ['tạm biệt', 'goodbye', 'bye', 'gặp lại sau'],
    thanks: ['cảm ơn', 'thank', 'cám ơn', 'biết ơn'],
    frustration: ['không hiểu', 'khó hiểu', 'phức tạp', 'rối', 'không rõ']
  };

  let detectedSentiment = null;
  Object.entries(sentiments).forEach(([sentiment, words]) => {
    if (words.some(word => lowerQuery.includes(word))) {
      detectedSentiment = sentiment;
    }
  });
  
  return {
    mainTopic,
    mentionedNganh,
    sentiment: detectedSentiment,
    originalQuery: userMessage
  };
};

/**
 * Tạo prompt tối ưu dựa trên phân tích câu hỏi
 * @param {string} userMessage - Tin nhắn của người dùng
 * @param {Array} messageHistory - Lịch sử chat
 * @returns {string} - Prompt tối ưu
 */
export const createOptimizedPrompt = (userMessage, messageHistory = []) => {
  // Phân tích câu hỏi
  const analysis = analyzeUserQuery(userMessage);
  
  // Tạo prompt cơ bản
  let prompt = createDynamicPrompt(userMessage, messageHistory);
  
  // Nếu phát hiện được cảm xúc, hướng dẫn chatbot phản hồi phù hợp
  if (analysis.sentiment) {
    const sentimentGuides = {
      greeting: "Người dùng đang chào hỏi. Hãy chào lại thân thiện và giới thiệu bạn là bot tư vấn tuyển sinh của ĐH Phú Yên, sẵn sàng giúp đỡ.",
      farewell: "Người dùng đang kết thúc cuộc hội thoại. Hãy tạm biệt lịch sự và nhắc họ có thể quay lại bất cứ lúc nào khi cần tư vấn.",
      thanks: "Người dùng đang cảm ơn. Hãy đáp lại sự cảm ơn và hỏi xem họ cần giúp đỡ gì thêm không.",
      frustration: "Người dùng có vẻ bối rối hoặc khó hiểu. Hãy xin lỗi và cố gắng giải thích lại một cách đơn giản, rõ ràng hơn."
    };

    prompt += `\n\nCẢM XÚC NGƯỜI DÙNG: ${sentimentGuides[analysis.sentiment]}`;
  }

  // Nếu phát hiện được chủ đề cụ thể, bổ sung thông tin chi tiết về chủ đề đó
  if (analysis.mainTopic) {
    const topicSuggestions = {
      nganhDaoTao: "Hãy nêu rõ: mã ngành, chỉ tiêu, tổ hợp xét tuyển, chương trình đào tạo, cơ hội việc làm sau tốt nghiệp.",
      hocPhi: "Hãy nêu rõ mức học phí theo nhóm ngành, các chính sách học bổng và hỗ trợ tài chính.",
      diemChuan: "Hãy cung cấp điểm chuẩn năm 2023 và dự kiến năm 2024, phân tích theo từng ngành và phương thức xét tuyển.",
      xetTuyen: "Hãy nêu chi tiết về phương thức xét tuyển, thời gian, hồ sơ cần thiết và quy trình xét tuyển.",
      kyTucXa: "Hãy mô tả cơ sở vật chất ký túc xá, điều kiện ở, chi phí và cách đăng ký.",
      coSoVatChat: "Hãy mô tả các cơ sở vật chất phục vụ học tập và sinh hoạt: phòng học, thư viện, phòng thí nghiệm, khu vui chơi, thể thao.",
      sinhVien: "Hãy mô tả các hoạt động ngoại khóa, câu lạc bộ và đời sống sinh viên tại trường."
    };

    if (topicSuggestions[analysis.mainTopic]) {
      prompt += `\n\nLƯU Ý CHỦ ĐỀ: Câu hỏi liên quan đến ${analysis.mainTopic}. ${topicSuggestions[analysis.mainTopic]}`;
    }
  }
  
  // Nếu phát hiện được ngành học cụ thể, cung cấp chi tiết về ngành đó
  if (analysis.mentionedNganh) {
    const nganhInfo = PHU_YEN_UNIVERSITY_DATA.nganhDaoTao.find(
      n => n.tenNganh === analysis.mentionedNganh
    );
    
    if (nganhInfo) {
      prompt += `\n\nTHÔNG TIN CHI TIẾT VỀ NGÀNH ${nganhInfo.tenNganh.toUpperCase()}:\n`;
      prompt += JSON.stringify(nganhInfo, null, 2);
      prompt += "\n\nHãy đảm bảo đề cập đến tất cả các thông tin quan trọng về ngành này trong câu trả lời của bạn.";
    }
  }
  
  return prompt;
};

export default { createBasePrompt, createDynamicPrompt, createOptimizedPrompt, analyzeUserQuery }; 