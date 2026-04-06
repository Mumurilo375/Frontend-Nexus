import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  AdminButton,
  AdminLinkButton,
  AdminPageState,
  AdminStatusBadge,
  createEmptyMeta,
  formatReleaseDate,
} from "./adminShared";
import Pagination from "../../components/globals/Pagination";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
} from "../../services/http";

type Game = { id: number; title: string; description: string; coverImageUrl?: string; releaseDate: string; isActive?: boolean };

const PAGE_SIZE = 9;
const emptyPagination = createEmptyMeta(PAGE_SIZE);
const cardActionClass = "inline-flex flex-1 items-center justify-center";

export default function AdminGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingGameId, setDeletingGameId] = useState<number | null>(null);

  const fetchGamesPage = useCallback(async (page = currentPage) => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const { data } = await api.get<PaginatedResponse<Game>>("/games", {
        params: {
          page,
          limit: PAGE_SIZE,
          q: searchQuery.trim() || undefined,
        },
      });

      setGames(data.items ?? []);
      setPagination(data.meta ?? emptyPagination);
    } catch (error) {
      setGames([]);
      setPagination(emptyPagination);
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível carregar os jogos."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    void fetchGamesPage();
  }, [fetchGamesPage]);

  const removeGame = async (gameId: number) => {
    if (!window.confirm("Deseja excluir este jogo?")) return;

    try {
      setDeletingGameId(gameId);
      setErrorMessage("");
      await api.delete(`/games/${gameId}`);

      if (games.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
        return;
      }

      await fetchGamesPage();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível excluir o jogo."),
      );
    } finally {
      setDeletingGameId(null);
    }
  };

  const emptyText = searchQuery.trim()
    ? "Nenhum jogo encontrado para essa busca."
    : "Nenhum jogo cadastrado.";

  return (
    <AdminLayout
      title="Jogos"
      description="CRUD completo de jogos com listagem paginada e acesso direto aos listings."
      backTo="/admin"
      backLabel="Voltar ao painel"
      actions={
        <AdminLinkButton to="/admin/games/new" tone="primary">
          Novo jogo
        </AdminLinkButton>
      }
    >
      <div className="nexus-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="block text-sm font-medium text-gray-200">
            Buscar jogo
          </label>
          <span className="text-sm text-slate-400">
            {pagination.total} resultado{pagination.total === 1 ? "" : "s"}
          </span>
        </div>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={({ target }) => (setSearchQuery(target.value), setCurrentPage(1))}
            placeholder="Pesquisar por título..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-slate-500"
          />
        </div>
      </div>

      <AdminPageState
        loading={isLoading}
        error={errorMessage}
        isEmpty={games.length === 0}
        loadingText="Carregando jogos..."
        emptyText={emptyText}
      >
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
                      Lançamento: {formatReleaseDate(game.releaseDate)}
                    </p>
                  </div>
                  <AdminStatusBadge active={game.isActive} />
                </div>
                <p className="mt-3 min-h-16 text-sm leading-6 text-gray-300">
                  {game.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 pt-2">
                  <AdminLinkButton to={`/admin/games/${game.id}/edit`} className={cardActionClass}>Editar</AdminLinkButton>
                  <AdminLinkButton to={`/admin/games/${game.id}/listings`} className={cardActionClass}>Gerenciar listings</AdminLinkButton>
                  <AdminButton
                    type="button"
                    tone="subtleDanger"
                    className={cardActionClass}
                    disabled={deletingGameId === game.id}
                    onClick={() => { void removeGame(game.id); }}
                  >
                    {deletingGameId === game.id ? "Excluindo..." : "Excluir"}
                  </AdminButton>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      </AdminPageState>
    </AdminLayout>
  );
}
