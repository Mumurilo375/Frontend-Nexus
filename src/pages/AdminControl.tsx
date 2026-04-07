import { matchPath, useLocation } from "react-router-dom";
import AdminCategories from "../components/admin/AdminCategories";
import AdminCategoryForm from "../components/admin/AdminCategoryForm";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminGameForm from "../components/admin/AdminGameForm";
import AdminGamePlatforms from "../components/admin/AdminGamePlatforms";
import AdminGames from "../components/admin/AdminGames";

function matchAdminPath(pathname: string, path: string) {
  return Boolean(matchPath({ path, end: true }, pathname));
}

export default function AdminControl() {
  const { pathname } = useLocation();
  const gamePlatformsMatch = matchPath(
    { path: "/admin/games/:gameId/platforms", end: true },
    pathname,
  );
  const gameEditMatch = matchPath(
    { path: "/admin/games/:id/edit", end: true },
    pathname,
  );
  const categoryEditMatch = matchPath(
    { path: "/admin/categories/:id/edit", end: true },
    pathname,
  );

  if (matchAdminPath(pathname, "/admin/games/new")) {
    return <AdminGameForm />;
  }

  if (gamePlatformsMatch) {
    return <AdminGamePlatforms gameId={gamePlatformsMatch.params.gameId} />;
  }

  if (gameEditMatch) {
    return <AdminGameForm id={gameEditMatch.params.id} />;
  }

  if (matchAdminPath(pathname, "/admin/games")) {
    return <AdminGames />;
  }

  if (matchAdminPath(pathname, "/admin/categories/new")) {
    return <AdminCategoryForm />;
  }

  if (categoryEditMatch) {
    return <AdminCategoryForm id={categoryEditMatch.params.id} />;
  }

  if (matchAdminPath(pathname, "/admin/categories")) {
    return <AdminCategories />;
  }

  return <AdminDashboard />;
}
