import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import api from "../../services/api";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

type Category = {
  id: number;
  name: string;
};

type ProdutosProps = {
  selectedPlatform: string;
  onPlatformsLoaded: (platforms: string[]) => void;
  selectedCategory: string;
  onCategoriesLoaded: (categories: string[]) => void;
};

export default function Produtos({
  selectedPlatform,
  onPlatformsLoaded,
  selectedCategory,
  onCategoriesLoaded,
}: ProdutosProps) {
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

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(
    null,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  const normalizarTexto = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const availableCategories = useMemo(() => {
    const names = games.flatMap((game) =>
      (game.categories ?? []).map((category) => category.name),
    );
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [games]);

  const availablePlatforms = useMemo(() => {
    const names = games.flatMap((game) => game.platforms ?? []);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [games]);

  const filteredGames = useMemo(() => {
    const filtroCategoria = normalizarTexto(selectedCategory);
    const filtroPlataforma = normalizarTexto(selectedPlatform);

    const jogosFiltradosPorCategoria =
      filtroCategoria && filtroCategoria !== "todas"
        ? games.filter((game) =>
            (game.categories ?? []).some(
              (category) => normalizarTexto(category.name) === filtroCategoria,
            ),
          )
        : games;

    const jogosFiltrados =
      filtroPlataforma && filtroPlataforma !== "todas"
        ? jogosFiltradosPorCategoria.filter((game) =>
            (game.platforms ?? []).some(
              (platform) => normalizarTexto(platform) === filtroPlataforma,
            ),
          )
        : jogosFiltradosPorCategoria;

    if (!query) {
      return jogosFiltrados;
    }

    return jogosFiltrados.filter((game) =>
      game.title.toLowerCase().includes(query),
    );
  }, [games, query, selectedCategory, selectedPlatform]);

  useEffect(() => {
    onCategoriesLoaded(availableCategories);
  }, [availableCategories, onCategoriesLoaded]);

  useEffect(() => {
    onPlatformsLoaded(availablePlatforms);
  }, [availablePlatforms, onPlatformsLoaded]);

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const [gamesResponse, listingsResponse] = await Promise.all([
          api.get<GamesResponse>("/games", {
            params: { page: 1, limit: 30 },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }),
          api.get<ListingsResponse>("/listings", {
            params: { page: 1, limit: 200 },
          }),
        ]);

        const listingItems = listingsResponse.data?.items ?? [];
        const menorPrecoPorJogo = new Map<number, number>();
        const plataformasPorJogo = new Map<number, Set<string>>();

        for (const listing of listingItems) {
          if (listing.isActive === false) {
            continue;
          }

          const gameId = listing.gameId ?? listing.game?.id;
          if (!gameId) {
            continue;
          }

          const platformName = String(listing.platform?.name ?? "").trim();
          if (platformName) {
            const currentSet = plataformasPorJogo.get(gameId) ?? new Set<string>();
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
      } catch {
        setGames([]);
        setError("Nao foi possivel carregar os produtos no momento.");
      } finally {
        setLoading(false);
      }
    };

    void carregarJogos();
  }, []);

  useEffect(() => {
    const carregarFavoritos = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setFavoriteIds([]);
        return;
      }

      try {
        const { data } = await api.get<WishlistResponse>("/wishlists", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ids = (data.items ?? []).map((item) => item.gameId);
        setFavoriteIds(ids);
      } catch {
        setFavoriteIds([]);
      }
    };

    void carregarFavoritos();
  }, []);

  const alternarFavorito = async (gameId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }

    const isFavorite = favoriteIds.includes(gameId);

    try {
      setPendingFavoriteId(gameId);

      if (isFavorite) {
        await api.delete(`/wishlists/${gameId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavoriteIds((current) => current.filter((id) => id !== gameId));
      } else {
        await api.post(
          `/wishlists/${gameId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setFavoriteIds((current) => [...current, gameId]);
      }
    } finally {
      setPendingFavoriteId(null);
    }
  };

  if (loading) {
    return <p className="px-6 py-4 text-gray-300">Carregando produtos...</p>;
  }

  if (error) {
    return <p className="px-6 py-4 text-red-300">{error}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filteredGames.map((game) => (
        // O estado visual do coracao e derivado da wishlist do usuario autenticado.
        <div
          key={game.id}
          className="relative my-4 flex flex-col items-start gap-4 rounded-2xl bg-gray-900 p-6 transition-all duration-300 hover:scale-105 hover:bg-gray-700"
        >
          <button
            type="button"
            onClick={() => {
              void alternarFavorito(game.id);
            }}
            disabled={pendingFavoriteId === game.id}
            className="absolute left-4 top-4 z-20 rounded-full bg-black/80 p-3 hover:scale-105 disabled:opacity-60"
            aria-label={
              favoriteIds.includes(game.id)
                ? "Remover dos favoritos"
                : "Adicionar aos favoritos"
            }
          >
            <Heart
              className={
                favoriteIds.includes(game.id)
                  ? "text-red-500 fill-red-500"
                  : "text-white"
              }
            />
          </button>

          <img
            src={game.coverImageUrl || "/logo.png"}
            alt={game.title}
            className="w-full rounded-lg object-cover"
          />
          <h2 className="mb-2 text-left text-2xl font-bold">{game.title}</h2>
          <p className="text-gray-300">{game.description}</p>
          <div className="flex w-full items-center justify-between gap-4">
            <p className="text-sm text-gray-300">
              {game.categories
                ?.slice(0, 2)
                .map((category) => category.name)
                .join(" • ") || "Sem categoria"}
            </p>
            <p className="text-blue-200">
              {typeof game.price === "number"
                ? `R$ ${game.price.toFixed(2)}`
                : "Escolha a plataforma"}
            </p>
            <button className="rounded-3xl bg-blue-900 px-5 py-2 hover:scale-105">
              Comprar
            </button>
          </div>
        </div>
      ))}
      {games.length === 0 && (
        <p className="text-gray-300">Nenhum produto encontrado.</p>
      )}
      {games.length > 0 && filteredGames.length === 0 && (
        <p className="text-gray-300">
          Nenhum resultado para os filtros selecionados.
        </p>
      )}
    </div>
  );
}
