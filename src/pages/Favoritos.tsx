import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingGameId, setRemovingGameId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    const carregarFavoritos = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get<WishlistResponse>("/wishlists", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setItems(data.items ?? []);
      } catch {
        setItems([]);
        setError("Nao foi possivel carregar seus favoritos.");
      } finally {
        setLoading(false);
      }
    };

    void carregarFavoritos();
  }, [location.pathname, navigate]);

  const handleRemoveFavorite = async (gameId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    try {
      setRemovingGameId(gameId);

      await api.delete(`/wishlists/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setItems((current) => current.filter((item) => item.gameId !== gameId));
    } finally {
      setRemovingGameId(null);
    }
  };

  return (
    <div>
      <NavBar />
      <section className="mx-auto min-h-screen w-full max-w-7xl px-6 pb-10 pt-28">
        <h1 className="mb-2 text-4xl font-bold">Meus Favoritos</h1>

        {loading && <p className="text-gray-300">Carregando favoritos...</p>}

        {!loading && error && <p className="text-red-300">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="text-gray-300">Voce ainda nao favoritou nenhum jogo.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const game = item.game;
              if (!game) {
                return null;
              }

              return (
                <div
                  key={item.id}
                  className="relative my-2 flex flex-col items-start gap-4 rounded-2xl bg-gray-900 p-6"
                >
                  <button
                    type="button"
                    onClick={() => {
                      void handleRemoveFavorite(item.gameId);
                    }}
                    disabled={removingGameId === item.gameId}
                    className="absolute left-4 top-4 rounded-full bg-black/80 p-3 hover:scale-105 disabled:opacity-60"
                    aria-label="Remover dos favoritos"
                  >
                    <Heart className="fill-red-500 text-red-500" />
                  </button>

                  <img
                    src={game.coverImageUrl || "/logo.png"}
                    alt={game.title}
                    className="w-lg"
                  />

                  <h2 className="text-left text-2xl font-bold">{game.title}</h2>
                  <p className="text-gray-300">{game.description}</p>

                  <div className="flex items-center gap-4">
                    <p className="text-blue-200 text-1.5xl">
                      {typeof game.price === "number"
                        ? `R$ ${game.price.toFixed(2)}`
                        : "Escolha a plataforma"}
                    </p>
                    <button className="rounded-3xl bg-blue-900 px-5 py-2 hover:scale-105">
                      Comprar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}

export default Favoritos;
