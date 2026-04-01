import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { RequireAdmin, RequireAuth } from "./components/auth/RouteGuards";
import { AuthProvider } from "./contexts/AuthContext";
import RootLayout from "./components/globals/RootLayout";
import App from "./pages/App";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCategoryForm from "./pages/admin/AdminCategoryForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminGameForm from "./pages/admin/AdminGameForm";
import AdminGameListings from "./pages/admin/AdminGameListings";
import AdminGames from "./pages/admin/AdminGames";
import AdminListingForm from "./pages/admin/AdminListingForm";
import Cadastro from "./pages/Cadastro";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import ComoFunciona from "./pages/ComoFunciona";
import Favoritos from "./pages/Favoritos";
import Login from "./pages/Login";
import Loja from "./pages/Loja";
import MeusPedidos from "./pages/MeusPedidos";
import Ofertas from "./pages/Ofertas";
import UserConfig from "./pages/UserConfig";
import ListingDetails from "./pages/ListingDetails";

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
      { path: "/loja/:listingId", element: <ListingDetails /> },
      {
        path: "/admin",
        element: (
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/games",
        element: (
          <RequireAdmin>
            <AdminGames />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/games/new",
        element: (
          <RequireAdmin>
            <AdminGameForm />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/games/:id/edit",
        element: (
          <RequireAdmin>
            <AdminGameForm />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/games/:gameId/listings",
        element: (
          <RequireAdmin>
            <AdminGameListings />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/games/:gameId/listings/new",
        element: (
          <RequireAdmin>
            <AdminListingForm />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/games/:gameId/listings/:listingId/edit",
        element: (
          <RequireAdmin>
            <AdminListingForm />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/categories",
        element: (
          <RequireAdmin>
            <AdminCategories />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/categories/new",
        element: (
          <RequireAdmin>
            <AdminCategoryForm />
          </RequireAdmin>
        ),
      },
      {
        path: "/admin/categories/:id/edit",
        element: (
          <RequireAdmin>
            <AdminCategoryForm />
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
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
