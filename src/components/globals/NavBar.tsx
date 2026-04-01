import {
  AlignJustify,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import {
  Menu as HeadlessMenu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import api from "../../services/api";
import AuthRequiredModal from "./AuthRequiredModal";

type GameSuggestion = {
  id: number;
  title: string;
  coverImageUrl?: string;
};

type GamesResponse = {
  items: GameSuggestion[];
};

const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md hover:text-blue-600";
const menuItemClass =
  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-200 transition data-focus:bg-slate-900/90 data-focus:text-white data-focus:outline-hidden";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [games, setGames] = useState<GameSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const {
    isAdmin,
    isAuthenticated: isLoggedIn,
    logout,
    user: authUser,
  } = useAuth();
  const avatarSrc = authUser?.avatarUrl?.trim() || "";

  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarSrc]);

  const openAuthModal = () => setShowAuthModal(true);

  const goToLogin = () => {
    setShowAuthModal(false);
    void navigate("/login", {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  useEffect(() => {
    if (!searchOpen || games.length > 0) {
      return;
    }

    const carregarJogos = async () => {
      try {
        setLoadingSuggestions(true);
        setSearchError("");

        const { data } = await api.get<GamesResponse>("/games", {
          params: { page: 1, limit: 100 },
        });

        setGames(data?.items ?? []);
      } catch {
        setGames([]);
        setSearchError(
          "Nao foi possivel carregar sugestoes. Faca login para pesquisar.",
        );
      } finally {
        setLoadingSuggestions(false);
      }
    };

    void carregarJogos();
  }, [searchOpen, games.length]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!searchBoxRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setMenuMobileAberto(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryFromUrl = searchParams.get("q") ?? "";

    setSearchTerm(queryFromUrl);
  }, [location.search]);

  useEffect(() => {
    if (!isLoggedIn) {
      setWishlistCount(0);
      setCartCount(0);
      return;
    }

    const loadCounts = async () => {
      try {
        const [{ data: wishlistData }, { data: cartData }] = await Promise.all([
          api.get<{ items?: unknown[] }>("/wishlists"),
          api.get<{ items?: unknown[] }>("/cart"),
        ]);

        setWishlistCount((wishlistData.items ?? []).length);
        setCartCount((cartData.items ?? []).length);
      } catch {
        setWishlistCount(0);
        setCartCount(0);
      }
    };

    const onCountsUpdated = () => {
      void loadCounts();
    };

    void loadCounts();
    window.addEventListener("nexus:counts-updated", onCountsUpdated);
    return () =>
      window.removeEventListener("nexus:counts-updated", onCountsUpdated);
  }, [isLoggedIn, location.pathname, location.search]);

  const filteredSuggestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return games.slice(0, 6);
    }

    return games
      .filter((game) => game.title.toLowerCase().includes(term))
      .slice(0, 6);
  }, [games, searchTerm]);

  const irParaResultado = (term: string) => {
    const query = term.trim();
    if (!query) {
      return;
    }

    void navigate(`/loja?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    irParaResultado(searchTerm);
  };

  const handleClearSearchFilter = () => {
    setSearchTerm("");

    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has("q")) {
      return;
    }

    searchParams.delete("q");
    const nextSearch = searchParams.toString();

    void navigate({
      pathname: location.pathname,
      search: nextSearch ? `?${nextSearch}` : "",
    });
  };

  const handleLogout = () => {
    logout();
    void navigate("/");
  };

  const handleGoToFavorites = () => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    void navigate("/favoritos");
  };

  return (
    <>
      <AuthRequiredModal
        open={showAuthModal}
        title="Entre para continuar"
        message="Essa acao exige login. Deseja entrar agora?"
        onClose={() => setShowAuthModal(false)}
        onConfirm={goToLogin}
      />

      <nav className="fixed top-0 z-50 w-full bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="shrink-0">
            <Link
              to="/"
              className="block transition-all duration-300 hover:scale-105"
            >
              <img
                src="/utils/logo.png"
                alt="Logo Nexus"
                className="h-10 w-auto"
              />
            </Link>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              to="/loja"
              className="transition-all duration-300 hover:scale-105 hover:text-blue-600"
            >
              Loja
            </Link>
            <Link
              to="/ofertas"
              className="transition-all duration-300 hover:scale-105 hover:text-blue-600"
            >
              Ofertas
            </Link>
            <Link
              to="/comofunciona"
              className="transition-all duration-300 hover:scale-105 hover:text-blue-600"
            >
              Como funciona
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="transition-all duration-300 hover:scale-105 hover:text-blue-600"
              >
                Painel admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm md:hidden">
            <Link
              to="/loja"
              className="rounded-md px-2 py-1 hover:bg-gray-800 hover:text-blue-500"
            >
              Loja
            </Link>
            <Link
              to="/comofunciona"
              className="rounded-md px-2 py-1 hover:bg-gray-800 hover:text-blue-500"
            >
              Como funciona
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div ref={searchBoxRef} className="relative">
              <button
                type="button"
                className={iconButtonClass}
                onClick={() => setSearchOpen((prev) => !prev)}
                aria-label="Abrir busca"
              >
                <Search className="h-5 w-5" />
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-11 w-[90vw] max-w-80 rounded-xl border border-gray-700 bg-black/95 p-3 shadow-2xl">
                  <form onSubmit={handleSubmit} className="mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Pesquisar jogos..."
                        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-600"
                      />

                      {searchTerm.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearSearchFilter}
                          className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-300 transition-colors hover:text-blue-500"
                          aria-label="Limpar filtro"
                          title="Limpar filtro"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </form>

                  {loadingSuggestions && (
                    <p className="px-1 py-2 text-sm text-gray-300">
                      Carregando sugestoes...
                    </p>
                  )}

                  {!loadingSuggestions && searchError && (
                    <p className="px-1 py-2 text-sm text-red-300">
                      {searchError}
                    </p>
                  )}

                  {!loadingSuggestions && !searchError && (
                    <ul className="nexus-scrollbar max-h-60 overflow-y-auto">
                      {filteredSuggestions.map((game) => (
                        <li key={game.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm(game.title);
                              irParaResultado(game.title);
                            }}
                            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-800"
                          >
                            <img
                              src={game.coverImageUrl || "/utils/logo.png"}
                              alt={game.title}
                              className="h-9 w-9 rounded object-cover"
                            />
                            <span className="text-sm text-gray-200">
                              {game.title}
                            </span>
                          </button>
                        </li>
                      ))}

                      {filteredSuggestions.length === 0 && (
                        <li className="px-2 py-2 text-sm text-gray-400">
                          Nenhum jogo encontrado para essa pesquisa.
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleGoToFavorites}
              className={`relative hidden md:inline-flex ${iconButtonClass}`}
              aria-label="Ir para favoritos"
            >
              <Heart className="h-5 w-5" />
              {isLoggedIn && wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            <Link
              to="/carrinho"
              className={`relative hidden md:inline-flex ${iconButtonClass}`}
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {isLoggedIn && cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <HeadlessMenu as="div" className="relative hidden md:inline-flex">
                <MenuButton className="inline-flex items-center gap-3 rounded-full border border-slate-700 bg-slate-950/85 px-2 py-1.5 text-left transition hover:border-blue-500/40 hover:bg-slate-900 focus:outline-none">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-slate-200">
                    {avatarSrc && !avatarBroken ? (
                      <img
                        src={avatarSrc}
                        alt="Foto do usuario"
                        className="h-full w-full object-cover"
                        onError={() => setAvatarBroken(true)}
                      />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <p className="max-w-28 truncate text-sm font-medium text-white">
                      {authUser?.username || "Minha conta"}
                    </p>
                    <p className="max-w-28 truncate text-xs text-slate-400">
                      {authUser?.email || "Conta Nexus"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </MenuButton>

                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-3 w-72 origin-top-right rounded-[28px] border border-slate-800 bg-slate-950/96 p-3 shadow-[0_24px_70px_rgba(2,6,23,0.45)] outline-none backdrop-blur-md transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <div className="rounded-[22px] border border-slate-800 bg-slate-900/65 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-950 text-slate-200">
                        {avatarSrc && !avatarBroken ? (
                          <img
                            src={avatarSrc}
                            alt="Foto do usuario"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {authUser?.username || "Minha conta"}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {authUser?.email || "Conta Nexus"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    {isAdmin && (
                      <MenuItem>
                        <Link
                          to="/admin"
                          className={menuItemClass}
                        >
                          <LayoutDashboard className="h-4 w-4 text-blue-300" />
                          Painel admin
                        </Link>
                      </MenuItem>
                    )}
                    <MenuItem>
                      <Link
                        to="/configuracoes"
                        className={menuItemClass}
                      >
                        <Settings className="h-4 w-4 text-blue-300" />
                        Configuracoes
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        to="/meus-pedidos"
                        className={menuItemClass}
                      >
                        <ReceiptText className="h-4 w-4 text-blue-300" />
                        Meus pedidos e keys
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={menuItemClass}
                      >
                        <LogOut className="h-4 w-4 text-rose-300" />
                        Sair
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </HeadlessMenu>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 md:inline-block"
              >
                Entrar
              </Link>
            )}

            <button
              type="button"
              className="rounded-md p-1 hover:text-blue-600 md:hidden"
              onClick={() => setMenuMobileAberto((valorAtual) => !valorAtual)}
              aria-label={menuMobileAberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuMobileAberto}
              aria-controls="menu-mobile-navbar"
            >
              {menuMobileAberto ? (
                <X className="h-5 w-5" />
              ) : (
                <AlignJustify className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {menuMobileAberto && (
          <div
            id="menu-mobile-navbar"
            className="border-t border-gray-800 bg-black/95 px-4 pb-4 pt-2 md:hidden"
          >
            <div className="flex flex-col gap-3 text-sm">
              <Link
                to="/loja"
                className="rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
              >
                Loja
              </Link>
              <Link
                to="/ofertas"
                className="rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
              >
                Ofertas
              </Link>
              <Link
                to="/comofunciona"
                className="rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
              >
                Como funciona
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
                >
                  Painel admin
                </Link>
              )}
              <button
                type="button"
                onClick={handleGoToFavorites}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-gray-800 hover:text-blue-500"
              >
                <Heart className="h-4 w-4" /> Favoritos{" "}
                {isLoggedIn ? `(${wishlistCount})` : ""}
              </button>
              <Link
                to="/carrinho"
                className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
              >
                <ShoppingCart className="h-4 w-4" /> Carrinho{" "}
                {isLoggedIn ? `(${cartCount})` : ""}
              </Link>
              {isLoggedIn && (
                <Link
                  to="/configuracoes"
                  className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
                >
                  <UserRound className="h-4 w-4" /> Configuracoes
                </Link>
              )}
              {isLoggedIn && (
                <Link
                  to="/meus-pedidos"
                  className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
                >
                  <UserRound className="h-4 w-4" /> Meus pedidos e keys
                </Link>
              )}
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
                >
                  <UserRound className="h-4 w-4" /> Entrar
                </Link>
              )}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-gray-800 hover:text-blue-500"
                >
                  <UserRound className="h-4 w-4" /> Sair
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default NavBar;
