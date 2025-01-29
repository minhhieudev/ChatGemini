import PropType from "prop-types";
import IconPlus from "../assets/plusIcon.png";
import IconChat from "../assets/chat.png";
import IconTrash from "../assets/remove.png";
import IconMenu from "../assets/menu.png";
import { useDispatch, useSelector } from "react-redux";
import { addChat, removeChat } from "../store/chatSlice";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from "../context/ThemeContext";

const SideBar = ({ onToggle }) => {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.chat);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleNewChat = () => {
    const newChatId = uuidv4();
    dispatch(addChat(newChatId));
    navigate(`/chat/${newChatId}`);
  };

  const handleRemoveChat = (id) => {
    dispatch(removeChat(id));
    navigate('/')
  };

  return (
    <div className={`w-[280px] h-screen p-8 flex flex-col ${
      isDarkMode ? 'bg-primaryBg-sideBar-dark text-white' : 'bg-primaryBg-sideBar-light text-gray-800'
    }`}>
      <div className="flex justify-between items-center">
        <button className="xl:hidden hover:opacity-80 transition-opacity" onClick={onToggle}>
          <img src={IconMenu} alt="menu icon" className="w-8 h-8" />
        </button>
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-white hover:bg-gray-200' 
              : 'bg-gray-400 hover:bg-gray-500'
          }`}
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
      </div>
      <div className="mt-20 flex flex-col h-full">
        <button
          className={`px-4 py-3 flex items-center space-x-4 rounded-lg transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
          } mb-10`}
          onClick={handleNewChat}
        >
          <img src={IconPlus} alt="plus icon" className="w-5 h-5" />
          <p className="font-medium">Cuộc trò truyện mới</p>
        </button>
        <div className="space-y-4 flex-1 overflow-hidden">
          <p className="font-bold text-lg px-2">Gần đây:</p>
          <div className="flex flex-col space-y-3 overflow-y-auto h-[calc(100vh-280px)] pr-2">
            {data.map((chat) => (
              <div key={chat.id}>
                <Link
                  to={`/chat/${chat.id}`}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-600 text-white hover:bg-gray-700' 
                      : 'bg-gray-300 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <img src={IconChat} alt="chat icon" className="w-5 h-5" />
                    </div>
                    <p className="font-medium truncate max-w-[150px]">{chat.title}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveChat(chat.id);  
                    }}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isDarkMode 
                        ? 'hover:bg-red-900/50' 
                        : 'hover:bg-red-100'
                    }`}
                  >
                    <img 
                      src={IconTrash} 
                      alt="delete chat" 
                      className="w-5 h-5 transition-colors duration-200 filter hover:brightness-125"
                      style={{ filter: 'invert(22%) sepia(96%) saturate(5054%) hue-rotate(353deg) brightness(98%) contrast(93%)' }}
                    />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

SideBar.propTypes = {
  onToggle: PropType.func,
};

export default SideBar;