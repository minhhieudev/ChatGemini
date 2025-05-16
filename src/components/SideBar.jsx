import PropType from "prop-types";
import IconMenu from "../assets/menu.png";
import { useDispatch, useSelector } from "react-redux";
import { addChat, removeChat } from "../store/chatSlice/index";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from "../context/ThemeContext";
import { FaPlus, FaTrash, FaGraduationCap, FaUniversity, FaBook, FaUserGraduate, FaQuestion, FaCalendarAlt, FaChalkboardTeacher } from 'react-icons/fa';
import { IoMdSunny, IoMdMoon } from "react-icons/io";
import logoImg from '../assets/logoDHPY.png';

// Hàm loại bỏ tất cả các thẻ HTML khỏi văn bản
const stripHtml = (html) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Mảng icons tập trung vào giáo dục và đại học
const chatIcons = [FaGraduationCap, FaUniversity, FaBook, FaUserGraduate, FaQuestion, FaCalendarAlt, FaChalkboardTeacher];

// Hàm tạo icon ngẫu nhiên cho chat
const getChatIcon = (chatId) => {
  // Sử dụng id để luôn lấy cùng một icon cho cùng một chat
  const iconIndex = parseInt(chatId.slice(0, 8), 16) % chatIcons.length;
  const IconComponent = chatIcons[iconIndex];
  return IconComponent;
};

const SideBar = ({ onToggle }) => {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chat);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleNewChat = () => {
    // Kiểm tra và xóa các chat trống trước khi tạo mới
    const emptyChatIds = data
      .filter(chat => !chat.messages || chat.messages.length === 0)
      .map(chat => chat.id);
    
    // Xóa tất cả các chat trống
    emptyChatIds.forEach(id => {
      dispatch(removeChat(id));
    });
    
    // Tạo chat mới
    const newChatId = uuidv4();
    dispatch(addChat(newChatId));
    navigate(`/chat/${newChatId}`);
  };

  const handleRemoveChat = (id) => {
    dispatch(removeChat(id));
    navigate('/')
  };

  return (
    <div className={`w-[280px] h-screen flex flex-col ${
      isDarkMode 
        ? 'bg-gradient-to-b from-blue-900 to-blue-800 text-white' 
        : 'bg-gradient-to-b from-blue-50 to-blue-100 text-gray-800'
    } shadow-lg transition-all duration-300`}>
      <div className="p-4 border-b border-opacity-20 border-gray-500">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button className="xl:hidden hover:opacity-80 transition-opacity" onClick={onToggle}>
              <img src={IconMenu} alt="menu icon" className="w-7 h-7" />
            </button>
            <img src={logoImg} alt="Logo ĐH Phú Yên" className="w-10 h-10 rounded-full shadow-md border-2 border-blue-500 bg-white" />
            <div className="flex flex-col">
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text leading-tight">ĐẠI HỌC PHÚ YÊN</span>
              <span className="text-xs text-blue-500 font-semibold tracking-wide">Tư vấn tuyển sinh 2024</span>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-blue-200 text-indigo-700 hover:bg-blue-300'
            }`}
          >
            {isDarkMode ? <IoMdSunny className="w-5 h-5" /> : <IoMdMoon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col h-full">
        <button
          className={`px-4 py-3 flex items-center space-x-3 rounded-xl transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20' 
              : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
          } mb-6`}
          onClick={handleNewChat}
        >
          <FaPlus className="w-4 h-4" />
          <p className="font-medium">Hỏi đáp tuyển sinh</p>
        </button>

        <div className="space-y-3 flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <p className={`font-bold text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Trò chuyện gần đây:
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {data.length} hội thoại
            </p>
          </div>

          <div className="flex flex-col space-y-2 overflow-y-auto h-[calc(100vh-220px)] pr-2 custom-scrollbar">
            {data.map((chat) => {
              const IconComponent = getChatIcon(chat.id);
              return (
                <div key={chat.id} className="group">
                  <Link
                    to={`/chat/${chat.id}`}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 hover:shadow-md hover:shadow-blue-500/5' 
                        : 'bg-white/80 hover:bg-white hover:shadow-md'
                    } border border-transparent hover:border-blue-400/30`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                          : 'bg-gradient-to-br from-blue-400 to-blue-500'
                      } text-white`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <p className="font-medium truncate max-w-[150px]">
                        {stripHtml(chat.title)}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveChat(chat.id);  
                      }}
                      className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                          : 'bg-red-100 hover:bg-red-200 text-red-500'
                      }`}
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`rounded-lg text-xs text-center ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>© 2024 Đại học Phú Yên • Tư vấn tuyển sinh</p>
        </div>
      </div>
    </div>
  );
};

SideBar.propTypes = {
  onToggle: PropType.func,
};

export default SideBar;