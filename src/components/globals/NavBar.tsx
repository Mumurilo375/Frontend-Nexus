import {
  AlignJustify,
  ChevronDown,
  Heart,
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
import { resolveAssetUrl } from "../../services/assets";
import AuthRequiredModal from "./AuthRequiredModal";
import type {
  GamesResponse,
  GameSuggestion,
  MenuAction,
  NavbarCartResponse,
  NavLinkItem,
} from "./globals.types";

const navLinks: NavLinkItem[] = [
  { to: "/loja", label: "Loja" },
  { to: "/ofertas", label: "Ofertas" },
  { to: "/comofunciona", label: "Como funciona" },
  { to: "/admin", label: "Painel admin", adminOnly: true },
];

const iconButtonClass =
  "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-950/75 text-slate-200 transition hover:border-slate-600 hover:text-white";
const countBadgeClass =
  "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white";
const navLinkClass = "text-sm text-slate-300 transition hover:text-white";
const mobileItemClass =
  "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white";
const menuItemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-200 transition data-focus:bg-slate-900 data-focus:text-white data-focus:outline-hidden";
const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

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
  const currentPath = `${location.pathname}${location.search}`;
  const avatarSrc = authUser?.avatarUrl?.trim() || "";
  const resolvedAvatarSrc = avatarSrc ? resolveAssetUrl(avatarSrc, "") : "";
  const profileLabel = authUser?.username || "Minha conta";
  const visibleNavLinks = navLinks.filter((link) => !link.adminOnly || isAdmin);

  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarSrc]);

  const openAuthModal = () => setShowAuthModal(true);

  const goToLogin = () => {
    setShowAuthModal(false);
    void navigate("/login", {
      state: { from: currentPath },
    });
  };

  useEffect(() => {
    if (!searchOpen || games.length) return;

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
        setSearchError("Não foi possível carregar os jogos para a busca.");
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
  }, [currentPath]);

  useEffect(() => {
    const resetCounts = () => {
      setWishlistCount(0);
      setCartCount(0);
    };

    if (!isLoggedIn) {
      resetCounts();
      return;
    }

    const loadCounts = async () => {
      try {
        const [{ data: wishlistData }, { data: cartData }] = await Promise.all([
          api.get<{ items?: unknown[] }>("/wishlists"),
          api.get<NavbarCartResponse>("/cart"),
        ]);

        setWishlistCount((wishlistData.items ?? []).length);
        setCartCount(
          Number(cartData.meta?.totalItems ?? (cartData.items ?? []).length),
        );
      } catch {
        resetCounts();
      }
    };

    const onCountsUpdated = () => {
      void loadCounts();
    };

    void loadCounts();
    window.addEventListener("nexus:counts-updated", onCountsUpdated);
    return () =>
      window.removeEventListener("nexus:counts-updated", onCountsUpdated);
  }, [currentPath, isLoggedIn]);

  const filteredSuggestions = useMemo(() => {
    const term = normalizeSearchText(searchTerm);
    return (term
      ? games.filter((game) => normalizeSearchText(game.title).includes(term))
      : games
    ).slice(0, 6);
  }, [games, searchTerm]);

  const resetSearch = () => {
    setSearchTerm("");
    setSearchError("");
  };

  const openGame = (id: number) => {
    resetSearch();
    setSearchOpen(false);
    void navigate(`/loja/${id}`);
  };

  const openGameFromSearch = (term: string) => {
    const query = normalizeSearchText(term);
    if (!query) return;

    const matchedGame =
      games.find((game) => normalizeSearchText(game.title) === query) ??
      games.find((game) => normalizeSearchText(game.title).includes(query));

    if (!matchedGame) {
      setSearchError("Nenhum jogo encontrado para essa pesquisa.");
      return;
    }

    openGame(matchedGame.id);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openGameFromSearch(searchTerm);
  };

  const handleLogout = () => {
    setMenuMobileAberto(false);
    logout();
    void navigate("/");
  };

  const handleGoToFavorites = () => {
    setMenuMobileAberto(false);

    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    void navigate("/favoritos");
  };

  const accountActions: MenuAction[] = [
    {
      label: "Configurações",
      to: "/configuracoes",
      icon: Settings,
    },
    {
      label: "Meus pedidos e keys",
      to: "/meus-pedidos",
      icon: ReceiptText,
    },
    {
      label: "Sair",
      icon: LogOut,
      onSelect: handleLogout,
      danger: true,
    },
  ];

  const getActionClass = (baseClass: string, danger?: boolean) =>
    `${baseClass}${
      danger
        ? " text-rose-200 data-focus:bg-rose-500/10 data-focus:text-rose-100 hover:text-rose-100"
        : ""
    }`;

  const renderCountBadge = (count: number, colorClass: string) =>
    isLoggedIn && count > 0 ? (
      <span className={`${countBadgeClass} ${colorClass}`}>{count}</span>
    ) : null;

  const renderAction = (action: MenuAction, className: string) => {
    const Icon = action.icon;
    const content = (
      <>
        <Icon className={action.danger ? "h-4 w-4 text-rose-300" : "h-4 w-4"} />
        {action.label}
      </>
    );

    if (action.to) {
      return (
        <Link to={action.to} className={className}>
          {content}
        </Link>
      );
    }

    return (
      <button type="button" onClick={action.onSelect} className={className}>
        {content}
      </button>
    );
  };

  return (
    <>
      <AuthRequiredModal
        open={showAuthModal}
        title="Entre para continuar"
        message="Essa ação exige login. Deseja entrar agora?"
        onClose={() => setShowAuthModal(false)}
        onConfirm={goToLogin}
      />

      <nav className="fixed top-0 z-50 w-full border-b border-slate-900/80 bg-black/85 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="shrink-0 transition-opacity hover:opacity-90">
            <img
              src="/utils/logo.png"
              alt="Logo Nexus"
              className="h-10 w-auto"
            />
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {visibleNavLinks.map((link) => (
              <Link key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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
                <div className="absolute right-0 top-12 w-[90vw] max-w-80 rounded-2xl border border-slate-800 bg-slate-950/96 p-3 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
                  <form onSubmit={handleSubmit} className="mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => {
                          setSearchTerm(event.target.value);
                          if (games.length > 0) {
                            setSearchError("");
                          }
                        }}
                        placeholder="Pesquisar jogos..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-slate-500"
                      />

                      {searchTerm.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={resetSearch}
                          className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-300 transition hover:text-white"
                          aria-label="Limpar busca"
                          title="Limpar busca"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </form>

                  {loadingSuggestions && (
                    <p className="px-1 py-2 text-sm text-gray-300">
                      Carregando sugestões...
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
                            onClick={() => openGame(game.id)}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-900"
                          >
                            <img
                              src={resolveAssetUrl(game.coverImageUrl)}
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
              className={`hidden md:inline-flex ${iconButtonClass}`}
              aria-label="Ir para favoritos"
            >
              <Heart className="h-5 w-5" />
              {renderCountBadge(wishlistCount, "bg-rose-600")}
            </button>

            <Link
              to="/carrinho"
              className={`hidden md:inline-flex ${iconButtonClass}`}
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {renderCountBadge(cartCount, "bg-blue-600")}
            </Link>

            {isLoggedIn ? (
              <HeadlessMenu as="div" className="relative hidden md:block">
                <MenuButton className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-left text-sm text-slate-200 transition hover:border-slate-600 hover:bg-slate-900 focus:outline-none">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-slate-200">
                    {resolvedAvatarSrc && !avatarBroken ? (
                      <img
                        src={resolvedAvatarSrc}
                        alt="Foto do usuário"
                        className="h-full w-full object-cover"
                        onError={() => setAvatarBroken(true)}
                      />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </div>
                  <span className="hidden max-w-28 truncate font-medium text-white sm:block">
                    {profileLabel}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </MenuButton>

                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-3 w-64 origin-top-right rounded-2xl border border-slate-800 bg-slate-950/96 p-2 shadow-[0_18px_40px_rgba(2,6,23,0.3)] outline-none transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  {accountActions.map((action) => (
                    <MenuItem key={action.label}>
                      {renderAction(
                        action,
                        getActionClass(menuItemClass, action.danger),
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </HeadlessMenu>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 md:inline-block"
              >
                Entrar
              </Link>
            )}

            <button
              type="button"
              className={`${iconButtonClass} md:hidden`}
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
            className="border-t border-slate-900 bg-black/95 px-4 pb-4 pt-3 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {visibleNavLinks.map((link) => (
                <Link key={link.to} to={link.to} className={mobileItemClass}>
                  {link.label}
                </Link>
              ))}

              <div className="my-1 h-px bg-slate-800" />

              <button
                type="button"
                onClick={handleGoToFavorites}
                className={mobileItemClass}
              >
                <Heart className="h-4 w-4" /> Favoritos{" "}
                {isLoggedIn ? `(${wishlistCount})` : ""}
              </button>
              <Link to="/carrinho" className={mobileItemClass}>
                <ShoppingCart className="h-4 w-4" /> Carrinho{" "}
                {isLoggedIn ? `(${cartCount})` : ""}
              </Link>

              {isLoggedIn ? (
                accountActions.map((action) => (
                  <div key={action.label}>
                    {renderAction(
                      action,
                      getActionClass(mobileItemClass, action.danger),
                    )}
                  </div>
                ))
              ) : (
                <Link to="/login" className={mobileItemClass}>
                  <UserRound className="h-4 w-4" /> Entrar
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default NavBar;
