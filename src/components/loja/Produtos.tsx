import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Heart } from "lucide-react";
import api from "../../services/api";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import Pagination from "../globals/Pagination";
import AuthRequiredModal from "../globals/AuthRequiredModal";
import steamLogo from "../../assets/steam.png";
import playstationLogo from "../../assets/playlogo.png";
import xboxLogo from "../../assets/xbox.png";
import nintendoLogo from "../../assets/nintendo.png";

type Category = {
  id: number;
  name: string;
};

type Game = {
  id: number;
  title: string;
  description: string;
  coverImageUrl?: string;
  price?: number;
  categories?: Category[];
  platforms?: string[];
};

type GamesResponse = {
  items: Game[];
};

type ListingItem = {
  id: number;
  gameId?: number;
  isActive?: boolean;
  price?: number | string;
  game?: {
    id?: number;
  };
  platform?: {
    name?: string;
  };
};

type ListingsResponse = {
  items: ListingItem[];
};

type WishlistItem = {
  gameId: number;
};

type WishlistResponse = {
  items: WishlistItem[];
};

const PAGE_SIZE = 12;

const platformLogoByName: Record<string, string> = {
  steam: steamLogo,
  playstation: playstationLogo,
  xbox: xboxLogo,
  "nintendo switch": nintendoLogo,
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export default function Produtos() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(
    null,
  );
  const [pendingCartGameId, setPendingCartGameId] = useState<number | null>(
    null,
  );
  const [listingByGame, setListingByGame] = useState<
    Map<number, ListingItem[]>
  >(new Map());
  const [cartListingIds, setCartListingIds] = useState<number[]>([]);
  const [selectedListingByGame, setSelectedListingByGame] = useState<
    Record<number, number>
  >({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated: isLoggedIn } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedPlatforms = useMemo(
    () =>
      searchParams
        .getAll("platform")
        .map((platform) => platform.trim())
        .filter(Boolean),
    [searchParams],
  );
  const selectedCategories = useMemo(
    () =>
      searchParams
        .getAll("category")
        .map((category) => category.trim())
        .filter(Boolean),
    [searchParams],
  );
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const goToLogin = () => {
    setShowAuthModal(false);
    void navigate("/login", {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const askLogin = () => {
    setShowAuthModal(true);
  };

  const filteredGames = useMemo(() => {
    const filtrosCategoria = new Set(
      selectedCategories.map((category) => normalizeText(category)),
    );
    const filtrosPlataforma = new Set(
      selectedPlatforms.map((platform) => normalizeText(platform)),
    );

    const jogosFiltradosPorCategoria =
      filtrosCategoria.size > 0
        ? games.filter((game) =>
            (game.categories ?? []).some((category) =>
              filtrosCategoria.has(normalizeText(category.name)),
            ),
          )
        : games;

    const jogosFiltrados =
      filtrosPlataforma.size > 0
        ? jogosFiltradosPorCategoria.filter((game) =>
            (game.platforms ?? []).some((platform) =>
              filtrosPlataforma.has(normalizeText(platform)),
            ),
          )
        : jogosFiltradosPorCategoria;

    if (!query) {
      return jogosFiltrados;
    }

    return jogosFiltrados.filter((game) =>
      game.title.toLowerCase().includes(query),
    );
  }, [games, query, selectedCategories, selectedPlatforms]);

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / PAGE_SIZE));
  const paginatedGames = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredGames.slice(start, start + PAGE_SIZE);
  }, [filteredGames, page]);

  useEffect(() => {
    setPage(1);
  }, [games, query, selectedCategories, selectedPlatforms]);

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        setLoading(true);
        setError("");

        const [gamesResponse, listingsResponse] = await Promise.all([
          api.get<GamesResponse>("/games", {
            params: { page: 1, limit: 30 },
          }),
          api.get<ListingsResponse>("/listings", {
            params: { page: 1, limit: 100 },
          }),
        ]);

        const listingItems = (listingsResponse.data?.items ?? []).filter(
          (listing) => listing.isActive !== false,
        );
        const listingMap = new Map<number, ListingItem[]>();
        const menorPrecoPorJogo = new Map<number, number>();
        const plataformasPorJogo = new Map<number, Set<string>>();

        for (const listing of listingItems) {
          const gameId = listing.gameId ?? listing.game?.id;
          if (!gameId) {
            continue;
          }

          const list = listingMap.get(gameId) ?? [];
          list.push(listing);
          listingMap.set(gameId, list);

          const platformName = String(listing.platform?.name ?? "").trim();
          if (platformName) {
            const currentSet =
              plataformasPorJogo.get(gameId) ?? new Set<string>();
            currentSet.add(platformName);
            plataformasPorJogo.set(gameId, currentSet);
          }

          const parsedPrice = Number(listing.price);
          if (Number.isFinite(parsedPrice)) {
            const currentMin = menorPrecoPorJogo.get(gameId);
            if (currentMin === undefined || parsedPrice < currentMin) {
              menorPrecoPorJogo.set(gameId, parsedPrice);
            }
          }
        }

        const jogosComDadosDePlataforma = (gamesResponse.data?.items ?? []).map(
          (game) => ({
            ...game,
            price: menorPrecoPorJogo.get(game.id) ?? game.price,
            platforms: Array.from(plataformasPorJogo.get(game.id) ?? []),
          }),
        );

        setGames(jogosComDadosDePlataforma);
        setListingByGame(listingMap);
      } catch {
        setGames([]);
        setListingByGame(new Map());
        setError("Não foi possível carregar os produtos no momento.");
      } finally {
        setLoading(false);
      }
    };

    void carregarJogos();
  }, []);

  useEffect(() => {
    const carregarFavoritos = async () => {
      if (!isLoggedIn) {
        setFavoriteIds([]);
        setCartListingIds([]);
        return;
      }

      try {
        const [{ data: wishlistData }, { data: cartData }] = await Promise.all([
          api.get<WishlistResponse>("/wishlists"),
          api.get<{ items: Array<{ listingId: number }> }>("/cart"),
        ]);

        const ids = (wishlistData.items ?? []).map((item) => item.gameId);
        setFavoriteIds(ids);
        setCartListingIds((cartData.items ?? []).map((item) => item.listingId));
      } catch {
        setFavoriteIds([]);
        setCartListingIds([]);
      }
    };

    void carregarFavoritos();
  }, [isLoggedIn]);

  const alternarFavorito = async (gameId: number) => {
    if (!isLoggedIn) {
      askLogin();
      return;
    }

    const isFavorite = favoriteIds.includes(gameId);

    try {
      setPendingFavoriteId(gameId);

      if (isFavorite) {
        await api.delete(`/wishlists/${gameId}`);
        setFavoriteIds((current) => current.filter((id) => id !== gameId));
      } else {
        await api.post(`/wishlists/${gameId}`, {});
        setFavoriteIds((current) => [...current, gameId]);
      }

      window.dispatchEvent(new Event("nexus:counts-updated"));
    } finally {
      setPendingFavoriteId(null);
    }
  };

  const getListingsForGame = (gameId: number) => {
    const list = listingByGame.get(gameId) ?? [];
    if (selectedPlatforms.length === 0) return list;

    const filtrosPlataforma = new Set(
      selectedPlatforms.map((platform) => normalizeText(platform)),
    );

    return list.filter((item) =>
      filtrosPlataforma.has(normalizeText(String(item.platform?.name ?? ""))),
    );
  };

  const getSelectedListingForGame = (gameId: number) => {
    const listingsForGame = getListingsForGame(gameId);
    const selectedId = selectedListingByGame[gameId];
    if (!selectedId) return listingsForGame[0] ?? null;
    return (
      listingsForGame.find((item) => item.id === selectedId) ??
      listingsForGame[0] ??
      null
    );
  };

  const selectListing = (gameId: number, listingId: number) => {
    setSelectedListingByGame((current) => ({
      ...current,
      [gameId]: listingId,
    }));
  };

  const getPlatformLogo = (platformName?: string) => {
    const key = String(platformName ?? "")
      .trim()
      .toLowerCase();
    return platformLogoByName[key] || "/logo.png";
  };

  const addToCart = async (gameId: number, listingId: number) => {
    if (!isLoggedIn) {
      askLogin();
      return;
    }

    try {
      setPendingCartGameId(gameId);
      await api.post(`/cart/${listingId}`);
      setCartListingIds((current) =>
        current.includes(listingId) ? current : [...current, listingId],
      );
      window.dispatchEvent(new Event("nexus:counts-updated"));
    } finally {
      setPendingCartGameId(null);
    }
  };

  const openGameDetails = (gameId: number) => {
    void navigate(`/loja/${gameId}`);
  };

  const stopCardNavigation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    gameId: number,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openGameDetails(gameId);
  };

  if (loading) {
    return (
      <p className="nexus-card px-6 py-5 text-gray-300">
        Carregando produtos...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-[26px] border border-rose-500/30 bg-rose-500/10 px-6 py-5 text-rose-200">
        {error}
      </p>
    );
  }

  return (
    <>
      <AuthRequiredModal
        open={showAuthModal}
        title="Entre para continuar"
        message="Para adicionar aos favoritos ou ao carrinho, faca login na sua conta."
        onClose={() => setShowAuthModal(false)}
        onConfirm={goToLogin}
      />

      {games.length === 0 && (
        <p className="nexus-card p-6 text-gray-300">
          Nenhum produto encontrado.
        </p>
      )}
      {games.length > 0 && filteredGames.length === 0 && (
        <p className="nexus-card p-6 text-gray-300">
          Nenhum resultado para os filtros selecionados.
        </p>
      )}
      {filteredGames.length > 0 && (
        <>
          <div className="grid grid-cols-1 mt-25 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedGames.map((game) => {
              const listings = getListingsForGame(game.id);
              const selectedListing = getSelectedListingForGame(game.id);
              const inCart = selectedListing
                ? cartListingIds.includes(selectedListing.id)
                : false;

              return (
                <article
                  key={game.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => openGameDetails(game.id)}
                  onKeyDown={(event) => handleCardKeyDown(event, game.id)}
                  className="nexus-card relative my-1 flex cursor-pointer flex-col items-start gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-600"
                >
                  <button
                    type="button"
                    onMouseDown={stopCardNavigation}
                    onClick={(event) => {
                      stopCardNavigation(event);
                      void alternarFavorito(game.id);
                    }}
                    disabled={pendingFavoriteId === game.id}
                    className="absolute left-4 top-4 z-20 rounded-full border border-slate-700 bg-slate-950/90 p-2.5 transition hover:border-slate-500 disabled:opacity-60"
                    aria-label={
                      favoriteIds.includes(game.id)
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    <Heart
                      className={
                        favoriteIds.includes(game.id)
                          ? "fill-red-500 text-red-500"
                          : "text-slate-100"
                      }
                    />
                  </button>

                  <div className="flex h-44 w-full items-center justify-center rounded-[20px] border border-slate-800 bg-black/15 p-3">
                    <img
                      src={game.coverImageUrl || "/logo.png"}
                      alt={game.title}
                      className="max-h-full w-full object-contain"
                    />
                  </div>
                  <h2 className="mb-1 text-left text-xl font-bold">
                    {game.title}
                  </h2>
                  <p
                    className="text-sm text-gray-300"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {game.description}
                  </p>
                  <div className="w-full">
                    <p className="mb-2 text-sm text-gray-300">
                      Escolha a plataforma:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {listings.map((listing) => {
                        const selected = selectedListing?.id === listing.id;

                        return (
                          <button
                            key={listing.id}
                            type="button"
                            onMouseDown={stopCardNavigation}
                            onClick={(event) => {
                              stopCardNavigation(event);
                              selectListing(game.id, listing.id);
                            }}
                            className={`rounded-xl border p-2 transition ${selected ? "border-slate-500 bg-slate-800/90" : "border-slate-700 bg-slate-950/85 hover:border-slate-500"}`}
                            title={listing.platform?.name || "Plataforma"}
                          >
                            <img
                              src={getPlatformLogo(listing.platform?.name)}
                              alt={listing.platform?.name || "Plataforma"}
                              className="h-8 w-8 object-contain"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-4">
                    <p className="text-sm text-gray-300">
                      {game.categories
                        ?.slice(0, 2)
                        .map((category) => category.name)
                        .join(" • ") || "Sem categoria"}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {selectedListing?.price
                        ? `R$ ${Number(selectedListing.price).toFixed(2)}`
                        : ""}
                    </p>
                    <button
                      type="button"
                      onMouseDown={stopCardNavigation}
                      onClick={(event) => {
                        stopCardNavigation(event);
                        if (!selectedListing) return;
                        void addToCart(game.id, selectedListing.id);
                      }}
                      disabled={
                        pendingCartGameId === game.id ||
                        !selectedListing ||
                        inCart
                      }
                      className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                    >
                      {!selectedListing
                        ? "Escolha a plataforma"
                        : inCart
                          ? "No carrinho"
                          : pendingCartGameId === game.id
                            ? "Adicionando..."
                            : "Adicionar"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </>
  );
}
