import { Outlet } from "react-router-dom";
import SideBar from "./components/SideBar";
import { useEffect, useState } from "react";
import Gemini from './gemini'

function App() {
  const [hasGeminiBeenCalled, setHasGeminiBeenCalled] = useState(false);

  useEffect(() => {
    if (hasGeminiBeenCalled) {
      console.log('Khaaaaaaaaaaaaaaaaa')
      Gemini('JS là gì?')
    }
  }, [hasGeminiBeenCalled]);

  const handleGeminiCall = () => {
    setHasGeminiBeenCalled(true);
  };

  return (
    <>
      <div className="bg-primaryBg-default h-screen flex">
        <div className="xl:block hidden">
          <SideBar />
        </div>
        <div className="flex justify-center items-center h-full">
          <button onClick={handleGeminiCall} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Call Gemini
          </button>
        </div>
      </div>
    </>
  );
}

export default App;