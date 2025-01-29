import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ImgTemp from "../assets/temp.jpeg";
import IconMenu from "../assets/menu.png";
import SideBar from "../components/SideBar";
import IconStar from "../assets/star.png";
import Gemini from "../gemini";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, setNameChat, addChat, addUserMessage, addBotMessage } from "../store/chatSlice";
import { v4 as uuidv4 } from "uuid";
import { useTheme } from "../context/ThemeContext";
import { IoSend } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { RiRobot2Fill } from "react-icons/ri";
import { BiMessageDetail, BiMessageAltDetail } from "react-icons/bi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { SiOpenai } from "react-icons/si";

const ChatDetail = () => {
  const [menuToggle, setMenuToggle] = useState(true);
  const [dataDetail, setDataDetail] = useState([]);
  const [messageDetail, setMessageDetail] = useState([]);
  const [inputChat, setInputChat] = useState("");
  const { id } = useParams();
  const { data } = useSelector((state) => state.chat);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const chat = data.find((chat) => chat.id === id);
      if (chat) {
        setDataDetail(chat);
        setMessageDetail(chat.messages || []);
      }
    }
  }, [data, id]);

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

  const handleChatDetail = async () => {
    if (!inputChat.trim()) return;

    const currentMessage = inputChat;
    setInputChat(""); // Clear input ngay lập tức

    if (id) {
      // Thêm tin nhắn người dùng ngay lập tức
      dispatch(addUserMessage({
        idChat: id,
        userMess: currentMessage
      }));

      // Hiển thị loading state
      setIsLoading(true);

      // Xử lý bot response
      const chatText = await Gemini(currentMessage, messageDetail);
      
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
      const newChatId = uuidv4();
      dispatch(addChat(newChatId));
      
      await new Promise(resolve => setTimeout(resolve, 100));
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

  return (
    <div className={`flex-1 p-4 ${
      isDarkMode ? 'text-white' : 'text-gray-800'
    }`}>
      <div className={`flex items-center space-x-4 p-4 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button 
          onClick={() => setMenuToggle(!menuToggle)}
          className="xl:hidden hover:opacity-80 transition-opacity"
        >
          <img src={IconMenu} alt="menu icon" className="w-8 h-8" />
        </button>
        
        <Link 
          to="/" 
          className={`flex items-center space-x-3 hover:opacity-80 transition-all duration-200 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}
        >
          <SiOpenai className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
            {/* Gemini AI Chat with minhhieudev */}
            Gemini AI Chat 
          </h1>
        </Link>
      </div>

      {menuToggle && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setMenuToggle(false)}
          />
          {/* Sidebar */}
          <div 
            ref={sidebarRef}
            className="relative w-[280px] h-full"
          >
            <SideBar onToggle={() => setMenuToggle(false)} />
          </div>
        </div>
      )}

      <div className="max-w-[900px] w-full mx-auto mt-8 space-y-8">
        {id ? (
          <div className="flex flex-col space-y-6 p-4 h-[calc(100vh-240px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {Array.isArray(messageDetail) && messageDetail.length > 0 ? (
              <>
                {messageDetail.map((item) => (
                  <div 
                    className={`flex space-x-4 ${item.isBot ? '' : 'flex-row-reverse space-x-reverse'} 
                      animate-fadeIn`} 
                    key={item.id}
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg ${
                      isDarkMode 
                        ? item.isBot ? 'bg-blue-600' : 'bg-green-600' 
                        : item.isBot ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {item.isBot ? 
                        <RiRobot2Fill className="w-6 h-6 text-white" /> : 
                        <FaUser className="w-6 h-6 text-white" />
                      }
                    </div>
                    <div className={`flex-1 p-4 rounded-lg shadow-md transition-all duration-200 ${
                      isDarkMode
                        ? item.isBot ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-700 hover:bg-gray-650'
                        : item.isBot ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                    }`}>
                      {item.isBot ? (
                        <div 
                          className="prose prose-lg max-w-none"
                          dangerouslySetInnerHTML={{ __html: item.text }} 
                        />
                      ) : (
                        <p className="text-lg">{item.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex space-x-4 animate-fadeIn">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg ${
                      isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      <RiRobot2Fill className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex-1 p-4 rounded-lg shadow-md ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <BiMessageDetail className="w-16 h-16 text-blue-500" />
                <p className="text-lg">Bắt đầu cuộc trò chuyện của bạn</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col space-y-5">
            <div className="space-y-1">
              <h2 className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 text-[30px] inline-block text-transparent bg-clip-text font-bold">
                Xin Chào
              </h2>
              <p className={`text-3xl ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Hôm nay tôi có thể giúp gì cho bạn</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Lên kế hoạch bữa ăn", icon: "🍽️" },
                { title: "Cụm từ ngôn ngữ mới", icon: "📚" },
                { title: "Bí quyết viết thư xin việc", icon: "✉️" },
                { title: "Tạo hình ảnh với AI", icon: "🎨", image: ImgTemp }
              ].map((item, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-xl transition-all duration-300 transform hover:scale-105 cursor-pointer 
                    ${isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-500 shadow-lg shadow-blue-500/10' 
                      : 'bg-white hover:shadow-xl border-2 border-gray-100 hover:border-blue-400 shadow-lg'
                    }
                    group relative overflow-hidden
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex flex-col items-center space-y-4 relative z-10">
                    {item.image ? (
                      <img src={item.image} alt="temp" className="w-24 h-24 rounded-lg shadow-md" />
                    ) : (
                      <span className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </span>
                    )}
                    <p className={`text-center font-medium ${
                      isDarkMode 
                        ? 'text-gray-200 group-hover:text-white' 
                        : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative w-full">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-500'
              }`}>
                <BiMessageAltDetail className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={inputChat}
                placeholder="Nhập tin nhắn của bạn..."
                className={`w-full py-4 pl-12 pr-4 rounded-2xl transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-500 focus:border-blue-500' 
                    : 'bg-white text-gray-800 border-gray-300 placeholder-gray-400 focus:border-blue-400'
                } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400`}
                onChange={(e) => setInputChat(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              className={`p-4 rounded-2xl transition-all duration-300 transform ${
                inputChat.trim() 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-95 text-white shadow-lg hover:shadow-blue-500/50' 
                  : 'bg-gray-200 cursor-not-allowed text-gray-400'
              }`}
              onClick={handleChatDetail}
              disabled={!inputChat.trim()}
            >
              <IoSend className={`w-6 h-6 ${
                inputChat.trim() ? 'transform rotate-0' : 'rotate-[-45deg]'
              } transition-transform duration-300`} />
            </button>
          </div>
        
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;