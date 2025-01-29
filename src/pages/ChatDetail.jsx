import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImgTemp from "../assets/temp.jpeg";
import IconMenu from "../assets/menu.png";
import SideBar from "../components/SideBar";

const ChatDetail = () => {
  const [menuToggle, setMenuToggle] = useState(true);
  const [inputChat, setInputChat] = useState("");
  const { id } = useParams();


  return (
    <div className="text-white xl:w-[80%] w-full relative">
      <div className="flex items-center space-x-2 p-4">
        <button onClick={() => setMenuToggle(!menuToggle)}>
          <img src={IconMenu} alt="menu icon" className="w-8 h-8 xl:hidden" />
        </button>
        <h1 className="text-xl uppercase font-bold ">Gemini</h1>
      </div>
      {menuToggle && (
        <div className="absolute h-full top-0 left-0 xl:hidden">
          <SideBar onToggle={() => setMenuToggle(!menuToggle)} />
        </div>
      )}
      <div className="max-w-[90%] w-full mx-auto mt-20 space-y-10">
        {id ? (
          <div className="flex flex-col space-y-4 p-4 h-[400px] overflow-x-hidden overflow-y-auto">
            Chat
          </div>
        ) : (
          <div className="flex flex-col space-y-5">
            <div className="space-y-1">
              <h2 className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 text-[30px] inline-block text-transparent bg-clip-text font-bold ">
                Xin Chào
              </h2>
              <p className="text-3xl">Hôm nay tôi có thể giúp gì cho bạn</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-[200px] h-[200px] bg-primaryBg-sideBar flex items-center justify-center rounded-lg">
                <p>Lên kế hoạch bữa ăn</p>
              </div>
              <div className="w-[200px] h-[200px] bg-primaryBg-sideBar flex items-center justify-center rounded-lg">
                <p>Cụm từ ngôn ngữ mới</p>
              </div>
              <div className="w-[200px] h-[200px] bg-primaryBg-sideBar flex items-center justify-center rounded-lg">
                <p>Bí quyết viết thư xin việc</p>
              </div>
              <div className="w-[200px] h-[200px] bg-primaryBg-sideBar flex items-center justify-center rounded-lg flex-col">
                <p>Tạo hình ảnh với AI</p>
                <img src={ImgTemp} alt="temp" className="w-[150px] h-[150px]" />
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center space-x-4 w-full">
          <input
            type="text"
            value={inputChat}
            placeholder="Nhập câu lệnh tại đây"
            className="p-4 rounded-lg bg-primaryBg-default w-[90%] border"
            onChange={(e) => setInputChat(e.target.value)}
          />
          <button
            className="p-4 rounded-lg bg-green-500 text-white"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;
