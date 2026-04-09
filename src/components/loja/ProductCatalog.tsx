import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import api from "../../services/api";
import AuthRequiredModal from "../globals/AuthRequiredModal";
import Pagination from "../globals/Pagination";
import ProductCard from "./ProductCard";
import type {
  CartFeedback,
  GamesResponse,
  GameSummary,
  ListingMap,
  ListingsResponse,
  WishlistResponse,
} from "./store.types";
import {
  PAGE_SIZE,
  buildCatalogState,
  filterGames,
  getRequestErrorMessage,
  getSelectedListing,
  normalizeText,
} from "./store.utils";

export default function ProductCatalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const [games, setGames] = useState<GameSummary[]>([]);
  const [listingByGame, setListingByGame] = useState<ListingMap>(new Map());
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [cartListingIds, setCartListingIds] = useState<number[]>([]);
  const [selectedListingByGame, setSelectedListingByGame] = useState<
    Record<number, number>
  >({});
  const [cartFeedback, setCartFeedback] = useState<CartFeedback | null>(null);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(
    null,
  );
  const [pendingCartGameId, setPendingCartGameId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const selectedPlatforms = useMemo(
    () => searchParams.getAll("platform").map((value) => value.trim()).filter(Boolean),
    [searchParams],
  );
  const selectedCategories = useMemo(
    () => searchParams.getAll("category").map((value) => value.trim()).filter(Boolean),
    [searchParams],
  );
  const selectedPlatformSet = useMemo(
    () => new Set(selectedPlatforms.map(normalizeText)),
    [selectedPlatforms],
  );
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  const filteredGames = useMemo(
    () => filterGames(games, selectedCategories, selectedPlatforms, query),
    [games, query, selectedCategories, selectedPlatforms],
  );
  const totalPages = Math.max(1, Math.ceil(filteredGames.length / PAGE_SIZE));
  const paginatedGames = useMemo(
    () => filteredGames.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredGames, page],
  );

  useEffect(() => {
    setPage(1);
  }, [games, query, selectedCategories, selectedPlatforms]);

  useEffect(() => {
    if (!cartFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCartFeedback((current) =>
        current?.gameId === cartFeedback.gameId ? null : current,
      );
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [cartFeedback]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        setError("");

        const [{ data: gamesData }, { data: listingsData }] = await Promise.all([
          api.get<GamesResponse>("/games", { params: { page: 1, limit: 30 } }),
          api.get<ListingsResponse>("/listings", {
            params: { page: 1, limit: 100, includeStock: true },
          }),
        ]);

        const catalog = buildCatalogState(
          gamesData.items ?? [],
          (listingsData.items ?? []).filter((listing) => listing.isActive !== false),
        );

        setGames(catalog.games);
        setListingByGame(catalog.listingByGame);
        setCartFeedback(null);
      } catch (loadError) {
        setGames([]);
        setListingByGame(new Map());
        setError(
          getRequestErrorMessage(
            loadError,
            "Não foi possível carregar os produtos no momento.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCatalog();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteIds([]);
      setCartListingIds([]);
      return;
    }

    const loadUserSelections = async () => {
      try {
        const [{ data: wishlistData }, { data: cartData }] = await Promise.all([
          api.get<WishlistResponse>("/wishlists"),
          api.get<{ items: Array<{ listingId: number }> }>("/cart"),
        ]);

        setFavoriteIds((wishlistData.items ?? []).map((item) => item.gameId));
        setCartListingIds((cartData.items ?? []).map((item) => item.listingId));
      } catch {
        setFavoriteIds([]);
        setCartListingIds([]);
      }
    };

    void loadUserSelections();
  }, [isAuthenticated]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const askLogin = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

  const goToLogin = () => {
    closeAuthModal();
    void navigate("/login", {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const openGameDetails = (gameId: number) => {
    void navigate(`/loja/${gameId}`);
  };

  const getListingsForGame = (gameId: number) => {
    const listings = listingByGame.get(gameId) ?? [];

    return selectedPlatformSet.size === 0
      ? listings
      : listings.filter((listing) =>
          selectedPlatformSet.has(normalizeText(String(listing.platform?.name ?? ""))),
        );
  };

  const handleToggleFavorite = async (gameId: number) => {
    if (!isAuthenticated) {
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

  const handleSelectListing = (gameId: number, listingId: number) => {
    setSelectedListingByGame((current) => ({
      ...current,
      [gameId]: listingId,
    }));
    setCartFeedback((current) => (current?.gameId === gameId ? null : current));
  };

  const markListingAsOutOfStock = (gameId: number, listingId: number) => {
    setListingByGame((current) => {
      const listings = current.get(gameId);
      if (!listings) return current;

      const nextListingByGame = new Map(current);
      nextListingByGame.set(
        gameId,
        listings.map((listing) =>
          listing.id === listingId
            ? {
                ...listing,
                stock: {
                  ...listing.stock,
                  available: 0,
                },
              }
            : listing,
        ),
      );

      return nextListingByGame;
    });
  };

  const handleAddToCart = async (gameId: number, listingId: number) => {
    if (!isAuthenticated) {
      askLogin();
      return;
    }

    try {
      setCartFeedback(null);
      setPendingCartGameId(gameId);
      await api.post(`/cart/${listingId}`);
      setCartListingIds((current) =>
        current.includes(listingId) ? current : [...current, listingId],
      );
      window.dispatchEvent(new Event("nexus:counts-updated"));
    } catch (cartError) {
      if (
        isAxiosError(cartError) &&
        cartError.response?.data?.code === "OUT_OF_STOCK"
      ) {
        markListingAsOutOfStock(gameId, listingId);
      }

      setCartFeedback({
        gameId,
        tone: "error",
        message: getRequestErrorMessage(
          cartError,
          "Não foi possível adicionar o item ao carrinho.",
        ),
      });
    } finally {
      setPendingCartGameId(null);
    }
  };

  if (loading) {
    return <p className="nexus-card px-6 py-5 text-gray-300">Carregando produtos...</p>;
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
        message="Para adicionar aos favoritos ou ao carrinho, faça login na sua conta."
        onClose={closeAuthModal}
        onConfirm={goToLogin}
      />

      {games.length === 0 && (
        <p className="nexus-card p-6 text-gray-300">Nenhum produto encontrado.</p>
      )}

      {games.length > 0 && filteredGames.length === 0 && (
        <p className="nexus-card p-6 text-gray-300">
          Nenhum resultado para os filtros selecionados.
        </p>
      )}

      {filteredGames.length > 0 && (
        <>
          <div className=" grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedGames.map((game) => {
              const listings = getListingsForGame(game.id);
              const selectedListing = getSelectedListing(
                listings,
                selectedListingByGame[game.id],
              );

              return (
                <ProductCard
                  key={game.id}
                  game={game}
                  listings={listings}
                  selectedListing={selectedListing}
                  inCart={Boolean(
                    selectedListing && cartListingIds.includes(selectedListing.id),
                  )}
                  isFavorite={favoriteIds.includes(game.id)}
                  pendingFavorite={pendingFavoriteId === game.id}
                  pendingCart={pendingCartGameId === game.id}
                  feedback={cartFeedback?.gameId === game.id ? cartFeedback : null}
                  onOpen={openGameDetails}
                  onToggleFavorite={(gameId) => {
                    void handleToggleFavorite(gameId);
                  }}
                  onSelectListing={handleSelectListing}
                  onAddToCart={(gameId, listingId) => {
                    void handleAddToCart(gameId, listingId);
                  }}
                />
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
