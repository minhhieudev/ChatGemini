import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import store, { persistor } from "./store/app.js";
import { PersistGate } from 'redux-persist/integration/react';
import "./index.css";
import ChatDetail from "./pages/ChatDetail.jsx";
import UserGuide from "./pages/UserGuide.jsx";
import { ThemeProvider } from "./context/ThemeContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/chat/info" />,
      },
      {
        path: "/chat/info",
        element: <ChatDetail />,
      },
      {
        path: "/chat/:id",
        element: <ChatDetail />,
      },
    ],
  },
  {
    path: "/guide",
    element: <UserGuide />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <Provider store={store}>
        <PersistGate 
          loading={<div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3">Đang tải dữ liệu...</p>
            </div>
          </div>}
          persistor={persistor}
          onBeforeLift={() => {
            // Optional: Debug persistence
            console.log("Redux state about to be hydrated");
          }}
        >
          <RouterProvider router={router} />
        </PersistGate>
      </Provider>
    </ThemeProvider>
  </React.StrictMode>
);