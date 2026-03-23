import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  UserRound,
  ShoppingCart,
  Heart,
  AlignJustify,
  X,
} from "lucide-react";
import {
  Menu as HeadlessMenu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

function NavBar() {
  type GameSuggestion = {
    id: number;
    title: string;
    coverImageUrl?: string;
  };

  type GamesResponse = {
    items: GameSuggestion[];
  };

  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [games, setGames] = useState<GameSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    if (!searchOpen || games.length > 0) {
      return;
    }

    const carregarJogos = async () => {
      try {
        setLoadingSuggestions(true);
        setSearchError("");

        const token = localStorage.getItem("token");
        const { data } = await api.get<GamesResponse>("/games", {
          params: { page: 1, limit: 100 },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

    navigate(`/loja?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    irParaResultado(searchTerm);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleGoToFavorites = () => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }

    navigate("/favoritos");
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="shrink-0">
          <Link
            to="/"
            className="block hover:scale-105 transition-all duration-300"
          >
            <img
              src="utils/logo.png"
              alt="Logo Nexus"
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            to="/loja"
            className="hover:text-blue-600 hover:scale-105 transition-all duration-300"
          >
            Loja
          </Link>
          <Link
            to="/ofertas"
            className="hover:text-blue-600 hover:scale-105 transition-all duration-300"
          >
            Ofertas
          </Link>

          <Link
            to="/comofunciona"
            className="hover:text-blue-600 hover:scale-105 transition-all duration-300"
          >
            {" "}
            Como funciona
          </Link>
          <Link
            to="/listagem-usuarios"
            className="hover:text-blue-600 hover:scale-105 transition-all duration-300"
          >
            Teste API
          </Link>
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
              className="hover:text-blue-600"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Abrir busca"
            >
              <Search />
            </button>

            {searchOpen && (
              <div className="absolute right-0 top-11 w-[90vw] max-w-80 rounded-xl border border-gray-700 bg-black/95 p-3 shadow-2xl">
                <form onSubmit={handleSubmit} className="mb-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Pesquisar jogos..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-600"
                  />
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
                  <ul className="max-h-60 overflow-y-auto">
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
                            src={game.coverImageUrl || "/logo.png"}
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
            className="hidden -mt-1 hover:text-blue-600 md:block"
            aria-label="Ir para favoritos"
          >
            <Heart className="h-8 w-8" />
          </button>

          <a
            href="#loja"
            className="hidden hover:text-blue-600 md:block"
            aria-label="Carrinho"
          >
            <ShoppingCart />
          </a>

          <HeadlessMenu as="div" className="relative hidden md:inline-block">
            <MenuButton className="hover:text-blue-600 focus:outline-none">
              <UserRound />
            </MenuButton>

            <MenuItems
              transition
              className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-300 shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
              <div className="py-1">
                {!isLoggedIn && (
                  <MenuItem>
                    <a
                      href="/login"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                    >
                      Login
                    </a>
                  </MenuItem>
                )}
                {isLoggedIn && (
                  <>
                    <MenuItem>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                      >
                        Configurações
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                      >
                        Minhas Keys
                      </a>
                    </MenuItem>
                    <MenuItem>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                      >
                        Sair
                      </button>
                    </MenuItem>
                  </>
                )}
              </div>
            </MenuItems>
          </HeadlessMenu>

          <button
            type="button"
            className="rounded-md p-1 hover:text-blue-600 md:hidden"
            onClick={() => setMenuMobileAberto((valorAtual) => !valorAtual)}
            aria-label={menuMobileAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuMobileAberto}
            aria-controls="menu-mobile-navbar"
          >
            {menuMobileAberto ? <X /> : <AlignJustify />}
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
            <Link
              to="/listagem-usuarios"
              className="rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
            >
              Teste API
            </Link>
            <button
              type="button"
              onClick={handleGoToFavorites}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-gray-800 hover:text-blue-500"
            >
              <Heart className="h-4 w-4" /> Favoritos
            </button>
            <a
              href="#loja"
              className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
            >
              <ShoppingCart className="h-4 w-4" /> Carrinho
            </a>
            {!isLoggedIn && (
              <a
                href="/login"
                className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-800 hover:text-blue-500"
              >
                <UserRound className="h-4 w-4" /> Login
              </a>
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
  );
}
export default NavBar;
