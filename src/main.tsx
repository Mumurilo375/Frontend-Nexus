import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { RequireAdmin, RequireAuth } from "./components/auth/RouteGuards";
import RootLayout from "./components/globals/RootLayout";
import App from "./pages/App";
import Cadastro from "./pages/Cadastro";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import ComoFunciona from "./pages/ComoFunciona";
import Favoritos from "./pages/Favoritos";
import ListagemUsuarios from "./pages/listagemUsuarios";
import Login from "./pages/Login";
import Loja from "./pages/Loja";
import MeusPedidos from "./pages/MeusPedidos";
import Ofertas from "./pages/Ofertas";
import UserConfig from "./pages/UserConfig";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <App /> },
      { path: "/loja", element: <Loja /> },
      { path: "/ofertas", element: <Ofertas /> },
      { path: "/comofunciona", element: <ComoFunciona /> },
      { path: "/login", element: <Login /> },
      { path: "/cadastro", element: <Cadastro /> },
      {
        path: "/listagem-usuarios",
        element: (
          <RequireAdmin>
            <ListagemUsuarios />
          </RequireAdmin>
        ),
      },
      {
        path: "/favoritos",
        element: (
          <RequireAuth>
            <Favoritos />
          </RequireAuth>
        ),
      },
      {
        path: "/carrinho",
        element: (
          <RequireAuth>
            <Carrinho />
          </RequireAuth>
        ),
      },
      {
        path: "/checkout",
        element: (
          <RequireAuth>
            <Checkout />
          </RequireAuth>
        ),
      },
      {
        path: "/meus-pedidos",
        element: (
          <RequireAuth>
            <MeusPedidos />
          </RequireAuth>
        ),
      },
      {
        path: "/configuracoes",
        element: (
          <RequireAuth>
            <UserConfig />
          </RequireAuth>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
