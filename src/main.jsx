import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import store from "./store/app.js";
import "./index.css";
import App from './App.jsx'
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
)
