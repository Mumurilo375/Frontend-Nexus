import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  BadgePercent,
  ChevronLeft,
  Heart,
  Loader2,
  ShoppingCart,
  Star,
  ThumbsUp,
} from "lucide-react";
import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import AuthRequiredModal from "../components/globals/AuthRequiredModal";
import api from "../services/api";
import { getAuthUser, isAuthenticated } from "../services/auth";

type Category = {
  id: number;
  name: string;
};

type Tag = {
  id: number;
  name: string;
};

type Platform = {
  id: number;
  name?: string;
  slug?: string;
  iconUrl?: string | null;
};

type GameImage = {
  id: number;
  imageUrl?: string;
  sortOrder?: number;
};

type PlatformListing = {
  id: number;
  price?: number | string;
  platform?: Platform;
};

type GameDetails = {
  id: number;
  title?: string;
  description?: string;
  longDescription?: string;
  releaseDate?: string;
  coverImageUrl?: string;
  categories?: Category[];
  tags?: Tag[];
  images?: GameImage[];
  platformListings?: PlatformListing[];
};

type Promotion = {
  id: number;
  name?: string;
  description?: string | null;
  discountPercentage?: number;
};

type ListingDetailsResponse = {
  id: number;
  gameId?: number;
  platformId?: number;
  price?: number | string;
  isActive?: boolean;
  game?: GameDetails;
  platform?: Platform;
  activePromotions?: Promotion[];
  pricing?: {
    basePrice?: number;
    discountPercentage?: number;
    discountAmount?: number;
    finalPrice?: number;
    hasDiscount?: boolean;
  };
  stock?: {
    available?: number;
    reserved?: number;
    sold?: number;
    total?: number;
  };
  reviewStats?: {
    totalReviews?: number;
    averageRating?: number;
  };
};

type WishlistResponse = {
  items: Array<{ gameId: number }>;
};

type CartResponse = {
  items: Array<{ listingId: number }>;
};

type ReviewVote = {
  id: number;
  userId?: number;
  user?: {
    id?: number;
  };
};

type ReviewItem = {
  id: number;
  rating?: number;
  comment?: string;
  createdAt?: string;
  user?: {
    id?: number;
    username?: string;
    avatarUrl?: string | null;
  };
  votes?: ReviewVote[];
};

type ReviewsResponse = {
  items: ReviewItem[];
};

function toMoney(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function renderStars(value: number) {
  const safeValue = Math.round(Math.max(0, Math.min(5, value)));
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={`star-${index}`}
      className={`h-4 w-4 ${index < safeValue ? "fill-yellow-400 text-yellow-400" : "text-zinc-500"}`}
    />
  ));
}

export default function ListingDetails() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = getAuthUser();
  const isLoggedIn = isAuthenticated();
  const authUserId = Number(authUser?.id ?? 0);
  const parsedListingId = Number(listingId);
  const listingIdIsValid =
    Number.isInteger(parsedListingId) && parsedListingId > 0;

  const [details, setDetails] = useState<ListingDetailsResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [favoriteGameIds, setFavoriteGameIds] = useState<number[]>([]);
  const [cartListingIds, setCartListingIds] = useState<number[]>([]);
  const [busyFavorite, setBusyFavorite] = useState(false);
  const [busyCart, setBusyCart] = useState(false);
  const [busyBuyNow, setBusyBuyNow] = useState(false);
  const [busyVoteReviewId, setBusyVoteReviewId] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const gameId = Number(details?.game?.id ?? 0);
  const currentListingId = Number(details?.id ?? 0);
  const availableStock = Number(details?.stock?.available ?? 0);
  const inCart = cartListingIds.includes(currentListingId);
  const isFavorite = gameId > 0 && favoriteGameIds.includes(gameId);

  const galleryImages = useMemo(() => {
    const cover = String(details?.game?.coverImageUrl ?? "").trim();
    const extras = (details?.game?.images ?? [])
      .map((image) => String(image.imageUrl ?? "").trim())
      .filter(Boolean);

    const allImages = [cover, ...extras].filter(Boolean);
    return Array.from(new Set(allImages));
  }, [details]);

  const goToLogin = () => {
    setShowAuthModal(false);
    navigate("/login", {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const askLogin = () => {
    setShowAuthModal(true);
  };

  const loadListingDetails = async (targetListingId: number) => {
    const { data } = await api.get<ListingDetailsResponse>(
      `/listings/${targetListingId}/details`,
    );
    return data;
  };

  const loadReviews = async (targetGameId: number) => {
    const { data } = await api.get<ReviewsResponse>("/reviews", {
      params: { gameId: targetGameId, page: 1, limit: 20 },
    });
    return data.items ?? [];
  };

  useEffect(() => {
    if (!listingIdIsValid) {
      setLoading(false);
      setError("Listing invalida.");
      setDetails(null);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setActionError("");

        const listingDetails = await loadListingDetails(parsedListingId);

        if (!active) return;
        setDetails(listingDetails);
      } catch {
        if (!active) return;
        setDetails(null);
        setError("Nao foi possivel carregar os detalhes do listing.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [listingIdIsValid, parsedListingId]);

  useEffect(() => {
    if (!gameId) {
      setReviews([]);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        setLoadingReviews(true);
        setReviewError("");
        const items = await loadReviews(gameId);
        if (!active) return;
        setReviews(items);
      } catch {
        if (!active) return;
        setReviews([]);
        setReviewError("Nao foi possivel carregar as avaliacoes.");
      } finally {
        if (active) {
          setLoadingReviews(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [gameId]);

  useEffect(() => {
    if (!isLoggedIn) {
      setFavoriteGameIds([]);
      setCartListingIds([]);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const [{ data: wishlistData }, { data: cartData }] = await Promise.all([
          api.get<WishlistResponse>("/wishlists"),
          api.get<CartResponse>("/cart"),
        ]);

        if (!active) return;

        setFavoriteGameIds(
          (wishlistData.items ?? []).map((item) => item.gameId),
        );
        setCartListingIds((cartData.items ?? []).map((item) => item.listingId));
      } catch {
        if (!active) return;
        setFavoriteGameIds([]);
        setCartListingIds([]);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [isLoggedIn, parsedListingId]);

  useEffect(() => {
    setSelectedImage(galleryImages[0] ?? "");
  }, [galleryImages]);

  const toggleFavorite = async () => {
    if (!gameId) return;

    if (!isLoggedIn) {
      askLogin();
      return;
    }

    try {
      setBusyFavorite(true);

      if (isFavorite) {
        await api.delete(`/wishlists/${gameId}`);
        setFavoriteGameIds((current) => current.filter((id) => id !== gameId));
      } else {
        await api.post(`/wishlists/${gameId}`, {});
        setFavoriteGameIds((current) => [...current, gameId]);
      }

      window.dispatchEvent(new Event("nexus:counts-updated"));
    } finally {
      setBusyFavorite(false);
    }
  };

  const addCurrentListingToCart = async () => {
    if (!currentListingId || inCart) return;

    if (!isLoggedIn) {
      askLogin();
      return;
    }

    try {
      setActionError("");
      setBusyCart(true);
      await api.post(`/cart/${currentListingId}`, {});
      setCartListingIds((current) =>
        current.includes(currentListingId)
          ? current
          : [...current, currentListingId],
      );
      window.dispatchEvent(new Event("nexus:counts-updated"));
    } catch {
      setActionError("Nao foi possivel adicionar o item ao carrinho.");
    } finally {
      setBusyCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!currentListingId) return;

    if (!isLoggedIn) {
      askLogin();
      return;
    }

    try {
      setActionError("");
      setBusyBuyNow(true);

      if (!inCart) {
        await api.post(`/cart/${currentListingId}`, {});
        setCartListingIds((current) =>
          current.includes(currentListingId)
            ? current
            : [...current, currentListingId],
        );
        window.dispatchEvent(new Event("nexus:counts-updated"));
      }

      navigate("/checkout");
    } catch {
      setActionError("Nao foi possivel iniciar a compra agora.");
    } finally {
      setBusyBuyNow(false);
    }
  };

  const hasUserVote = (review: ReviewItem) => {
    return (review.votes ?? []).some(
      (vote) => Number(vote.userId ?? vote.user?.id ?? 0) === authUserId,
    );
  };

  const toggleReviewVote = async (reviewId: number, voted: boolean) => {
    if (!isLoggedIn) {
      askLogin();
      return;
    }

    try {
      setBusyVoteReviewId(reviewId);

      if (voted) {
        await api.delete(`/review-votes/${reviewId}`);
      } else {
        await api.post(`/review-votes/${reviewId}`, {});
      }

      setReviews((current) =>
        current.map((review) => {
          if (review.id !== reviewId) return review;

          const votes = review.votes ?? [];
          if (voted) {
            return {
              ...review,
              votes: votes.filter(
                (vote) =>
                  Number(vote.userId ?? vote.user?.id ?? 0) !== authUserId,
              ),
            };
          }

          return {
            ...review,
            votes: [...votes, { id: Date.now(), userId: authUserId }],
          };
        }),
      );
    } finally {
      setBusyVoteReviewId(null);
    }
  };

  const submitReview = async () => {
    if (!isLoggedIn) {
      askLogin();
      return;
    }

    if (!gameId) return;

    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      setReviewError("Escreva um comentario para enviar sua avaliacao.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError("");

      await api.post("/reviews", {
        gameId,
        rating: reviewRating,
        comment: trimmedComment,
      });

      setReviewComment("");
      setReviewRating(5);

      const [listingDetails, reviewItems] = await Promise.all([
        loadListingDetails(parsedListingId),
        loadReviews(gameId),
      ]);

      setDetails(listingDetails);
      setReviews(reviewItems);
    } catch (error: any) {
      setReviewError(
        String(
          error?.response?.data?.message ??
            "Nao foi possivel enviar sua avaliacao.",
        ),
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const gameTitle = details?.game?.title || "Jogo";
  const gameDescription = details?.game?.description || "Sem descricao curta.";
  const gameLongDescription = details?.game?.longDescription || gameDescription;

  const pricing = details?.pricing ?? {};
  const basePrice = Number(pricing.basePrice ?? details?.price ?? 0);
  const finalPrice = Number(pricing.finalPrice ?? basePrice);
  const discountPercentage = Number(pricing.discountPercentage ?? 0);

  const platformListings = details?.game?.platformListings ?? [];

  return (
    <div>
      <NavBar />

      <AuthRequiredModal
        open={showAuthModal}
        title="Entre para continuar"
        message="Essa acao exige login. Deseja entrar agora?"
        onClose={() => setShowAuthModal(false)}
        onConfirm={goToLogin}
      />

      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6">
        <div className="mb-6 flex items-center gap-3 text-sm text-zinc-300">
          <Link
            to="/loja"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 transition hover:border-blue-400/50 hover:text-blue-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para loja
          </Link>
          <span className="text-zinc-500">/</span>
          <span className="truncate text-zinc-200">{gameTitle}</span>
        </div>

        {loading && (
          <div className="mt-14 flex items-center justify-center gap-3 text-zinc-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando detalhes do listing...
          </div>
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-400/40 bg-red-950/30 p-6">
            <h1 className="text-2xl font-bold text-white">Falha ao carregar</h1>
            <p className="mt-2 text-red-200">{error}</p>
            <Link
              to="/loja"
              className="mt-4 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Voltar para loja
            </Link>
          </section>
        )}

        {!loading && !error && details && (
          <>
            <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <article className="overflow-hidden rounded-3xl border border-white/12 bg-linear-to-b from-blue-950/25 via-zinc-950/70 to-zinc-950/90 p-4 shadow-[0_22px_55px_rgba(0,0,0,0.5)] sm:p-6">
                  <div className="overflow-hidden rounded-2xl border border-white/12 bg-black/60">
                    <img
                      src={selectedImage || "/logo.png"}
                      alt={gameTitle}
                      className="h-80 w-full object-contain sm:h-105"
                    />
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="nexus-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                      {galleryImages.map((imageUrl, index) => {
                        const selected = selectedImage === imageUrl;

                        return (
                          <button
                            key={`${imageUrl}-${index}`}
                            type="button"
                            onClick={() => setSelectedImage(imageUrl)}
                            className={`overflow-hidden rounded-lg border transition ${
                              selected
                                ? "border-blue-400"
                                : "border-white/10 hover:border-blue-300/60"
                            }`}
                          >
                            <img
                              src={imageUrl}
                              alt={`${gameTitle} preview ${index + 1}`}
                              className="h-16 w-28 object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </article>

                <article className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 sm:p-6">
                  <h2 className="text-2xl font-bold text-white">
                    Sobre o jogo
                  </h2>
                  <p className="mt-3 leading-relaxed text-zinc-200">
                    {gameLongDescription}
                  </p>

                  <dl className="mt-5 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <dt className="text-zinc-400">Lancamento</dt>
                      <dd className="mt-1 font-medium text-zinc-100">
                        {formatDate(details.game?.releaseDate)}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <dt className="text-zinc-400">Avaliacao media</dt>
                      <dd className="mt-1 font-medium text-zinc-100">
                        {Number(
                          details.reviewStats?.averageRating ?? 0,
                        ).toFixed(1)}{" "}
                        / 5
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(details.game?.categories ?? []).map((category) => (
                      <span
                        key={`cat-${category.id}`}
                        className="rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-100"
                      >
                        {category.name}
                      </span>
                    ))}

                    {(details.game?.tags ?? []).map((tag) => (
                      <span
                        key={`tag-${tag.id}`}
                        className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </article>
              </div>

              <aside className="rounded-3xl border border-white/10 bg-zinc-900/85 p-5 shadow-[0_22px_55px_rgba(0,0,0,0.45)] lg:sticky lg:top-28 lg:h-fit sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-3xl font-black leading-tight text-white">
                      {gameTitle}
                    </h1>
                    <p className="mt-2 text-sm text-zinc-300">
                      {details.platform?.name || "Plataforma nao informada"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void toggleFavorite();
                    }}
                    disabled={busyFavorite || !gameId}
                    className="rounded-full border border-white/15 bg-black/50 p-2 text-white transition hover:scale-105 hover:border-red-400/60 disabled:opacity-60"
                    aria-label={
                      isFavorite
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isFavorite
                          ? "fill-red-500 text-red-500"
                          : "text-zinc-100"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      {discountPercentage > 0 && (
                        <p className="text-sm text-zinc-400 line-through">
                          {toMoney(basePrice)}
                        </p>
                      )}
                      <p className="text-3xl font-black text-blue-200">
                        {toMoney(finalPrice)}
                      </p>
                    </div>

                    {discountPercentage > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                        <BadgePercent className="h-3.5 w-3.5" />-
                        {discountPercentage}%
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-zinc-300">
                    Estoque disponivel: {availableStock}
                  </p>

                  {availableStock <= 0 && (
                    <p className="mt-2 text-sm font-semibold text-red-300">
                      Este listing esta sem estoque no momento.
                    </p>
                  )}

                  {(details.activePromotions ?? []).length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-emerald-200">
                      {(details.activePromotions ?? []).map((promotion) => (
                        <li key={`promo-${promotion.id}`}>
                          Promocao ativa: {promotion.name || "Oferta especial"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-zinc-200">
                    Escolha a plataforma
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {platformListings.map((listing) => {
                      const selected = Number(listing.id) === currentListingId;
                      const platformName =
                        listing.platform?.name || "Plataforma";

                      return (
                        <button
                          key={`platform-${listing.id}`}
                          type="button"
                          onClick={() => navigate(`/loja/${listing.id}`)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                            selected
                              ? "border-blue-400 bg-blue-500/20 text-blue-100"
                              : "border-white/12 bg-black/40 text-zinc-200 hover:border-blue-300/50"
                          }`}
                        >
                          <p className="font-semibold">{platformName}</p>
                          <p className="text-xs text-zinc-400">
                            {toMoney(Number(listing.price ?? 0))}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void addCurrentListingToCart();
                    }}
                    disabled={busyCart || inCart || availableStock <= 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {inCart
                      ? "Ja esta no carrinho"
                      : busyCart
                        ? "Adicionando..."
                        : "Adicionar ao carrinho"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void handleBuyNow();
                    }}
                    disabled={busyBuyNow || availableStock <= 0}
                    className="rounded-xl border border-cyan-300/50 bg-cyan-500/15 px-4 py-3 font-bold text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-60"
                  >
                    {busyBuyNow ? "Processando..." : "Comprar agora"}
                  </button>
                </div>

                {actionError && (
                  <p className="mt-3 text-sm text-red-300">{actionError}</p>
                )}
              </aside>
            </section>

            <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
              <article className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 sm:p-6">
                <header className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Avaliacoes
                    </h2>
                    <p className="text-sm text-zinc-300">
                      {details.reviewStats?.totalReviews ?? 0} avaliacoes
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(
                      Number(details.reviewStats?.averageRating ?? 0),
                    )}
                  </div>
                </header>

                {loadingReviews && (
                  <p className="text-zinc-300">Carregando avaliacoes...</p>
                )}

                {!loadingReviews && reviewError && (
                  <p className="text-red-300">{reviewError}</p>
                )}

                {!loadingReviews && !reviewError && reviews.length === 0 && (
                  <p className="text-zinc-300">
                    Ainda nao existem avaliacoes para este jogo.
                  </p>
                )}

                <div className="space-y-3">
                  {reviews.map((review) => {
                    const voted = hasUserVote(review);
                    const votesCount = (review.votes ?? []).length;

                    return (
                      <div
                        key={`review-${review.id}`}
                        className="rounded-2xl border border-white/10 bg-black/35 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-100">
                              {review.user?.username || "Usuario"}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStars(Number(review.rating ?? 0))}
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                          {review.comment || "Sem comentario."}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            void toggleReviewVote(review.id, voted);
                          }}
                          disabled={busyVoteReviewId === review.id}
                          className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            voted
                              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                              : "border-white/10 bg-black/40 text-zinc-300 hover:border-blue-400/50"
                          } disabled:opacity-60`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {voted ? "Voto registrado" : "Marcar como util"} (
                          {votesCount})
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>

              <aside className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-white">
                  Escrever avaliacao
                </h2>
                <p className="mt-1 text-sm text-zinc-300">
                  Compartilhe sua experiencia para ajudar outros jogadores.
                </p>

                <label
                  className="mt-4 block text-sm text-zinc-300"
                  htmlFor="rating-select"
                >
                  Nota
                </label>
                <select
                  id="rating-select"
                  value={reviewRating}
                  onChange={(event) =>
                    setReviewRating(Number(event.target.value))
                  }
                  className="mt-1 w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 outline-none focus:border-blue-400"
                >
                  <option value={5}>5 - Excelente</option>
                  <option value={4}>4 - Muito bom</option>
                  <option value={3}>3 - Bom</option>
                  <option value={2}>2 - Regular</option>
                  <option value={1}>1 - Fraco</option>
                </select>

                <label
                  className="mt-4 block text-sm text-zinc-300"
                  htmlFor="review-comment"
                >
                  Comentario
                </label>
                <textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="Escreva sua opiniao sobre jogabilidade, desempenho e historia."
                ></textarea>

                {reviewError && (
                  <p className="mt-3 text-sm text-red-300">{reviewError}</p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    void submitReview();
                  }}
                  disabled={submittingReview}
                  className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                >
                  {submittingReview ? "Enviando..." : "Publicar avaliacao"}
                </button>
              </aside>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
