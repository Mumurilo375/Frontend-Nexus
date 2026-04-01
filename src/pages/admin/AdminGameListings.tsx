import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/globals/Pagination";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
  type PaginationMeta,
} from "../../services/http";

type GameDetails = {
  id: number;
  title: string;
};

type ListingItem = {
  id: number;
  price: number | string;
  isActive?: boolean;
  platform?: {
    id: number;
    name: string;
  };
};

const PAGE_SIZE = 6;
const emptyMeta: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export default function AdminGameListings() {
  const { gameId } = useParams();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = useCallback(async (nextPage = page) => {
    if (!gameId) {
      setError("Jogo invalido.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [gameResponse, listingsResponse] = await Promise.all([
        api.get<GameDetails>(`/games/${gameId}`),
        api.get<PaginatedResponse<ListingItem>>("/listings", {
          params: { gameId, page: nextPage, limit: PAGE_SIZE },
        }),
      ]);

      setGame(gameResponse.data);
      setListings(listingsResponse.data.items ?? []);
      setMeta(listingsResponse.data.meta ?? emptyMeta);
    } catch (requestError) {
      setGame(null);
      setListings([]);
      setMeta(emptyMeta);
      setError(
        getApiErrorMessage(
          requestError,
          "Nao foi possivel carregar os listings deste jogo.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [gameId, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDelete = async (listingId: number) => {
    const confirmed = window.confirm("Deseja excluir este listing?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(listingId);
      setError("");
      await api.delete(`/listings/${listingId}`);

      if (listings.length === 1 && page > 1) {
        setPage((current) => current - 1);
        return;
      }

      await loadData();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Nao foi possivel excluir o listing.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title={game ? `Listings de ${game.title}` : "Listings do jogo"}
      description="Cada listing representa a combinacao de jogo, plataforma e preco."
      backTo="/admin/games"
      backLabel="Voltar para jogos"
      actions={
        gameId ? (
          <Link
            to={`/admin/games/${gameId}/listings/new`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Novo listing
          </Link>
        ) : null
      }
    >
      {loading && <p className="text-gray-300">Carregando listings...</p>}
      {!loading && error && (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!loading && !error && listings.length === 0 && (
        <p className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-gray-300">
          Nenhum listing cadastrado para este jogo.
        </p>
      )}

      {!loading && !error && listings.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {listing.platform?.name || "Plataforma"}
                    </h2>
                    <p className="mt-1 text-sm text-blue-200">
                      R$ {Number(listing.price ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      listing.isActive === false
                        ? "bg-rose-500/20 text-rose-200"
                        : "bg-emerald-500/20 text-emerald-200"
                    }`}
                  >
                    {listing.isActive === false ? "Inativo" : "Ativo"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/admin/games/${gameId}/listings/${listing.id}/edit`}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDelete(listing.id);
                    }}
                    disabled={deletingId === listing.id}
                    className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === listing.id ? "Excluindo..." : "Excluir"}
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
