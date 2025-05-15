/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 *
 * See the getting started guide for more information
 * https://ai.google.dev/gemini-api/docs/get-started/node
 */

import {GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold} from "@google/generative-ai";
import DOMPurify from 'dompurify';
import { marked } from 'marked';
  
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

// Simplify warning message
if (!apiKey) {
  console.warn("⚠️ VITE_GOOGLE_API_KEY is missing. Create a .env file with your Google API key.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy-key");

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const safetySetting = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

// Ánh xạ từ khóa đến emoji
const emojiMap = {
  'chào': '👋',
  'hello': '👋',
  'hi': '👋',
  'xin chào': '👋',
  'tuyệt vời': '🎉',
  'giúp': '🆘',
  'giúp đỡ': '🆘',
  'cảm ơn': '🙏',
  'thanks': '🙏',
  'vui': '😊',
  'buồn': '😢',
  'đúng': '✅',
  'sai': '❌',
  'lưu ý': '📝',
  'quan trọng': '⚠️',
  'ý tưởng': '💡',
  'thông tin': 'ℹ️',
  'video': '🎥',
  'âm nhạc': '🎵',
  'tiền': '💰',
  'thời gian': '⏰',
  'địa điểm': '📍',
  'email': '📧',
  'điện thoại': '📱',
  'internet': '🌐',
  'máy tính': '💻',
  'code': '👨‍💻',
  'lập trình': '👨‍💻',
  'sách': '📚',
  'học': '📚',
  'giáo dục': '🎓',
  'thành công': '🏆',
  'thất bại': '😓',
  'nhà': '🏠',
  'gia đình': '👨‍👩‍👧‍👦',
  'trái tim': '❤️',
  'yêu': '❤️',
  'thích': '👍',
  'không thích': '👎',
  'tìm kiếm': '🔍',
  'trí tuệ nhân tạo': '🤖',
  'AI': '🤖',
  'robot': '🤖',
  'python': '🐍',
  'javascript': '🟨',
  'react': '⚛️',
  'web': '🌐',
  'dữ liệu': '📊',
  'bảo mật': '🔒',
  'hacker': '👨‍💻',
  'virus': '🦠',
  'đám mây': '☁️',
  'du lịch': '✈️',
  'thời tiết': '🌤️',
  'nóng': '🔥',
  'lạnh': '❄️',
  'mưa': '🌧️',
  'nắng': '☀️',
  'đồ ăn': '🍔',
  'thức ăn': '🍲',
  'nước': '💧',
  'cà phê': '☕',
  'bánh mì': '🍞',
  'trái cây': '🍎',
  'rau': '🥦',
  'thịt': '🥩',
  'cá': '🐟',
  'gà': '🍗',
  'pizza': '🍕',
  'hamburger': '🍔',
  'sushi': '🍣',
  'bơ': '🧈',
  'kem': '🍦',
  'bánh': '🍰',
  'sức khỏe': '💪',
  'bệnh': '🤒',
  'thuốc': '💊',
  'bác sĩ': '👨‍⚕️',
  'thể thao': '⚽',
  'bóng đá': '⚽',
  'bóng rổ': '🏀',
  'tennis': '🎾',
  'bơi lội': '🏊‍♂️',
  'chạy bộ': '🏃‍♂️',
  'yoga': '🧘‍♀️',
  'âm nhạc': '🎵',
  'guitar': '🎸',
  'piano': '🎹',
  'nhạc': '🎼',
  'nghệ thuật': '🎨',
  'phim': '🎬',
  'game': '🎮',
  'trò chơi': '🎲',
  'cờ vua': '♟️',
  'poker': '🃏',
  'bài': '🃏',
  'sinh nhật': '🎂',
  'quà': '🎁',
  'lễ hội': '🎊',
  'giáng sinh': '🎄',
  'halloween': '🎃',
  'năm mới': '🎆',
  'pháo hoa': '🎆',
  'điện': '⚡',
  'pin': '🔋',
  'bút': '✏️',
  'viết': '✍️',
  'ghi chú': '📝',
  'tài liệu': '📄',
  'hồ sơ': '📁',
  'doanh nghiệp': '💼',
  'công ty': '🏢',
  'báo cáo': '📊',
  'biểu đồ': '📈',
  'giảm': '📉',
  'tăng': '📈',
  'chat': '💬',
  'tin nhắn': '💬',
  'thắc mắc': '❓',
  'câu hỏi': '❓',
  'hỏi': '❓',
  'trả lời': '💬',
};

// Hàm để thêm emoji vào văn bản
function addEmojisToText(text) {
  // Chuyển đổi text thành lowercase để so sánh dễ dàng hơn
  const lowerText = text.toLowerCase();
  
  // Tìm từ khóa và thêm emoji
  Object.keys(emojiMap).forEach(keyword => {
    if (lowerText.includes(keyword)) {
      // Sử dụng regex để chỉ thay thế từ khóa đầy đủ, không phải một phần của từ khác
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      text = text.replace(regex, (match) => `${match} ${emojiMap[keyword]}`);
    }
  });
  
  return text;
}

// Hàm để cải thiện định dạng văn bản
function enhanceTextFormatting(text) {
  // Thêm tiêu đề đậm
  text = text.replace(/^([^#\r\n].+)(\r\n|\r|\n)/gm, '**$1**$2');
  
  // Thêm gạch chân cho các quan điểm quan trọng
  text = text.replace(/quan trọng:([^!.]*)/gi, '_**Quan trọng:$1**_');
  text = text.replace(/lưu ý:([^!.]*)/gi, '_**Lưu ý:$1**_');
  
  // Thêm danh sách nếu có số đầu dòng
  text = text.replace(/(\d+\.)([^\r\n]+)/g, '* $1$2');
  
  // Thêm emoji vào văn bản
  text = addEmojisToText(text);
  
  // Chuyển đổi markdown thành HTML
  const htmlContent = marked(text);
  
  // Làm sạch HTML để tránh XSS
  const cleanHtml = DOMPurify.sanitize(htmlContent);
  
  return cleanHtml;
}

async function run(textInput, chatHistory) {
  try {
    // Check if API key is set
    if (!apiKey) {
      console.error("API key is missing! Please set VITE_GOOGLE_API_KEY in your .env file");
      
      // Return a mock response for testing UI without API key
      return `<p><strong>This is a mock response since your API key is missing.</strong></p>
              <p>Your question was: "${textInput}"</p>
              <p>To fix this issue:</p>
              <ol>
                <li>Get a Google Gemini API key from https://makersuite.google.com/app/apikey</li>
                <li>Create a .env file in your project root</li>
                <li>Add the line: VITE_GOOGLE_API_KEY=your_api_key_here</li>
                <li>Restart your development server</li>
              </ol>`;
    }

    const chatSession = model.startChat({
      generationConfig,
      safetySetting,
      history: [],
    });

    try {
      const result = await chatSession.sendMessage(textInput);
      const rawText = result.response.text();
      
      // Cải thiện định dạng và thêm emoji
      const enhancedText = enhanceTextFormatting(rawText);
      
      return enhancedText;
    } catch (apiError) {
      console.error("Error calling Gemini API:", apiError);
      return `<p><strong>Error calling AI service: ${apiError.message}</strong></p>
              <p>Please check your API key and internet connection.</p>`;
    }
  } catch (error) {
    console.error("Fatal error in Gemini function:", error);
    return `<p><strong>Something went wrong: ${error.message}</strong></p>`;
  }
}

export default run;