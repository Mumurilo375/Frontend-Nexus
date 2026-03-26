import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./pages/App";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Loja from "./pages/Loja";
import Ofertas from "./pages/Ofertas";
import ComoFunciona from "./pages/ComoFunciona";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ListagemUsuarios from "./pages/listagemUsuarios";
import Favoritos from "./pages/Favoritos";
import { RequireAdmin, RequireAuth } from "./components/auth/RouteGuards";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import MeusPedidos from "./pages/MeusPedidos";
import RouteScrollToTop from "./components/globals/RouteScrollToTop";
import UserConfig from "./pages/UserConfig";

function RootLayout() {
  return (
    <>
      <RouteScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
