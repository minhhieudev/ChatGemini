import { Outlet } from "react-router-dom";
import SideBar from "./components/SideBar";
import { useTheme } from "./context/ThemeContext";

function App() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`h-screen flex ${
      isDarkMode 
        ? 'bg-primaryBg-default-dark text-white' 
        : 'bg-primaryBg-default-light text-gray-800'
    }`}>
      <div className="xl:block hidden">
        <SideBar />
      </div>
      <Outlet />
    </div>
  );
}

export default App;