import { matchPath, useLocation } from "react-router-dom";
import AdminCategories from "../components/admin/AdminCategories";
import AdminCategoryForm from "../components/admin/AdminCategoryForm";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminGameForm from "../components/admin/AdminGameForm";
import AdminGameListings from "../components/admin/AdminGameListings";
import AdminGames from "../components/admin/AdminGames";
import AdminListingForm from "../components/admin/AdminListingForm";
import AdminListingKeys from "../components/admin/AdminListingKeys";

function matchAdminPath(pathname: string, path: string) {
  return Boolean(matchPath({ path, end: true }, pathname));
}

export default function AdminControl() {
  const { pathname } = useLocation();

  if (
    matchAdminPath(pathname, "/admin/games/:gameId/listings/:listingId/keys")
  ) {
    return <AdminListingKeys />;
  }

  if (
    matchAdminPath(pathname, "/admin/games/:gameId/listings/:listingId/edit")
  ) {
    return <AdminListingForm />;
  }

  if (matchAdminPath(pathname, "/admin/games/:gameId/listings/new")) {
    return <AdminListingForm />;
  }

  if (matchAdminPath(pathname, "/admin/games/:gameId/listings")) {
    return <AdminGameListings />;
  }

  if (matchAdminPath(pathname, "/admin/games/new")) {
    return <AdminGameForm />;
  }

  if (matchAdminPath(pathname, "/admin/games/:id/edit")) {
    return <AdminGameForm />;
  }

  if (matchAdminPath(pathname, "/admin/games")) {
    return <AdminGames />;
  }

  if (matchAdminPath(pathname, "/admin/categories/new")) {
    return <AdminCategoryForm />;
  }

  if (matchAdminPath(pathname, "/admin/categories/:id/edit")) {
    return <AdminCategoryForm />;
  }

  if (matchAdminPath(pathname, "/admin/categories")) {
    return <AdminCategories />;
  }

  return <AdminDashboard />;
}
