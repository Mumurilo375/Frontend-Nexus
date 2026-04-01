import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/globals/Pagination";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
  type PaginationMeta,
} from "../../services/http";

type GameItem = {
  id: number;
  title: string;
  description: string;
  coverImageUrl?: string;
  releaseDate: string;
  isActive?: boolean;
};

const PAGE_SIZE = 6;
const emptyMeta: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

const actionClass =
  "rounded-md px-3 py-2 text-sm font-medium transition";

export default function AdminGames() {
  const [games, setGames] = useState<GameItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadGames = useCallback(async (nextPage = page) => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get<PaginatedResponse<GameItem>>("/games", {
        params: { page: nextPage, limit: PAGE_SIZE },
      });

      setGames(data.items ?? []);
      setMeta(data.meta ?? emptyMeta);
    } catch (requestError) {
      setGames([]);
      setMeta(emptyMeta);
      setError(
        getApiErrorMessage(requestError, "Nao foi possivel carregar os jogos."),
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const handleDelete = async (gameId: number) => {
    const confirmed = window.confirm("Deseja excluir este jogo?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(gameId);
      setError("");
      await api.delete(`/games/${gameId}`);

      if (games.length === 1 && page > 1) {
        setPage((current) => current - 1);
        return;
      }

      await loadGames();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Nao foi possivel excluir o jogo."),
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="Jogos"
      description="CRUD completo de jogos com listagem paginada e acesso direto aos listings."
      backTo="/admin"
      backLabel="Voltar ao painel"
      actions={
        <Link
          to="/admin/games/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Novo jogo
        </Link>
      }
    >
      {loading && <p className="text-gray-300">Carregando jogos...</p>}
      {!loading && error && (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!loading && !error && games.length === 0 && (
        <p className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-gray-300">
          Nenhum jogo cadastrado.
        </p>
      )}

      {!loading && !error && games.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => (
              <article
                key={game.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-4"
              >
                <img
                  src={game.coverImageUrl || "/utils/logo.png"}
                  alt={game.title}
                  className="h-44 w-full rounded-lg object-cover"
                />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{game.title}</h2>
                    <p className="mt-1 text-xs text-gray-400">
                      Lancamento: {game.releaseDate}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      game.isActive === false
                        ? "bg-rose-500/20 text-rose-200"
                        : "bg-emerald-500/20 text-emerald-200"
                    }`}
                  >
                    {game.isActive === false ? "Inativo" : "Ativo"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-300">{game.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/admin/games/${game.id}/edit`}
                    className={`${actionClass} bg-blue-600 text-white hover:bg-blue-500`}
                  >
                    Editar
                  </Link>
                  <Link
                    to={`/admin/games/${game.id}/listings`}
                    className={`${actionClass} bg-emerald-600 text-white hover:bg-emerald-500`}
                  >
                    Listings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDelete(game.id);
                    }}
                    disabled={deletingId === game.id}
                    className={`${actionClass} bg-rose-600 text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {deletingId === game.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </AdminLayout>
  );
}
