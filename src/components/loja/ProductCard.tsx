import type { KeyboardEvent, MouseEvent } from "react";
import { Heart } from "lucide-react";
import { resolveAssetUrl, resolvePlatformLogoUrl } from "../../services/assets";
import type { CartFeedback, GameSummary, ListingItem } from "./store.types";
import { clampTextStyle, getListingAvailableStock } from "./store.utils";

type ProductCardProps = {
  game: GameSummary;
  listings: ListingItem[];
  selectedListing: ListingItem | null;
  inCart: boolean;
  isFavorite: boolean;
  pendingFavorite: boolean;
  pendingCart: boolean;
  feedback?: CartFeedback | null;
  onOpen: (gameId: number) => void;
  onToggleFavorite: (gameId: number) => void;
  onSelectListing: (gameId: number, listingId: number) => void;
  onAddToCart: (gameId: number, listingId: number) => void;
};

export default function ProductCard({
  game,
  listings,
  selectedListing,
  inCart,
  isFavorite,
  pendingFavorite,
  pendingCart,
  feedback,
  onOpen,
  onToggleFavorite,
  onSelectListing,
  onAddToCart,
}: ProductCardProps) {
  const selectedListingHasStockInfo = Boolean(selectedListing?.stock);
  const selectedListingAvailableStock = getListingAvailableStock(selectedListing);
  const selectedListingIsOutOfStock =
    selectedListingHasStockInfo && selectedListingAvailableStock <= 0;

  const stopCardNavigation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen(game.id);
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => onOpen(game.id)}
      onKeyDown={handleCardKeyDown}
      className="nexus-card relative my-1 flex cursor-pointer flex-col items-start gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-600"
    >
      <button
        type="button"
        onMouseDown={stopCardNavigation}
        onClick={(event) => {
          stopCardNavigation(event);
          onToggleFavorite(game.id);
        }}
        disabled={pendingFavorite}
        className="absolute left-4 top-4 z-20 rounded-full border border-slate-700 bg-slate-950/90 p-2.5 transition hover:border-slate-500 disabled:opacity-60"
        aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-100"} />
      </button>

      <div className="flex h-44 w-full items-center justify-center rounded-[20px] border border-slate-800 bg-black/15 p-3">
        <img
          src={resolveAssetUrl(game.coverImageUrl)}
          alt={game.title}
          className="max-h-full w-full object-contain"
        />
      </div>

      <h2 className="mb-1 text-left text-xl font-bold">{game.title}</h2>
      <p className="text-sm text-gray-300" style={clampTextStyle}>
        {game.description}
      </p>

      <div className="w-full">
        <p className="mb-2 text-sm text-gray-300">Escolha a plataforma:</p>
        <div className="flex flex-wrap gap-2">
          {listings.map((listing) => {
            const selected = selectedListing?.id === listing.id;
            const listingIsOutOfStock =
              Boolean(listing.stock) && getListingAvailableStock(listing) <= 0;

            return (
              <button
                key={listing.id}
                type="button"
                onMouseDown={stopCardNavigation}
                onClick={(event) => {
                  stopCardNavigation(event);
                  onSelectListing(game.id, listing.id);
                }}
                className={`rounded-xl border px-2 py-2 transition ${
                  selected
                    ? listingIsOutOfStock
                      ? "border-rose-400/70 bg-rose-500/10"
                      : "border-slate-500 bg-slate-800/90"
                    : listingIsOutOfStock
                      ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-400/60"
                      : "border-slate-700 bg-slate-950/85 hover:border-slate-500"
                }`}
                title={listing.platform?.name || "Plataforma"}
              >
                <img
                  src={resolvePlatformLogoUrl(listing.platform?.name)}
                  alt={listing.platform?.name || "Plataforma"}
                  className={`h-8 w-8 object-contain ${listingIsOutOfStock ? "opacity-55" : ""}`}
                />
              </button>
            );
          })}
        </div>

        {selectedListingHasStockInfo && (
          <p
            className={`mt-3 text-xs font-medium ${
              selectedListingIsOutOfStock ? "text-rose-200" : "text-emerald-200"
            }`}
          >
            {selectedListingIsOutOfStock
              ? "Plataforma indisponível no momento."
              : `Estoque disponível: ${selectedListingAvailableStock}`}
          </p>
        )}
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full items-center justify-between gap-4">
          <p className="text-sm text-gray-300">
            {game.categories?.slice(0, 2).map((category) => category.name).join(" • ") ||
              "Sem categoria"}
          </p>
          <p className="text-sm font-semibold text-white">
            {selectedListing?.price ? `R$ ${Number(selectedListing.price).toFixed(2)}` : ""}
          </p>
        </div>

        <button
          type="button"
          onMouseDown={stopCardNavigation}
          onClick={(event) => {
            stopCardNavigation(event);
            if (!selectedListing || selectedListingIsOutOfStock) {
              return;
            }

            onAddToCart(game.id, selectedListing.id);
          }}
          disabled={!selectedListing || inCart || pendingCart || selectedListingIsOutOfStock}
          className={`rounded-full px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-75 ${
            selectedListingIsOutOfStock
              ? "cursor-not-allowed border border-rose-500/40 bg-rose-500/10 text-rose-100"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {!selectedListing
            ? "Escolha a plataforma"
            : inCart
              ? "No carrinho"
              : selectedListingIsOutOfStock
                ? "Sem estoque"
                : pendingCart
                  ? "Adicionando..."
                  : "Adicionar"}
        </button>

        {feedback && (
          <p
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.tone === "error"
                ? "border-rose-500/35 bg-rose-500/10 text-rose-100"
                : "border-blue-500/25 bg-blue-500/10 text-blue-100"
            }`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </article>
  );
}
