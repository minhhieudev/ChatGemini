import { Outlet } from "react-router-dom";
import SideBar from "./components/SideBar";
import { useTheme } from "./context/ThemeContext";
import backgroundImg from './assets/backgroundDHPY.png';

function App() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`h-screen flex relative overflow-hidden ${
      isDarkMode 
        ? 'bg-primaryBg-default-dark text-white' 
        : 'bg-primaryBg-default-light text-gray-800'
    }`}>
      {/* Background image */}
      <img 
        src={backgroundImg} 
        alt="Background ĐH Phú Yên" 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 pointer-events-none select-none" 
        style={{filter: isDarkMode ? 'brightness(0.5) blur(2px)' : 'brightness(0.9) blur(1.5px)'}}
      />
      <div className="xl:block hidden z-10">
        <SideBar />
      </div>
      <div className="flex-1 z-10">
        <Outlet />
      </div>
    </div>
  );
}

export default App;