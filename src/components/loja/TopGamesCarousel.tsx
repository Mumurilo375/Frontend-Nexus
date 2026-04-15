import { ChevronLeft, ChevronRight, Flame, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { resolveAssetUrl } from "../../services/assets";
import { toMoney } from "./store.utils";

export type TopGamesCarouselItem = {
  id: number;
  title: string;
  coverImageUrl?: string;
  soldCount: number;
  lowestPrice: number | null;
  categories: string[];
};

type TopGamesCarouselProps = {
  items: TopGamesCarouselItem[];
  hasSales: boolean;
  onOpen: (gameId: number) => void;
};

export default function TopGamesCarousel({
  items,
  hasSales,
  onOpen,
}: TopGamesCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  const activeItem = items[activeIndex];
  const title = hasSales ? "Mais vendidos" : "Jogos relevantes";
  const subtitle = hasSales
    ? "Com base no total vendido das plataformas"
    : "Selecao baseada em variedade, categorias e precos";

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % items.length);
  };

  return (
    <section className="nexus-panel relative mb-6 overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute -left-20 -top-16 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Destaques Nexus
          </p>
          <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">{title}</h2>
          
        </div>

        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={goToPrevious}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-100 transition hover:border-slate-500"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-100 transition hover:border-slate-500"
            aria-label="Proximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <article
        role="button"
        tabIndex={0}
        onClick={() => onOpen(activeItem.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(activeItem.id);
          }
        }}
        className="relative z-10 grid cursor-pointer gap-4 overflow-hidden rounded-3xl border border-slate-700 bg-slate-950/65 p-3 transition hover:border-slate-500 sm:grid-cols-[200px,1fr] sm:gap-6 sm:p-4"
      >
        <div className="relative h-52 overflow-hidden rounded-2xl border border-slate-700 bg-black/40 sm:h-64">
          <img
            src={resolveAssetUrl(activeItem.coverImageUrl)}
            alt={activeItem.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>

        <div className="flex min-h-full flex-col justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-white sm:text-3xl">{activeItem.title}</h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {activeItem.categories.slice(0, 3).map((category) => (
                <span
                  key={`${activeItem.id}-${category}`}
                  className="rounded-full border border-slate-600 bg-slate-900/75 px-3 py-1 text-xs text-slate-200"
                >
                  {category}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1">
                <Flame className="h-4 w-4" />
                {activeItem.soldCount > 0
                  ? `${activeItem.soldCount} vendidos`
                  : "Em destaque"}
              </span>
             
            </div>
          </div>

          <p className="mt-5 text-sm font-medium text-cyan-200">
            Toque para abrir os detalhes do jogo
          </p>
        </div>
      </article>

      {items.length > 1 && (
        <div className="relative z-10 mt-4 flex items-center justify-center gap-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition ${
                index === activeIndex
                  ? "w-8 bg-cyan-300"
                  : "w-2.5 bg-slate-600 hover:bg-slate-500"
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 mt-4 flex gap-2 sm:hidden">
        <button
          type="button"
          onClick={goToPrevious}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
        >
          Proximo
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}