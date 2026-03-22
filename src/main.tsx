import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./pages/App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Loja from "./pages/Loja";
import Ofertas from "./pages/Ofertas";
import ComoFunciona from "./pages/ComoFunciona";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ListagemUsuarios from "./pages/listagemUsuarios";
import Favoritos from "./pages/Favoritos";
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
  },
  {
    path: "/login",

    element: <Login />,
  },
  {
    path: "/cadastro",

    element: <Cadastro />,
  },
  {
    path: "/listagem-usuarios",

    element: <ListagemUsuarios />,
  },
  {
    path: "/favoritos",

    element: <Favoritos />,
  },
]);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
