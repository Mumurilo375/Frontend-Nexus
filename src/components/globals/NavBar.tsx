import { useEffect, useMemo, useRef, useState } from "react";
import { Search, UserRound, ShoppingCart, Heart } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Link, useNavigate } from "react-router-dom";
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
  const [searchOpen, setSearchOpen] = useState(false);
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

  return (
    <nav className="fixed bg-black/90 top-0 w-full blackdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center gap-8">
        <div>
          <Link
            to="/"
            className=" absolute left-3 top-3  hover:text-blue-600 hover:scale-105 transition-all duration-300"
          >
            {" "}
            <img src="utils/logo.png" alt="" />
          </Link>
        </div>
        <div className="flex gap-8">
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
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-6">
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
              <div className="absolute right-0 top-11 w-80 rounded-xl border border-gray-700 bg-black/95 p-3 shadow-2xl">
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

          <a href="#favoritos" className="hover:text-blue-600">
            {" "}
            <Heart />
          </a>
          <a href="#loja" className="hover:text-blue-600">
            <ShoppingCart />
          </a>
          <Menu as="div" className="relative inline-block">
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
          </Menu>
        </div>
      </div>
    </nav>
  );
}
export default NavBar;
