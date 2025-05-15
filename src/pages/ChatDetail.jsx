import { saveAs } from 'file-saver';
import { useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BiMessageAltDetail, BiMessageDetail } from "react-icons/bi";
import { FaCheck, FaCopy, FaEdit, FaFileDownload, FaRegThumbsDown, FaRegThumbsUp } from "react-icons/fa";
import { IoImage, IoMic, IoRefresh, IoSend } from "react-icons/io5";
import { RiDeleteBin6Line, RiHeartFill, RiHeartLine, RiShareLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import IconMenu from "../assets/menu.png";
import UserAvatar from "../assets/nmbvsylxgzcq3uppsfiu.png";
import SideBar from "../components/SideBar";
import { useTheme } from "../context/ThemeContext";
import Gemini from "../gemini";
import { addBotMessage, addChat, addUserMessage, removeChat, setNameChat } from "../store/chatSlice";
const ROBOT_IMG_URL = "https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg";

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
  const fileInputRef = useRef(null);
  const suggestedPrompts = [
    "Viết đoạn văn mô tả về biển Việt Nam",
    "Giải thích cách hoạt động của trí tuệ nhân tạo",
    "Đề xuất 5 ý tưởng về lập trình web",
    "Viết một đoạn code mẫu bằng JavaScript"
  ];

  useEffect(() => {
    if (data && data.length > 0) {
      const chat = data.find((chat) => chat.id === id);
      if (chat) {
        setDataDetail(chat);
        setMessageDetail(chat.messages || []);
      }
    }
  }, [data, id]);

  // Kiểm tra và xóa chat rỗng khi điều hướng đi
  useEffect(() => {
    // Lưu ID hiện tại để sử dụng trong cleanup function
    const currentChatId = id;
    
    return () => {
      // Chỉ thực hiện khi điều hướng đi khỏi một chat cụ thể (không phải trang info)
      if (currentChatId && currentChatId !== 'info') {
        const chat = data.find(chat => chat.id === currentChatId);
        // Nếu chat tồn tại và không có tin nhắn nào, xóa nó
        if (chat && (!chat.messages || chat.messages.length === 0)) {
          dispatch(removeChat(currentChatId));
          console.log("Đã xóa cuộc trò chuyện trống:", currentChatId);
        }
      }
    };
  }, [id, data, dispatch]);

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

  // Debug effect to check if data is properly loaded
  useEffect(() => {
    console.log("Chat data from Redux store:", data);
    // Check localStorage directly
    const persistedRoot = localStorage.getItem('persist:root');
    if (persistedRoot) {
      console.log("Data exists in localStorage:", persistedRoot);
      try {
        const parsedData = JSON.parse(persistedRoot);
        console.log("Parsed localStorage data:", parsedData);
      } catch (e) {
        console.error("Error parsing localStorage data:", e);
      }
    } else {
      console.log("No data in localStorage");
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

      // Hiển thị loading state
      setIsLoading(true);
      
      // Thêm hiệu ứng typing (mô phỏng)
      setIsTyping(true);
      
      // Xử lý bot response
      const chatText = await Gemini(currentMessage, messageDetail);
      
      // Tắt hiệu ứng typing
      setIsTyping(false);
      
      if(dataDetail.title === 'Chat'){
        const promptName = `This is a new chat, and user ask about ${currentMessage}. No rely and comment just give me a name for this chat, Max length is 10 characters`;
        const newTitle = await Gemini(promptName);
        dispatch(setNameChat({newTitle, chatId: id}));
      }

      if (chatText) {
        dispatch(addBotMessage({
          idChat: id,
          botMess: chatText
        }));
      }

      setIsLoading(false);
    } else {
      // Tạo chat mới khi ở trang info hoặc không có id
      const newChatId = uuidv4();
      dispatch(addChat(newChatId));
      
      // Chờ một chút để đảm bảo chat được tạo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Điều hướng đến chat mới
      navigate(`/chat/${newChatId}`);
      
      // Thêm tin nhắn người dùng
      dispatch(addUserMessage({
        idChat: newChatId,
        userMess: currentMessage
      }));

      setIsLoading(true);
      const chatText = await Gemini(currentMessage, []);
      
      if (chatText) {
        dispatch(addBotMessage({
          idChat: newChatId,
          botMess: chatText
        }));
        
        // Đặt tên cho chat mới dựa trên tin nhắn đầu tiên
        const promptName = `This is a new chat, and user ask about ${currentMessage}. No rely and comment just give me a name for this chat, Max length is 10 characters`;
        const newTitle = await Gemini(promptName);
        dispatch(setNameChat({newTitle, chatId: newChatId}));
      }
      
      setIsLoading(false);
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
  };

  const toggleMessageExpansion = (id) => {
    setExpandedMessages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const handleFileUpload = () => {
    fileInputRef.current.click();
  };
  
  const onFileSelected = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      // Xử lý file được chọn ở đây - có thể tạo một message mới với file này
      const file = files[0];
      setInputChat(prev => prev + ` [File đính kèm: ${file.name}]`);
    }
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
      const blob = new Blob([content], {type: "text/markdown;charset=utf-8"});
      const fileName = `chat-${dataDetail.title?.replace(/<[^>]*>/g, '').replace(/\s+/g, '-').toLowerCase() || 'export'}-${new Date().toISOString().slice(0,10)}.md`;
      saveAs(blob, fileName);
    }
  };

  // Chức năng chia sẻ cuộc trò chuyện
  const handleShareChat = () => {
    // Tạo URL để chia sẻ
    const shareUrl = window.location.href;
    
    // Kiểm tra API Clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert("Đã sao chép đường dẫn chia sẻ vào clipboard!");
        })
        .catch(err => {
          console.error('Không thể sao chép: ', err);
          // Phương án dự phòng
          prompt("Sao chép đường dẫn này để chia sẻ:", shareUrl);
        });
    } else {
      // Hỗ trợ trình duyệt cũ
      prompt("Sao chép đường dẫn này để chia sẻ:", shareUrl);
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
    <div className={`flex-1 h-screen flex flex-col overflow-hidden ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'
    }`}>
      <div className={`flex items-center justify-between px-5 py-3 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
          : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
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
                <BiMessageDetail className="w-5 h-5 text-blue-500" />
              </div>
              <h1 className={`font-medium truncate text-lg ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {typeof dataDetail.title === 'string' 
                  ? dataDetail.title.replace(/<[^>]*>/g, '') || 'New Chat' 
                  : 'New Chat'}
              </h1>
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
              <button 
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-blue-500/20 text-gray-300 hover:text-blue-400' 
                    : 'hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                }`}
                title="Chia sẻ"
                onClick={handleShareChat}
              >
                <RiShareLine className="w-4 h-4" />
              </button>
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

      <div className="flex-1 flex flex-col overflow-hidden max-w-[900px] w-full mx-auto py-4 px-4">
        {id ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
              {Array.isArray(messageDetail) && messageDetail.length > 0 ? (
                <>
                  {messageDetail.map((item) => (
                    <div key={item.id} className="animate-fadeIn">
                      <div 
                        className={`flex space-x-4 ${item.isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
                        onMouseEnter={() => setSelectedMessage(item.id)}
                        onMouseLeave={() => setSelectedMessage(null)}
                      >
                        <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden ${
                          isDarkMode 
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
                            <div className={`absolute right-4 -mt-3 flex items-center space-x-1 ${
                              isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-600'
                            } rounded-full shadow-md px-2 py-1 border ${
                              isDarkMode ? 'border-gray-600' : 'border-gray-200'
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
                              <div 
                                className={`prose prose-lg max-w-none ${
                                  expandedMessages[item.id] ? '' : 'max-h-[400px] overflow-y-auto'
                                }`}
                                dangerouslySetInnerHTML={{ __html: item.text }} 
                              />
                            ) : (
                              <p className="text-lg">{item.text}</p>
                            )}
                            
                          </div>
                          
                          {item.isBot && (
                            <div className={`flex items-center justify-between p-2 border-t ${
                              isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'
                            }`}>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => rateMessage(item.id, true)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    isDarkMode 
                                      ? 'text-gray-400 hover:text-green-400 hover:bg-gray-700' 
                                      : 'text-gray-500 hover:text-green-500 hover:bg-gray-200'
                                  }`}
                                  title="Phản hồi tốt"
                                >
                                  <FaRegThumbsUp className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => rateMessage(item.id, false)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    isDarkMode 
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
                                    className={`p-1.5 rounded-full transition-colors ${
                                      isDarkMode 
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
                                  className={`p-1.5 rounded-full transition-colors ${
                                    isDarkMode 
                                      ? likedMessages[item.id] ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                                      : likedMessages[item.id] ? 'text-red-500 bg-red-100' : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'
                                  }`}
                                  title="Yêu thích"
                                >
                                  {likedMessages[item.id] ? <RiHeartFill className="w-4 h-4" /> : <RiHeartLine className="w-4 h-4" />}
                                </button>
                                <button 
                                  onClick={() => copyToClipboard(item.text.replace(/<[^>]*>/g, ''), item.id)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    isDarkMode 
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
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden ${
                        isDarkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        <img 
                          src={ROBOT_IMG_URL} 
                          alt="AI Bot" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`flex-1 p-4 rounded-2xl shadow-sm border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden ${
                        isDarkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        <img 
                          src={ROBOT_IMG_URL} 
                          alt="AI Bot" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`flex-1 p-4 rounded-2xl shadow-sm border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                          isDarkMode 
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
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-500'
                    }`}>
                      <BiMessageAltDetail className="w-5 h-5" />
                    </div>
                    <textarea
                      value={inputChat}
                      placeholder="Nhập tin nhắn của bạn..."
                      rows={1}
                      className={`w-full py-3 pl-12 pr-20 rounded-xl resize-none transition-all duration-200 ${
                        isDarkMode 
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
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
                      <button 
                        onClick={handleFileUpload}
                        className={`p-1.5 rounded-full transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                        }`}
                        title="Tải lên hình ảnh"
                      >
                        <IoImage className="w-5 h-5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={onFileSelected}
                        accept="image/*"
                        className="hidden" 
                      />
                      <button 
                        className={`p-1.5 rounded-full transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                        }`}
                        title="Microphone"
                      >
                        <IoMic className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <button
                    className={`p-3 rounded-xl transition-all duration-300 transform ${
                      inputChat.trim() 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white shadow-md hover:shadow-blue-500/30' 
                        : 'bg-gray-200 cursor-not-allowed text-gray-400'
                    }`}
                    onClick={handleChatDetail}
                    disabled={!inputChat.trim()}
                  >
                    <IoSend className={`w-5 h-5 ${
                      inputChat.trim() ? 'transform rotate-0' : 'rotate-[-45deg]'
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
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col space-y-8">
              <div className="text-center space-y-3 max-w-2xl mx-auto pt-8">
                <h2 className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-[36px] inline-block text-transparent bg-clip-text font-bold">
                  Xin Chào
                </h2>
                <p className={`text-2xl ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Hôm nay tôi có thể giúp gì cho bạn?</p>
                <p className={`max-w-lg mx-auto text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Gemini AI có thể giúp bạn viết, lập kế hoạch, học tập, và nhiều hơn nữa. Hãy bắt đầu bằng một câu hỏi hoặc từ các gợi ý dưới đây.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { 
                    title: "Lên kế hoạch bữa ăn", 
                    desc: "Tạo thực đơn phù hợp cho gia đình hoặc sự kiện của bạn", 
                    icon: "🍽️",
                    prompt: "Gợi ý thực đơn cho bữa tiệc 5 người với các món Việt Nam"
                  },
                  { 
                    title: "Học ngôn ngữ mới", 
                    desc: "Khám phá từ vựng và ngữ pháp của nhiều ngôn ngữ", 
                    icon: "📚",
                    prompt: "Liệt kê 10 từ vựng tiếng Anh thông dụng về công nghệ"
                  },
                  { 
                    title: "Viết thư xin việc", 
                    desc: "Tạo email và thư xin việc chuyên nghiệp", 
                    icon: "✉️",
                    prompt: "Viết một email xin việc cho vị trí lập trình viên web"
                  },
                  { 
                    title: "Giải thích khái niệm", 
                    desc: "Hiểu rõ các khái niệm phức tạp một cách đơn giản", 
                    icon: "🧠",
                    prompt: "Giải thích khái niệm trí tuệ nhân tạo cho trẻ 10 tuổi"
                  },
                  { 
                    title: "Lập kế hoạch du lịch", 
                    desc: "Tạo lịch trình cho chuyến đi của bạn", 
                    icon: "✈️",
                    prompt: "Lên kế hoạch du lịch Đà Nẵng 3 ngày 2 đêm"
                  },
                  { 
                    title: "Luyện tập lập trình", 
                    desc: "Học code và nhận gợi ý về các bài tập", 
                    icon: "💻",
                    prompt: "Viết một hàm JavaScript để kiểm tra số nguyên tố"
                  },
                  { 
                    title: "Tìm hiểu sức khỏe", 
                    desc: "Thông tin về dinh dưỡng và tập luyện", 
                    icon: "💪",
                    prompt: "Gợi ý các bài tập thể dục tại nhà không cần dụng cụ"
                  },
                  { 
                    title: "Hỏi đáp công nghệ", 
                    desc: "Giải đáp thắc mắc về các sản phẩm và xu hướng", 
                    icon: "🔍",
                    prompt: "So sánh ưu nhược điểm của React và Vue.js"
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
                        <p className={`font-medium ${
                          isDarkMode 
                            ? 'text-gray-100 group-hover:text-white' 
                            : 'text-gray-800 group-hover:text-gray-900'
                        }`}>
                          {item.title}
                        </p>
                        <p className={`text-xs mt-1 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add new chat input field directly on the home screen */}
              <div className={`max-w-3xl mx-auto w-full mt-8 rounded-xl shadow-md p-5 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
                    <BiMessageAltDetail className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Bắt đầu cuộc trò chuyện mới
                  </p>
                </div>
                <div className="relative mb-1">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1">
                      <textarea
                        value={inputChat}
                        placeholder="Hỏi tôi bất cứ điều gì..."
                        rows={1}
                        className={`w-full py-3 px-4 rounded-xl resize-none transition-all duration-200 ${
                          isDarkMode 
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
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
                        <button 
                          onClick={handleFileUpload}
                          className={`p-1.5 rounded-full transition-colors ${
                            isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                          }`}
                          title="Tải lên hình ảnh"
                        >
                          <IoImage className="w-5 h-5" />
                        </button>
                        <button 
                          className={`p-1.5 rounded-full transition-colors ${
                            isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                          }`}
                          title="Microphone"
                        >
                          <IoMic className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <button
                      className={`p-3 rounded-xl transition-all duration-300 transform ${
                        inputChat.trim() 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white shadow-md hover:shadow-blue-500/30' 
                          : isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                      } ${!inputChat.trim() && 'cursor-not-allowed'}`}
                      onClick={handleChatDetail}
                      disabled={!inputChat.trim()}
                    >
                      <IoSend className={`w-5 h-5 ${
                        inputChat.trim() ? 'transform rotate-0' : 'rotate-[-45deg]'
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDetail;