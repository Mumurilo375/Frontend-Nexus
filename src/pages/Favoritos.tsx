import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import api from "../services/api";

type Game = {
  id: number;
  title: string;
  description: string;
  coverImageUrl?: string;
  price?: number;
};

type WishlistItem = {
  id: number;
  gameId: number;
  game?: Game;
};

type WishlistResponse = {
  items: WishlistItem[];
};

function Favoritos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingGameId, setRemovingGameId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate("/login", { state: { from: location.pathname } });
      return;
    }

    const carregarFavoritos = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get<WishlistResponse>("/wishlists");

        setItems(data.items ?? []);
      } catch {
        setItems([]);
        setError("Nao foi possivel carregar seus favoritos.");
      } finally {
        setLoading(false);
      }
    };

    void carregarFavoritos();
  }, [isAuthenticated, location.pathname, navigate]);

  const handleRemoveFavorite = async (gameId: number) => {
    if (!isAuthenticated) {
      void navigate("/login", { state: { from: location.pathname } });
      return;
    }

    try {
      setRemovingGameId(gameId);

      await api.delete(`/wishlists/${gameId}`);

      setItems((current) => current.filter((item) => item.gameId !== gameId));
      window.dispatchEvent(new Event("nexus:counts-updated"));
    } finally {
      setRemovingGameId(null);
    }
  };

  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.1),_transparent_30%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <NavBar />
      <section className="mx-auto min-h-screen w-full max-w-7xl px-6 pb-10 pt-28">
        <div className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.4)]">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200/80">
                Wishlist
              </p>
              <h1 className="mt-2 text-4xl font-bold text-white">
                Meus favoritos
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Guarde os jogos que chamaram sua atencao para comparar preco,
                plataforma e decidir a compra com calma.
              </p>
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
              {items.length} salvos
            </div>
          </div>

          {loading && <p className="mt-6 text-gray-300">Carregando favoritos...</p>}

          {!loading && error && (
            <p className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="mt-6 rounded-[28px] border border-slate-800 bg-slate-900/55 p-6">
              <p className="text-gray-300">
                Voce ainda nao favoritou nenhum jogo.
              </p>
              <button
                type="button"
                onClick={() => {
                  void navigate("/loja");
                }}
                className="mt-4 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Explorar catalogo
              </button>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const game = item.game;
                if (!game) {
                  return null;
                }

                return (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/60 shadow-[0_18px_45px_rgba(2,6,23,0.28)] transition hover:border-blue-500/35 hover:bg-slate-900/80"
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          void handleRemoveFavorite(item.gameId);
                        }}
                        disabled={removingGameId === item.gameId}
                        className="absolute left-4 top-4 z-10 rounded-full border border-slate-700 bg-slate-950/90 p-3 transition hover:border-rose-500/50 disabled:opacity-60"
                        aria-label="Remover dos favoritos"
                      >
                        <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                      </button>

                      <img
                        src={game.coverImageUrl || "/logo.png"}
                        alt={game.title}
                        className="h-60 w-full object-cover"
                      />
                    </div>

                    <div className="space-y-4 p-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {game.title}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {game.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <p className="text-lg font-semibold text-blue-100">
                          {typeof game.price === "number"
                            ? `R$ ${game.price.toFixed(2)}`
                            : "Escolha a plataforma"}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            void navigate(
                              `/loja?q=${encodeURIComponent(game.title)}`,
                            );
                          }}
                          className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                          Ver na loja
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Favoritos;
