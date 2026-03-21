import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import api from "../../services/api";

type GameCategory = {
  id: number;
  name: string;
};

type Game = {
  id: number;
  title: string;
  description: string;
  coverImageUrl: string;
  categories?: GameCategory[];
};

type GamesListResponse = {
  items: Game[];
};

export default function Produtos() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carregarJogos = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get<GamesListResponse>("/games", {
        params: { page: 1, limit: 24 },
      });

      setGames(data?.items ?? []);
    } catch {
      setGames([]);
      setError("Falha ao carregar jogos. Verifique backend, rota /games e CORS.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarJogos();
  }, []);

  if (loading) {
    return <p className="px-6 py-8 text-gray-300">Carregando jogos...</p>;
  }

  if (error) {
    return (
      <div className="px-6 py-8">
        <p className="text-rose-400">{error}</p>
        <button
          type="button"
          onClick={() => void carregarJogos()}
          className="mt-4 rounded-xl bg-blue-900 px-4 py-2 text-white hover:scale-105"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2 xl:grid-cols-3">
      {games.map((game) => (
        <div
          key={game.id}
          className="relative my-4 flex flex-col items-start gap-4 rounded-2xl bg-gray-900 p-6 transition-all duration-300 hover:scale-105 hover:bg-gray-700"
        >
          <button type="button" className="absolute left-4 top-4 z-20 rounded-full bg-black/80 p-3 hover:scale-105">
            <Heart />
          </button>

          <img src={game.coverImageUrl || "/logo.png"} alt={game.title} className="w-full rounded-lg object-cover" />
          <h2 className="mb-2 text-left text-2xl font-bold">{game.title}</h2>
          <p className="text-gray-300">{game.description}</p>

          <div className="flex w-full items-center justify-between gap-4">
            <p className="text-sm text-gray-300">
              {game.categories?.slice(0, 2).map((category) => category.name).join(" • ") || "Sem categoria"}
            </p>
            <button type="button" className="rounded-3xl bg-blue-900 px-5 py-2 hover:scale-105">
              Comprar
            </button>
          </div>
        </div>
      ))}

      {!loading && games.length === 0 && <p className="py-8 text-gray-300">Nenhum jogo encontrado.</p>}
    </div>
  );
}