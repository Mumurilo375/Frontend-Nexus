import { Search } from "lucide-react";
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

const PAGE_SIZE = 9;
const emptyMeta: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

const actionClass =
  "inline-flex flex-1 items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition";

function formatReleaseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return "-";
  }

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    "pt-BR",
    { timeZone: "UTC" },
  );
}

export default function AdminGames() {
  const [games, setGames] = useState<GameItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadGames = useCallback(async (nextPage = page) => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get<PaginatedResponse<GameItem>>("/games", {
        params: {
          page: nextPage,
          limit: PAGE_SIZE,
          q: searchTerm.trim() || undefined,
        },
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
  }, [page, searchTerm]);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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
          className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Novo jogo
        </Link>
      }
    >
      <div className="nexus-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="block text-sm font-medium text-gray-200">
            Buscar jogo
          </label>
          <span className="text-sm text-slate-400">
            {meta.total} resultado{meta.total === 1 ? "" : "s"}
          </span>
        </div>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Pesquisar por titulo..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-slate-500"
          />
        </div>
      </div>

      {loading && <p className="text-gray-300">Carregando jogos...</p>}
      {!loading && error && (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!loading && !error && games.length === 0 && (
        <p className="nexus-card p-5 text-gray-300">
          {searchTerm.trim()
            ? "Nenhum jogo encontrado para essa busca."
            : "Nenhum jogo cadastrado."}
        </p>
      )}

      {!loading && !error && games.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => (
              <article
                key={game.id}
                className="nexus-card flex flex-col overflow-hidden p-4"
              >
                <img
                  src={game.coverImageUrl || "/utils/logo.png"}
                  alt={game.title}
                  className="h-48 w-full rounded-[22px] border border-slate-800 object-cover"
                />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{game.title}</h2>
                    <p className="mt-1 text-xs text-gray-400">
                      Lancamento: {formatReleaseDate(game.releaseDate)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      game.isActive === false
                        ? "border border-slate-700 bg-slate-900 text-slate-300"
                        : "border border-blue-500/20 bg-blue-500/10 text-blue-100"
                    }`}
                  >
                    {game.isActive === false ? "Inativo" : "Ativo"}
                  </span>
                </div>
                <p className="mt-3 min-h-16 text-sm leading-6 text-gray-300">
                  {game.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 pt-2">
                  <Link
                    to={`/admin/games/${game.id}/edit`}
                    className={`${actionClass} border border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500 hover:text-white`}
                  >
                    Editar
                  </Link>
                  <Link
                    to={`/admin/games/${game.id}/listings`}
                    className={`${actionClass} border border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white`}
                  >
                    Gerenciar listings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDelete(game.id);
                    }}
                    disabled={deletingId === game.id}
                    className={`${actionClass} border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60`}
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
