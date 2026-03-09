import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Loja from "./pages/Loja.jsx";
import Ofertas from "./pages/Ofertas.jsx";
import ComoFunciona from "./pages/ComoFunciona.jsx";
import Login from "./pages/Login.jsx";
import Cadastrar from "./pages/Cadastro.js";
const router = createBrowserRouter([
  {
    path: "/",

    element: <App />,
  },
  {
    path: "/loja",

    element: <Loja />,
  },
  {
    path: "/ofertas",

    element: <Ofertas />,
  },
  {
    path: "/comofunciona",

    element: <ComoFunciona />,
  }, {
    path: "/login",

    element: <Login />,
  },
  {
    path: "/cadastro",

    element: <Cadastrar />,
  }
]);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
