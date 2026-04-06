import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  BadgePercent,
  ChevronLeft,
  ChevronRight,
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

type Category = { id: number; name: string };
type Tag = { id: number; name: string };
type Platform = { id: number; name?: string; slug?: string; iconUrl?: string | null };
type GameImage = { id: number; imageUrl?: string; sortOrder?: number };
type Promotion = { id: number; name?: string; description?: string | null; discountPercentage?: number };
type PlatformListing = {
  id: number;
  price?: number | string;
  platform?: Platform;
  activePromotions?: Promotion[];
  pricing?: {
    basePrice?: number;
    discountPercentage?: number;
    discountAmount?: number;
    finalPrice?: number;
    hasDiscount?: boolean;
  };
  stock?: { available?: number; reserved?: number; sold?: number; total?: number };
};
type GameDetailsResponse = {
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
  reviewStats?: { totalReviews?: number; averageRating?: number };
};
type CartResponse = { items: Array<{ listingId: number }> };
type ReviewVote = { id: number; userId?: number; user?: { id?: number } };
type ReviewItem = {
  id: number;
  rating?: number;
  comment?: string;
  createdAt?: string;
  user?: { id?: number; username?: string; avatarUrl?: string | null };
  votes?: ReviewVote[];
};
type ReviewsResponse = { items: ReviewItem[] };
const REVIEW_COMMENT_MAX_LENGTH = 500;

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

export default function GameDetails() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = getAuthUser();
  const isLoggedIn = isAuthenticated();
  const authUserId = Number(authUser?.id ?? 0);
  const parsedGameId = Number(gameId);
  const gameIdIsValid = Number.isInteger(parsedGameId) && parsedGameId > 0;

  const [details, setDetails] = useState<GameDetailsResponse | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [cartListingIds, setCartListingIds] = useState<number[]>([]);
  const [busyCart, setBusyCart] = useState(false);
  const [busyBuyNow, setBusyBuyNow] = useState(false);
  const [busyVoteReviewId, setBusyVoteReviewId] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const gameTitle = details?.title || "Jogo";
  const gameDescription = details?.description || "Sem descricao curta.";
  const gameLongDescription = details?.longDescription || gameDescription;
  const coverImage = String(details?.coverImageUrl ?? "").trim() || "/logo.png";
  const reviewAverage = Number(details?.reviewStats?.averageRating ?? 0);
  const reviewTotal = Number(details?.reviewStats?.totalReviews ?? 0);
  const platformListings = details?.platformListings ?? [];
  const currentListing = useMemo(() => {
    if (platformListings.length === 0) return null;
    if (!selectedListingId) return platformListings[0];
    return (
      platformListings.find((listing) => Number(listing.id) === selectedListingId) ??
      platformListings[0]
    );
  }, [platformListings, selectedListingId]);

  const currentGameId = Number(details?.id ?? 0);
  const currentListingId = Number(currentListing?.id ?? 0);
  const availableStock = Number(currentListing?.stock?.available ?? 0);
  const pricing = currentListing?.pricing ?? {};
  const basePrice = Number(pricing.basePrice ?? currentListing?.price ?? 0);
  const finalPrice = Number(pricing.finalPrice ?? basePrice);
  const discountPercentage = Number(pricing.discountPercentage ?? 0);
  const activePromotions = currentListing?.activePromotions ?? [];
  const inCart = currentListingId > 0 && cartListingIds.includes(currentListingId);
  const infoItems = [
    { label: "Lançamento", value: formatDate(details?.releaseDate) },
    { label: "Avaliação", value: `${reviewAverage.toFixed(1)} / 5` },
  ];

  const galleryImages = useMemo(() => {
    const extras = (details?.images ?? [])
      .map((image) => String(image.imageUrl ?? "").trim())
      .filter(Boolean);

    return Array.from(new Set([coverImage, ...extras]));
  }, [coverImage, details?.images]);

  const currentImageIndex = Math.max(
    0,
    galleryImages.findIndex((imageUrl) => imageUrl === selectedImage),
  );

  const goToLogin = () => {
    setShowAuthModal(false);
    navigate("/login", {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const askLogin = () => {
    setShowAuthModal(true);
  };

  const loadGameDetails = async (targetGameId: number) => {
    const { data } = await api.get<GameDetailsResponse>(
      `/games/${targetGameId}/details`,
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
    if (!gameIdIsValid) {
      setLoading(false);
      setError("Jogo invalido.");
      setDetails(null);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setActionError("");

        const gameDetails = await loadGameDetails(parsedGameId);

        if (!active) return;
        setDetails(gameDetails);
      } catch {
        if (!active) return;
        setDetails(null);
        setError("Nao foi possivel carregar os detalhes do jogo.");
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
  }, [gameIdIsValid, parsedGameId]);

  useEffect(() => {
    if (!currentGameId) {
      setReviews([]);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        setLoadingReviews(true);
        setReviewError("");
        const items = await loadReviews(currentGameId);
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
  }, [currentGameId]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCartListingIds([]);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const { data: cartData } = await api.get<CartResponse>("/cart");

        if (!active) return;

        setCartListingIds((cartData.items ?? []).map((item) => item.listingId));
      } catch {
        if (!active) return;
        setCartListingIds([]);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [isLoggedIn, parsedGameId]);

  useEffect(() => {
    if (platformListings.length === 0) {
      setSelectedListingId(null);
      return;
    }

    setSelectedListingId((current) => {
      if (
        current &&
        platformListings.some((listing) => Number(listing.id) === current)
      ) {
        return current;
      }

      return Number(platformListings[0]?.id ?? 0);
    });
  }, [platformListings]);

  useEffect(() => {
    setSelectedImage(galleryImages[0] ?? coverImage);
  }, [coverImage, galleryImages]);

  const stepGalleryImage = (direction: -1 | 1) => {
    if (galleryImages.length <= 1) return;

    const nextIndex =
      (currentImageIndex + direction + galleryImages.length) %
      galleryImages.length;

    setSelectedImage(galleryImages[nextIndex] ?? coverImage);
  };

  const addCurrentListingToCart = async () => {
    if (!currentListingId) return;

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

      await api.post(`/cart/${currentListingId}`, {});
      setCartListingIds((current) =>
        current.includes(currentListingId)
          ? current
          : [...current, currentListingId],
      );
      window.dispatchEvent(new Event("nexus:counts-updated"));

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

    if (!currentGameId) return;

    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      setReviewError("Escreva um comentario para enviar sua avaliacao.");
      return;
    }

    if (trimmedComment.length > REVIEW_COMMENT_MAX_LENGTH) {
      setReviewError(
        `A avaliacao deve ter no maximo ${REVIEW_COMMENT_MAX_LENGTH} caracteres.`,
      );
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError("");

      await api.post("/reviews", {
        gameId: currentGameId,
        rating: reviewRating,
        comment: trimmedComment,
      });

      setReviewComment("");
      setReviewRating(5);

      const [gameDetails, reviewItems] = await Promise.all([
        loadGameDetails(parsedGameId),
        loadReviews(currentGameId),
      ]);

      setDetails(gameDetails);
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

  return (
    <div className="nexus-page-shell">
      <NavBar />

      <AuthRequiredModal
        open={showAuthModal}
        title="Entre para continuar"
        message="Essa acao exige login. Deseja entrar agora?"
        onClose={() => setShowAuthModal(false)}
        onConfirm={goToLogin}
      />

      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link
            to="/loja"
            className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 transition hover:border-blue-400/50 hover:text-blue-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para loja
          </Link>
          <h1 className="truncate text-3xl font-black text-white sm:text-4xl">
            {gameTitle}
          </h1>
        </div>

        {loading && (
          <div className="nexus-card mt-14 flex items-center justify-center gap-3 px-6 py-8 text-zinc-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando detalhes do jogo...
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
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_380px]">
              <div className="space-y-3">
                <article className="nexus-panel px-3 pt-3 pb-3 sm:px-4 sm:pt-4 sm:pb-3">
                  <div className="overflow-hidden border border-white/12 bg-slate-950/80">
                    <img
                      src={selectedImage || coverImage}
                      alt={gameTitle}
                      className="aspect-[21/10] w-full object-cover"
                    />
                  </div>

                  <div className="nexus-scrollbar mt-1.5 flex gap-2 overflow-x-auto">
                    {galleryImages.map((imageUrl, index) => {
                      const selected = selectedImage === imageUrl;

                      return (
                        <button
                          key={`${imageUrl}-${index}`}
                          type="button"
                          onClick={() => setSelectedImage(imageUrl)}
                          className={`shrink-0 overflow-hidden border transition ${
                            selected
                              ? "border-blue-400 shadow-[0_0_0_2px_rgba(96,165,250,0.3)]"
                              : "border-white/10 hover:border-blue-300/60"
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={`${gameTitle} miniatura ${index + 1}`}
                            className="h-14 w-24 object-cover sm:h-16 sm:w-28"
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-1.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => stepGalleryImage(-1)}
                      disabled={galleryImages.length <= 1}
                      className="border border-white/10 bg-black/35 p-1 text-zinc-300 transition hover:border-blue-400/50 hover:text-white disabled:opacity-40"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => stepGalleryImage(1)}
                      disabled={galleryImages.length <= 1}
                      className="border border-white/10 bg-black/35 p-1 text-zinc-300 transition hover:border-blue-400/50 hover:text-white disabled:opacity-40"
                      aria-label="Proxima imagem"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>

                <article className="nexus-panel relative overflow-hidden border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 sm:p-7">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-cyan-200/80">
                    Sobre o jogo
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Explore o universo de {gameTitle}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-100 sm:text-lg sm:leading-8">
                    {gameLongDescription}
                  </p>
                </article>

                <article className="nexus-card p-5 sm:p-6">
                  <header className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Avaliacoes
                      </h2>
                      <p className="text-sm text-zinc-300">
                        {reviewTotal} avaliacoes
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(reviewAverage)}
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
                        <div key={`review-${review.id}`} className="nexus-card p-4">
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

                          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">
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
              </div>

              <aside className="nexus-panel p-5 lg:sticky lg:top-28 lg:h-fit sm:p-6">
                <div className="overflow-hidden border border-white/10 bg-slate-950/70">
                  <img
                    src={coverImage}
                    alt={`${gameTitle} capa`}
                    className="aspect-video w-full object-cover"
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {gameDescription}
                </p>

                <div className="mt-4 space-y-2 text-sm text-zinc-300">
                  {infoItems.map((item) => (
                    <p key={item.label}>
                      <span className="font-semibold text-zinc-100">
                        {item.label}:
                      </span>{" "}
                      <span className="text-zinc-300">
                        {item.value}
                      </span>
                    </p>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[...(details.categories ?? []), ...(details.tags ?? [])].map(
                    (item) => (
                      <span
                        key={`${item.name}-${item.id}`}
                        className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100"
                      >
                        {item.name}
                      </span>
                    ),
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
                  {currentListing ? (
                    <>
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
                          Esta plataforma esta sem estoque no momento.
                        </p>
                      )}

                      {activePromotions.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-emerald-200">
                          {activePromotions.map((promotion) => (
                            <li key={`promo-${promotion.id}`}>
                              Promocao ativa: {promotion.name || "Oferta especial"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-zinc-300">
                      Nenhuma plataforma disponivel para este jogo no momento.
                    </p>
                  )}
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-zinc-200">
                    Escolha a plataforma
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {platformListings.map((listing) => {
                      const selected = Number(listing.id) === currentListingId;
                      const platformName = listing.platform?.name || "Plataforma";
                      const listingPrice = Number(
                        listing.pricing?.finalPrice ?? listing.price ?? 0,
                      );

                      return (
                        <button
                          key={`platform-${listing.id}`}
                          type="button"
                          onClick={() => {
                            setSelectedListingId(Number(listing.id));
                            setActionError("");
                          }}
                          className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                            selected
                              ? "border-blue-400 bg-blue-500/20 text-blue-100"
                              : "border-white/12 bg-black/40 text-zinc-200 hover:border-blue-300/50"
                          }`}
                        >
                          <p className="font-semibold">{platformName}</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {toMoney(listingPrice)}
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
                    disabled={
                      busyCart ||
                      availableStock <= 0 ||
                      !currentListing
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {busyCart
                        ? "Adicionando..."
                        : inCart
                          ? "Adicionar mais uma"
                          : "Adicionar ao carrinho"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void handleBuyNow();
                    }}
                    disabled={
                      busyBuyNow ||
                      availableStock <= 0 ||
                      !currentListing
                    }
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

            <section className="mt-6 lg:ml-auto lg:max-w-[340px]">
              <aside className="nexus-card p-5 sm:p-6">
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
                  maxLength={REVIEW_COMMENT_MAX_LENGTH}
                  className="mt-1 w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="Escreva sua opiniao sobre jogabilidade, desempenho e historia."
                ></textarea>

                <p className="mt-2 text-right text-xs text-zinc-400">
                  {reviewComment.length}/{REVIEW_COMMENT_MAX_LENGTH}
                </p>

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
