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
        <button className="xl:hidden" onClick={onToggle}>
          <img src={IconMenu} alt="menu icon" className="w-10 h-10" />
        </button>
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-lg ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
      </div>
      <div className="mt-20 flex flex-col h-full">
        <button
          className={`px-4 py-2 flex items-center space-x-4 ${
            isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'
          } mb-10`}
          onClick={handleNewChat}
        >
          <img src={IconPlus} alt="plus icon" className="w-4 h-4" />
          <p className="font-semibold">Cuộc trò truyện mới</p>
        </button>
        <div className="space-y-4 flex-1 overflow-hidden">
          <p className="font-bold">Gần đây:</p>
          <div className="flex flex-col space-y-6 overflow-y-auto h-[calc(100vh-280px)]">
            {data.map((chat) => (
              <div key={chat.id}>
                <Link
                  to={`/chat/${chat.id}`}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <img src={IconChat} alt="chat icon" className="w-8 h-8" />
                    <p>{chat.title}</p>
                  </div>
                  <button onClick={(e) => {
                    e.preventDefault();
                    handleRemoveChat(chat.id);  
                  }}>
                    <img src={IconTrash} alt="chat icon" className="w-5 h-5" />
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