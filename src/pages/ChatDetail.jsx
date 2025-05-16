import { saveAs } from 'file-saver';
import { useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BiMessageAltDetail, BiMessageDetail } from "react-icons/bi";
import { FaCheck, FaCopy, FaEdit, FaFileDownload, FaRegThumbsDown, FaRegThumbsUp, FaGraduationCap } from "react-icons/fa";
import { IoRefresh, IoSend } from "react-icons/io5";
import { RiDeleteBin6Line, RiHeartFill, RiHeartLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import IconMenu from "../assets/menu.png";
import UserAvatar from "../assets/nmbvsylxgzcq3uppsfiu.png";
import SideBar from "../components/SideBar";
import { useTheme } from "../context/ThemeContext";
import Gemini from "../gemini/index";
import { addBotMessage, addChat, addUserMessage, removeChat, setNameChat } from "../store/chatSlice/index";
import chatBg from '../assets/backgroundDHPY.png';
import logoDHPY from '../assets/logoDHPY.png';

// Thay đổi ảnh đại diện cho bot tư vấn
const ROBOT_IMG_URL = "https://img.freepik.com/free-vector/cute-ai-robot-waving-hand-cartoon-character-illustration_138676-3153.jpg?size=626&ext=jpg&ga=GA1.1.1700460183.1708041600&semt=ais";

// Hàm định dạng câu trả lời từ Gemini
const formatResponse = (text) => {
  if (!text) return "";
  
  // Tách phần câu trả lời chính và phần gợi ý "Bạn muốn biết thêm về"
  let mainResponse = text;
  let suggestionsSection = "";
  
  if (text.includes("**Bạn muốn biết thêm về:**")) {
    const parts = text.split("**Bạn muốn biết thêm về:**");
    mainResponse = parts[0];
    suggestionsSection = "**Bạn muốn biết thêm về:**" + parts[1];
  }
  
  // Định dạng code blocks
  let formattedText = mainResponse.replace(
    /```([a-z]*)\n([\s\S]*?)\n```/g, 
    '<pre class="bg-gray-800 text-gray-100 p-3 my-2 rounded-md overflow-x-auto"><code>$2</code></pre>'
  );
  
  // Định dạng inline code
  formattedText = formattedText.replace(
    /`([^`]+)`/g, 
    '<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">$1</code>'
  );

  // Định dạng tiêu đề
  formattedText = formattedText.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-3">$1</h1>');
  formattedText = formattedText.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold my-2">$1</h2>');
  formattedText = formattedText.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold my-2">$1</h3>');
  
  // Định dạng danh sách có thứ tự
  formattedText = formattedText.replace(
    /^\d+\.\s(.+)$/gm,
    '<li class="ml-6 list-decimal">$1</li>'
  );
  
  // Định dạng danh sách không thứ tự
  formattedText = formattedText.replace(
    /^[*-]\s(.+)$/gm,
    '<li class="ml-6 list-disc">$1</li>'
  );
  
  // Gom các thẻ li liền nhau vào danh sách
  formattedText = formattedText.replace(
    /(<li[^>]*>.*?<\/li>)(?:\s*)(<li[^>]*>.*?<\/li>)/gs,
    '<ul class="my-2">$1$2</ul>'
  );
  
  // Định dạng đoạn văn
  formattedText = formattedText.replace(/^(?!<[a-z]).+$/gm, '<p class="my-2">$&</p>');
  
  // Loại bỏ thẻ p cho các dòng trống
  formattedText = formattedText.replace(/<p class="my-2"><\/p>/g, '<br />');
  
  // Định dạng bảng
  // Bắt đầu bảng
  formattedText = formattedText.replace(
    /[|](.+?)[|]\s*\n[|](?:[-:|]+)[|]\s*\n/g,
    '<table class="w-full border-collapse border border-gray-300 my-4"><thead><tr>$1</tr></thead><tbody>'
  );
  
  // Các hàng trong bảng
  formattedText = formattedText.replace(
    /[|](.+?)[|]\s*\n(?![|](?:[-:|]+)[|])/g,
    '<tr>$1</tr>'
  );
  
  // Kết thúc bảng
  formattedText = formattedText.replace(
    /<tr>(.+?)<\/tr>/g,
    (match) => {
      return match.replace(/\|(.+?)\|/g, '<td class="border border-gray-300 px-2 py-1">$1</td>');
    }
  );
  
  // Đóng thẻ bảng
  formattedText = formattedText.replace(/<tbody><\/tbody>/g, '</tbody></table>');
  
  // Định dạng liên kết
  formattedText = formattedText.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Định dạng đoạn văn bản in đậm và in nghiêng
  formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formattedText = formattedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Kết hợp lại, kể cả phần gợi ý nhưng ẩn đi để xử lý bằng JS
  return formattedText + (suggestionsSection ? suggestionsSection : "");
};

const ChatDetail = () => {
  const [menuToggle, setMenuToggle] = useState(true);
  const [dataDetail, setDataDetail] = useState([]);
  const [messageDetail, setMessageDetail] = useState([]);
  const [inputChat, setInputChat] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [likedMessages, setLikedMessages] = useState({});
  const [expandedMessages, setExpandedMessages] = useState({});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const { id } = useParams();
  const { data } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const sidebarRef = useRef(null);
  const messagesEndRef = useRef(null);
  const suggestedPrompts = [
    "Quy chế tuyển sinh năm 2024 của trường Đại học Phú Yên",
    "Chỉ tiêu tuyển sinh các ngành đào tạo",
    "Ngành Quản trị kinh doanh có những chuyên ngành nào?",
    "Học phí các ngành đào tạo năm 2024"
  ];

  useEffect(() => {
    if (data && id) {
      const updatedChat = data.find(chat => chat.id === id);
      if (updatedChat) {
        setDataDetail(updatedChat);
        setMessageDetail(updatedChat.messages || []);
      }
    }
  }, [data, id]);

  // Kiểm tra và xóa chat rỗng khi điều hướng đi
  useEffect(() => {
    // Không còn cần cleanup function để xóa chat rỗng
    // vì chúng ta muốn giữ lại chat mới dù chưa có tin nhắn nào
  }, []);

  // Thêm một effect mới để kiểm tra liệu chat mới có đang hoạt động không
  useEffect(() => {
    if (id && id !== 'info') {
      // Đánh dấu chat này là đang hoạt động để không bị xóa
      // Lưu ý: không cần dùng currentChat, có thể bỏ qua
    }
  }, [id, data]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageDetail, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setMenuToggle(false);
      }
    };

    if (menuToggle) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuToggle]);

  // Remove debug console log blocks
  useEffect(() => {
    // Check localStorage directly
    const persistedRoot = localStorage.getItem('persist:root');
    if (persistedRoot) {
      try {
        // Xử lý localStorage nếu cần
      } catch (e) {
        console.error("Error parsing localStorage data:", e);
      }
    }
  }, [data]);

  const handleChatDetail = async () => {
    if (!inputChat.trim()) return;

    const currentMessage = inputChat;
    setInputChat(""); // Clear input ngay lập tức

    if (id && id !== 'info') {
      // Thêm tin nhắn người dùng ngay lập tức
      dispatch(addUserMessage({
        idChat: id,
        userMess: currentMessage
      }));

      // Also update local state immediately 
      setMessageDetail(prevMessages => [
        ...prevMessages,
        {
          id: uuidv4(),
          text: currentMessage,
          isBot: false
        }
      ]);

      // Hiển thị loading state
      setIsLoading(true);

      // Thêm hiệu ứng typing (mô phỏng)
      setIsTyping(true);

      // Xử lý bot response
      try {
        const chatText = await Gemini(currentMessage, messageDetail);

        // Tắt hiệu ứng typing
        setIsTyping(false);

        if (dataDetail.title === 'Chat') {
          try {
            // Use a simpler, more direct prompt for better title generation
            const promptName = `Tạo một tiêu đề ngắn gọn (2-3 từ) cho cuộc trò chuyện có nội dung: "${currentMessage}". Chỉ trả về tiêu đề, không giải thích gì thêm.`;
            let newTitle = await Gemini(promptName);
            
            // Basic cleanup
            newTitle = newTitle.trim();
            
            // Remove quotes that often appear in responses
            newTitle = newTitle.replace(/["']/g, '');
            
            // If response contains multiple lines, take only the first line
            if (newTitle.includes('\n')) {
              newTitle = newTitle.split('\n')[0].trim();
            }
            
            // Use a more generous max length but still avoid cutting off words
            const maxLength = 20;
            let cleanTitle = newTitle;
            
            if (newTitle.length > maxLength && newTitle.indexOf(' ', 0) !== -1) {
              // Find the last space before or at maxLength
              const lastSpaceIndex = newTitle.lastIndexOf(' ', maxLength);
              cleanTitle = lastSpaceIndex !== -1 ? 
                newTitle.substring(0, lastSpaceIndex) : 
                newTitle.substring(0, maxLength);
            }
            
            // Only use fallback if title is really empty
            if (!cleanTitle || cleanTitle.length < 2) {
              // Create a simple title based on first few words of message
              const words = currentMessage.split(' ');
              cleanTitle = words.slice(0, 3).join(' ');
              
              // If still empty, use first 15 chars of message
              if (!cleanTitle || cleanTitle.length < 2) {
                cleanTitle = currentMessage.substring(0, 15);
              }
              
              // Last resort fallback
              if (!cleanTitle || cleanTitle.length < 2) {
                cleanTitle = "Chat " + (new Date()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
              }
            }
            
            console.log("Generated chat title:", cleanTitle);
            dispatch(setNameChat({ newTitle: cleanTitle, chatId: id }));
          } catch (titleError) {
            console.error("Error setting chat title:", titleError);
            // Create a title based on content rather than using generic "Chat mới"
            const words = currentMessage.split(' ');
            let fallbackTitle = words.slice(0, 3).join(' ');
            if (!fallbackTitle || fallbackTitle.length < 2) {
              fallbackTitle = "Chat " + (new Date()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            }
            dispatch(setNameChat({ newTitle: fallbackTitle, chatId: id }));
          }
        }

        if (chatText) {
          // Format response before adding it to redux store
          const formattedResponse = formatResponse(chatText);
          
          // Dispatch to Redux store
          dispatch(addBotMessage({
            idChat: id,
            botMess: formattedResponse
          }));

          // Also update local state immediately to ensure UI updates
          setMessageDetail(prevMessages => [
            ...prevMessages,
            {
              id: uuidv4(),
              text: formattedResponse,
              isBot: true
            }
          ]);
        }
      } catch (error) {
        console.error("Error in chat handling:", error);
        setIsTyping(false);
      }

      setIsLoading(false);
    } else {
      // Tạo chat mới khi ở trang info hoặc không có id
      const newChatId = uuidv4();

      // Thêm chat mới vào Redux store
      dispatch(addChat(newChatId));

      // Đợi một chút để đảm bảo chat đã được tạo trong Redux
      await new Promise(resolve => setTimeout(resolve, 200));

      // Thêm tin nhắn người dùng vào Redux store
      dispatch(addUserMessage({
        idChat: newChatId,
        userMess: currentMessage
      }));

      // Chuyển hướng đến chat mới
      navigate(`/chat/${newChatId}`);

      // Cập nhật state cục bộ
      setDataDetail({
        id: newChatId,
        title: 'Chat',
        messages: [{
          id: uuidv4(),
          text: currentMessage,
          isBot: false
        }]
      });

      // Khởi tạo danh sách tin nhắn cục bộ
      setMessageDetail([{
        id: uuidv4(),
        text: currentMessage,
        isBot: false
      }]);

      // Hiển thị trạng thái loading
      setIsLoading(true);

      try {
        // Gọi API để lấy phản hồi
        const chatText = await Gemini(currentMessage, []);

        if (chatText) {
          // Format response before adding it to redux store
          const formattedResponse = formatResponse(chatText);
          
          // Thêm tin nhắn bot vào Redux store
          dispatch(addBotMessage({
            idChat: newChatId,
            botMess: formattedResponse
          }));

          // Cập nhật state cục bộ
          setMessageDetail(prevMessages => [
            ...prevMessages,
            {
              id: uuidv4(),
              text: formattedResponse,
              isBot: true
            }
          ]);

          // Đặt tên cho chat mới
          try {
            // Use a simpler, more direct prompt for better title generation
            const promptName = `Tạo một tiêu đề ngắn gọn (2-3 từ) cho cuộc trò chuyện có nội dung: "${currentMessage}". Chỉ trả về tiêu đề, không giải thích gì thêm.`;
            let newTitle = await Gemini(promptName);
            
            // Basic cleanup
            newTitle = newTitle.trim();
            
            // Remove quotes that often appear in responses
            newTitle = newTitle.replace(/["']/g, '');
            
            // If response contains multiple lines, take only the first line
            if (newTitle.includes('\n')) {
              newTitle = newTitle.split('\n')[0].trim();
            }
            
            // Use a more generous max length but still avoid cutting off words
            const maxLength = 20;
            let cleanTitle = newTitle;
            
            if (newTitle.length > maxLength && newTitle.indexOf(' ', 0) !== -1) {
              // Find the last space before or at maxLength
              const lastSpaceIndex = newTitle.lastIndexOf(' ', maxLength);
              cleanTitle = lastSpaceIndex !== -1 ? 
                newTitle.substring(0, lastSpaceIndex) : 
                newTitle.substring(0, maxLength);
            }
            
            // Only use fallback if title is really empty
            if (!cleanTitle || cleanTitle.length < 2) {
              // Create a simple title based on first few words of message
              const words = currentMessage.split(' ');
              cleanTitle = words.slice(0, 3).join(' ');
              
              // If still empty, use first 15 chars of message
              if (!cleanTitle || cleanTitle.length < 2) {
                cleanTitle = currentMessage.substring(0, 15);
              }
              
              // Last resort fallback
              if (!cleanTitle || cleanTitle.length < 2) {
                cleanTitle = "Chat " + (new Date()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
              }
            }
            
            console.log("Generated chat title:", cleanTitle);
            dispatch(setNameChat({ newTitle: cleanTitle, chatId: newChatId }));
          } catch (titleError) {
            console.error("Error setting chat title:", titleError);
            // Create a title based on content rather than using generic "Chat mới"
            const words = currentMessage.split(' ');
            let fallbackTitle = words.slice(0, 3).join(' ');
            if (!fallbackTitle || fallbackTitle.length < 2) {
              fallbackTitle = "Chat " + (new Date()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            }
            dispatch(setNameChat({ newTitle: fallbackTitle, chatId: newChatId }));
          }
        }
      } catch (error) {
        console.error("Error in new chat handling:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatDetail();
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleLike = (id) => {
    setLikedMessages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSuggestedPrompt = (prompt) => {
    setInputChat(prompt);
    // Use setTimeout to ensure the state is updated before sending
    setTimeout(() => {
      handleChatDetail();
    }, 100);
  };

  const toggleMessageExpansion = (id) => {
    setExpandedMessages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const regenerateResponse = (messageId) => {
    // Tìm message cần tái tạo
    const msgIndex = messageDetail.findIndex(msg => msg.id === messageId);
    if (msgIndex > 0) {
      // Lấy tin nhắn người dùng gần nhất trước đó
      const userMessage = messageDetail[msgIndex - 1];
      if (userMessage && !userMessage.isBot) {
        setInputChat(userMessage.text);
        // Có thể thực hiện gửi lại luôn nếu muốn
        // handleChatDetail();
      }
    }
  };

  const rateMessage = (id, isPositive) => {
    // Logic để đánh giá tin nhắn (có thể lưu vào state hoặc gửi lên server)
    console.log(`Message ${id} rated ${isPositive ? 'positive' : 'negative'}`);
  };

  // Chức năng tải xuống cuộc trò chuyện
  const handleDownloadChat = () => {
    if (messageDetail && messageDetail.length > 0) {
      // Chuẩn bị nội dung để xuất ra
      let content = `# ${dataDetail.title?.replace(/<[^>]*>/g, '') || 'Chat'}\n\n`;

      messageDetail.forEach(message => {
        const sender = message.isBot ? "🤖 Bot" : "👤 You";
        // Loại bỏ HTML tags từ tin nhắn bot
        const cleanText = message.isBot ? message.text.replace(/<[^>]*>/g, '') : message.text;
        content += `## ${sender}\n${cleanText}\n\n`;
      });

      // Tạo file và tải xuống
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const fileName = `chat-${dataDetail.title?.replace(/<[^>]*>/g, '').replace(/\s+/g, '-').toLowerCase() || 'export'}-${new Date().toISOString().slice(0, 10)}.md`;
      saveAs(blob, fileName);
    }
  };

  // Chức năng xóa cuộc trò chuyện 
  const handleDeleteChat = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) {
      dispatch(removeChat(id));
      navigate('/');
    }
  };

  return (
    <div className={`h-full w-full flex flex-col justify-start pb-2 relative ${
      isDarkMode ? 'bg-primaryBg-dark text-gray-100' : 'bg-primaryBg-light text-gray-800'
    }`}>
      {/* Background image cho trang tư vấn tuyển sinh */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${chatBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1.0
        }}
      />
      
      {/* Lớp phủ tối nhẹ */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: isDarkMode 
            ? 'rgba(0, 0, 0, 0.4)' 
            : 'rgba(0, 0, 0, 0.2)'
        }}
      />
      
      {/* Header content with z-10 to appear above background */}
      <div className={`w-full z-10 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className={`flex items-center justify-between px-5 py-3 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-blue-900 to-blue-800 border-gray-700' 
          : 'bg-gradient-to-r from-blue-100 to-blue-50 border-gray-200'
      } border-b shadow-md sticky top-0 z-40 transition-all duration-300`}>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setMenuToggle(!menuToggle)}
            className="xl:hidden hover:opacity-80 transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <img src={IconMenu} alt="menu icon" className="w-6 h-6" />
          </button>
          
          {id && dataDetail && (
            <div className="flex items-center">
              <div className={`p-1.5 rounded-full mr-2 ${
                isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'
              }`}>
                <FaGraduationCap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h1 className={`font-medium truncate text-lg ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {typeof dataDetail.title === 'string' 
                    ? dataDetail.title.replace(/<[^>]*>/g, '') || 'Hỏi đáp tuyển sinh' 
                    : 'Hỏi đáp tuyển sinh'}
                </h1>
                <p className="text-xs text-blue-400">Đại học Phú Yên</p>
              </div>
            </div>
          )}
        </div>
        
        {id && (
          <div className="flex items-center">
            <div className={`flex items-center rounded-full ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
            } p-1`}>
              <button 
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-blue-500/20 text-gray-300 hover:text-blue-400' 
                    : 'hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                }`}
                title="Tải xuống cuộc trò chuyện"
                onClick={handleDownloadChat}
              >
                <FaFileDownload className="w-4 h-4" />
              </button>
              <Link 
                to="/guide"
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-blue-500/20 text-gray-300 hover:text-blue-400' 
                    : 'hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                }`}
                title="Hướng dẫn sử dụng"
              >
                <BiMessageDetail className="w-4 h-4" />
              </Link>
              <button 
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-red-500/20 text-gray-300 hover:text-red-400' 
                    : 'hover:bg-red-100 text-gray-600 hover:text-red-600'
                }`}
                title="Xóa cuộc trò chuyện"
                onClick={handleDeleteChat}
              >
                <RiDeleteBin6Line className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {menuToggle && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMenuToggle(false)}
          />
          <div
            ref={sidebarRef}
            className="relative w-[280px] h-full"
          >
            <SideBar onToggle={() => setMenuToggle(false)} />
          </div>
        </div>
      )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden max-w-[900px] w-full mx-auto py-4 px-4 z-10">
        {id === 'info' || !id ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col space-y-6">
              {/* Enhanced welcome section with logos on both sides */}
              <div className="flex items-center justify-center space-x-4 max-w-2xl mx-auto pt-4">
                {/* Logo on the left */}
                <div className="hidden md:block">
                  <img src={logoDHPY} alt="Logo DHPY" className="w-24 h-24 object-contain" />
                </div>
                
                {/* Center content with enhanced text */}
                <div className="text-center space-y-3 flex-1">
                  <h2 className="text-[42px] font-bold relative">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-transparent bg-clip-text relative z-10 tracking-wide drop-shadow-[0_2px_2px_rgba(0,128,0,0.3)]">
                      Chào mừng bạn
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></span>
                  </h2>
                  <div className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'} drop-shadow-md`} style={{textShadow: isDarkMode ? '0 0 8px rgba(255,255,255,0.3)' : '0 0 8px rgba(0,0,0,0.2)'}}>
                    Tư vấn tuyển sinh Đại học Phú Yên
                  </div>
                  <p className={`max-w-lg mx-auto text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} bg-opacity-50 rounded-lg p-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                    Chào mừng bạn đến với hệ thống tư vấn tuyển sinh thông minh của trường Đại học Phú Yên. Hãy đặt câu hỏi về thông tin tuyển sinh, ngành học, học phí,... để được hỗ trợ.
                  </p>
                </div>
                
                {/* Logo on the right */}
                <div className="hidden md:block">
                  <img src={logoDHPY} alt="Logo DHPY" className="w-24 h-24 object-contain" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { 
                    title: "Tuyển sinh", 
                    desc: "Thông tin về kỳ tuyển sinh năm 2024", 
                    icon: "🎓",
                    prompt: "Thông tin tuyển sinh Đại học Phú Yên năm 2024"
                  },
                  { 
                    title: "Ngành học", 
                    desc: "Các chương trình đào tạo của trường", 
                    icon: "📚",
                    prompt: "Trường Đại học Phú Yên đào tạo những ngành nào?"
                  },
                  { 
                    title: "Học phí", 
                    desc: "Chi phí học tập và học bổng", 
                    icon: "💰",
                    prompt: "Học phí các ngành đào tạo năm 2024 của Đại học Phú Yên"
                  },
                  { 
                    title: "Điểm chuẩn", 
                    desc: "Điểm chuẩn các ngành những năm gần đây", 
                    icon: "📊",
                    prompt: "Điểm chuẩn các ngành của Đại học Phú Yên những năm gần đây"
                  },
                  { 
                    title: "Cơ sở vật chất", 
                    desc: "Thông tin về cơ sở vật chất của trường", 
                    icon: "🏢",
                    prompt: "Cơ sở vật chất của trường Đại học Phú Yên như thế nào?"
                  },
                  { 
                    title: "Cơ hội việc làm", 
                    desc: "Triển vọng nghề nghiệp sau tốt nghiệp", 
                    icon: "💼",
                    prompt: "Cơ hội việc làm sau khi tốt nghiệp Đại học Phú Yên"
                  },
                  { 
                    title: "Ký túc xá", 
                    desc: "Thông tin về chỗ ở cho sinh viên", 
                    icon: "🏠",
                    prompt: "Thông tin về ký túc xá và chỗ ở cho sinh viên tại Đại học Phú Yên"
                  },
                  { 
                    title: "Hỏi đáp", 
                    desc: "Các câu hỏi thường gặp về tuyển sinh", 
                    icon: "❓",
                    prompt: "Các câu hỏi thường gặp về tuyển sinh Đại học Phú Yên"
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl transition-all duration-300 transform hover:scale-102 cursor-pointer 
                      ${isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500/40 shadow-md'
                        : 'bg-white hover:shadow-lg border border-gray-200 hover:border-blue-300/70'
                      }
                      group relative overflow-hidden
                    `}
                    onClick={() => {
                      setInputChat(item.prompt);
                      if (!id) {
                        navigate('/chat/info');
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex flex-col space-y-3 relative z-10">
                      <div className="flex">
                        <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <p className={`font-medium ${isDarkMode
                            ? 'text-gray-100 group-hover:text-white'
                            : 'text-gray-800 group-hover:text-gray-900'
                          }`}>
                          {item.title}
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add new chat input field directly on the home screen */}
              <div className={`max-w-3xl mx-auto w-full mt-8 rounded-xl shadow-md p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                <div className="relative mb-1">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1">
                      <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'
                        }`}>
                        <BiMessageAltDetail className="w-5 h-5" />
                      </div>
                      <textarea
                        value={inputChat}
                        placeholder="Nhập tin nhắn của bạn..."
                        rows={1}
                        className={`w-full py-3 pl-12 pr-20 rounded-xl resize-none transition-all duration-200 ${isDarkMode
                            ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:border-blue-500'
                            : 'bg-gray-50 text-gray-800 border-gray-200 placeholder-gray-500 focus:border-blue-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400`}
                        onChange={(e) => setInputChat(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                          minHeight: '50px',
                          maxHeight: '120px',
                          height: 'auto'
                        }}
                        onInput={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                        }}
                      />
                    </div>
                    <button
                      className={`p-3 rounded-xl transition-all duration-300 transform ${inputChat.trim()
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white shadow-md hover:shadow-blue-500/30'
                          : isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                        } ${!inputChat.trim() && 'cursor-not-allowed'}`}
                      onClick={handleChatDetail}
                      disabled={!inputChat.trim()}
                    >
                      <IoSend className={`w-5 h-5 ${inputChat.trim() ? 'transform rotate-0' : 'rotate-[-45deg]'
                        } transition-transform duration-300`} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Nhấn Enter để gửi, Shift+Enter để xuống dòng
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Được hỗ trợ bởi Gemini AI
                  </p>
                </div>
              </div>
              <div className="mt-8 text-center mb-4">
                <Link
                  to="/guide"
                  className={`inline-block px-4 py-2 rounded-full transition-colors ${
                    isDarkMode
                      ? 'bg-blue-800 hover:bg-blue-700 text-blue-200'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  <span className="flex items-center">
                    <BiMessageDetail className="mr-2" />
                    Hướng dẫn sử dụng chatbot
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className={`flex-1 overflow-y-auto pr-2 ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar'} z-10`}>
              {Array.isArray(messageDetail) && messageDetail.length > 0 ? (
                <>
                  {messageDetail.map((item) => (
                    <div key={item.id} className="animate-fadeIn mb-6">
                      <div
                        className={`flex space-x-4 ${item.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
                        onMouseEnter={() => setSelectedMessage(item.id)}
                        onMouseLeave={() => setSelectedMessage(null)}
                      >
                        <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden ${isDarkMode
                            ? item.isBot ? 'bg-blue-600' : 'bg-green-600'
                            : item.isBot ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-green-500 to-teal-500'
                          }`}>
                          {item.isBot ?
                            <img
                              src={ROBOT_IMG_URL}
                              alt="AI Bot"
                              className="w-full h-full object-cover"
                            /> :
                            <img
                              src={UserAvatar}
                              alt="User"
                              className="w-full h-full object-cover"
                            />
                          }
                        </div>
                        <div className={`flex-1 rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden
                          ${isDarkMode
                            ? item.isBot
                              ? 'bg-gray-800 border-gray-700 hover:shadow-md hover:shadow-blue-500/5'
                              : 'bg-gray-700 border-gray-600 hover:shadow-md hover:shadow-green-500/5'
                            : item.isBot
                              ? 'bg-white border-gray-200 hover:shadow-md'
                              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 hover:shadow-md'
                          }`}
                        >
                          {item.isBot && selectedMessage === item.id && (
                            <div className={`absolute right-4 -mt-3 flex items-center space-x-1 ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-600'
                              } rounded-full shadow-md px-2 py-1 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'
                              }`}>
                              <button
                                onClick={() => regenerateResponse(item.id)}
                                className="p-1 hover:bg-gray-100 hover:text-blue-500 rounded-full"
                                title="Tạo lại câu trả lời"
                              >
                                <IoRefresh className="w-3.5 h-3.5" />
                              </button>
                              {!item.isBot && (
                                <button
                                  onClick={() => setInputChat(item.text)}
                                  className="p-1 hover:bg-gray-100 hover:text-blue-500 rounded-full"
                                  title="Chỉnh sửa tin nhắn"
                                >
                                  <FaEdit className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          <div className="p-4">
                            {item.isBot ? (
                              <>
                                <div
                                  className={`prose prose-lg max-w-none ${expandedMessages[item.id] ? '' : 'max-h-[400px] overflow-y-auto'
                                    }`}
                                  dangerouslySetInnerHTML={{ __html: formatResponse(item.text) }}
                                />
                                {/* Extract and display suggested follow-up questions as buttons */}
                                {item.text.includes('**Bạn muốn biết thêm về:**') && (
                                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="font-medium text-sm mb-2">Bạn muốn biết thêm về:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {item.text
                                        .split('**Bạn muốn biết thêm về:**')[1]
                                        .split(/\d+\.\s/).filter(q => q.trim())
                                        .map((question, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() => handleSuggestedPrompt(question.trim())}
                                            className={`text-sm px-3 py-2 rounded-full transition ${
                                              isDarkMode 
                                                ? 'bg-blue-800/50 hover:bg-blue-700 text-blue-100' 
                                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                                            }`}
                                          >
                                            {question.trim().replace(/[?.]/, '?')}
                                          </button>
                                        ))
                                      }
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-lg">{item.text}</p>
                            )}

                          </div>

                          {item.isBot && (
                            <div className={`flex items-center justify-between p-2 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'
                              }`}>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => rateMessage(item.id, true)}
                                  className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                      ? 'text-gray-400 hover:text-green-400 hover:bg-gray-700'
                                      : 'text-gray-500 hover:text-green-500 hover:bg-gray-200'
                                    }`}
                                  title="Phản hồi tốt"
                                >
                                  <FaRegThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => rateMessage(item.id, false)}
                                  className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                      : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'
                                    }`}
                                  title="Phản hồi không tốt"
                                >
                                  <FaRegThumbsDown className="w-4 h-4" />
                                </button>
                                {item.text.length > 400 && (
                                  <button
                                    onClick={() => toggleMessageExpansion(item.id)}
                                    className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                        ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                                        : 'text-gray-500 hover:text-blue-500 hover:bg-gray-200'
                                      }`}
                                    title={expandedMessages[item.id] ? "Thu gọn" : "Xem thêm"}
                                  >
                                    {expandedMessages[item.id] ? "Thu gọn" : "Xem thêm"}
                                  </button>
                                )}
                              </div>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => toggleLike(item.id)}
                                  className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                      ? likedMessages[item.id] ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                                      : likedMessages[item.id] ? 'text-red-500 bg-red-100' : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'
                                    }`}
                                  title="Yêu thích"
                                >
                                  {likedMessages[item.id] ? <RiHeartFill className="w-4 h-4" /> : <RiHeartLine className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(item.text.replace(/<[^>]*>/g, ''), item.id)}
                                  className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                      ? copiedId === item.id ? 'text-green-400 bg-green-500/10' : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                                      : copiedId === item.id ? 'text-green-500 bg-green-100' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-200'
                                    }`}
                                  title={copiedId === item.id ? "Đã sao chép" : "Sao chép nội dung"}
                                >
                                  {copiedId === item.id ? <FaCheck className="w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && !isLoading && (
                    <div className="flex space-x-4 animate-fadeIn">
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden ${isDarkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                        <img
                          src={ROBOT_IMG_URL}
                          alt="AI Bot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`flex-1 p-4 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex space-x-4 animate-fadeIn">
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden ${isDarkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                        <img
                          src={ROBOT_IMG_URL}
                          alt="AI Bot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`flex-1 p-4 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <div className="flex items-center space-x-3">
                          <AiOutlineLoading3Quarters className="w-5 h-5 text-blue-500 animate-spin" />
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Đang xử lý câu trả lời...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-6 py-10">
                  <div className={`p-6 rounded-full ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
                    <BiMessageDetail className="w-16 h-16 text-blue-500" />
                  </div>
                  <div className="text-center space-y-2 max-w-md">
                    <p className="text-xl font-medium">Bắt đầu cuộc trò chuyện của bạn</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Hãy đặt câu hỏi hoặc chia sẻ những gì bạn đang suy nghĩ. Gemini AI sẽ tạo ra câu trả lời cho bạn.
                    </p>
                  </div>

                  <div className="w-full max-w-md flex flex-wrap justify-center gap-2 mt-4">
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedPrompt(prompt)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${isDarkMode
                            ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300'
                            : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <div className="relative mb-1">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'
                      }`}>
                      <BiMessageAltDetail className="w-5 h-5" />
                    </div>
                    <textarea
                      value={inputChat}
                      placeholder="Nhập tin nhắn của bạn..."
                      rows={1}
                      className={`w-full py-3 pl-12 pr-20 rounded-xl resize-none transition-all duration-200 ${isDarkMode
                          ? 'bg-gray-800 text-white border-gray-700 placeholder-gray-500 focus:border-blue-500'
                          : 'bg-white text-gray-800 border-gray-300 placeholder-gray-400 focus:border-blue-400'
                        } border focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400`}
                      onChange={(e) => setInputChat(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{
                        minHeight: '50px',
                        maxHeight: '120px',
                        height: 'auto'
                      }}
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                      }}
                    />
                  </div>
                  <button
                    className={`p-3 mb-2 rounded-xl transition-all duration-300 transform ${inputChat.trim()
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white shadow-md hover:shadow-blue-500/30'
                        : 'bg-gray-200 cursor-not-allowed text-gray-400'
                      }`}
                    onClick={handleChatDetail}
                    disabled={!inputChat.trim()}
                  >
                    <IoSend className={`w-5 h-5 ${inputChat.trim() ? 'transform rotate-0' : 'rotate-[-45deg]'
                      } transition-transform duration-300`} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Nhấn Enter để gửi, Shift+Enter để xuống dòng
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Được hỗ trợ bởi Gemini AI
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatDetail;