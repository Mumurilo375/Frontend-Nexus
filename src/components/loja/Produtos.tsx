import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import api from "../../services/api";
import { useSearchParams } from "react-router-dom";

export default function Produtos() {
  type Game = {
    id: number;
    title: string;
    description: string;
    coverImageUrl?: string;
    price?: number;
  };

  type GamesResponse = {
    items: Game[];
  };

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  const filteredGames = useMemo(() => {
    if (!query) {
      return games;
    }

    return games.filter((game) => game.title.toLowerCase().includes(query));
  }, [games, query]);

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const { data } = await api.get<GamesResponse>("/games", {
          params: { page: 1, limit: 30 },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        setGames(data?.items ?? []);
      } catch {
        setGames([]);
        setError(
          "Nao foi possivel carregar os produtos. Faca login para visualizar a loja.",
        );
      } finally {
        setLoading(false);
      }
    };

    void carregarJogos();
  }, []);

  if (loading) {
    return <p className="px-6 py-4 text-gray-300">Carregando produtos...</p>;
  }

  if (error) {
    return <p className="px-6 py-4 text-red-300">{error}</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 px-6">
      {filteredGames.map((game) => (
        <div
          key={game.id}
          className=" bg-gray-900 rounded-2xl p-6 my-4 flex flex-col items-start gap-4 hover:bg-gray-700 transition-all duration-300 hover:scale-105"
        >
          <button className="bg-black/80 p-3 rounded-full absolute hover:scale-105 z-20 left-4 top-4">
            <Heart />
          </button>

          <img
            src={game.coverImageUrl || "/logo.png"}
            alt={game.title}
            className="w-lg"
          />
          <h2 className="text-2xl font-bold mb-2 text-left">{game.title}</h2>
          <p className="text-gray-300">{game.description}</p>
          <div className="flex gap-4 justtify-between items-center">
            <p className="text-gray-300 text-1.5xl">
              {typeof game.price === "number"
                ? `R$ ${game.price.toFixed(2)}`
                : "Preco indisponivel"}
            </p>
            <button className="bg-blue-900 hover:scale-105 rounded-3xl py-2 px-5">
              Comprar
            </button>
          </div>
        </div>
      ))}
      {games.length === 0 && (
        <p className="text-gray-300">Nenhum produto encontrado.</p>
      )}
      {games.length > 0 && filteredGames.length === 0 && (
        <p className="text-gray-300">Nenhum resultado para sua pesquisa.</p>
      )}
    </div>
  );
}
