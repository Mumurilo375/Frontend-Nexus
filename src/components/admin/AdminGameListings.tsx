import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  AdminButton,
  AdminLinkButton,
  AdminPageState,
  AdminStatusBadge,
  createEmptyMeta,
  formatMoney,
} from "./adminShared";
import Pagination from "../../components/globals/Pagination";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
} from "../../services/http";

type GameResponse = { title: string };
type Listing = { id: number; price: number | string; isActive?: boolean; platform?: { name: string } };

const PAGE_SIZE = 6;
const emptyPagination = createEmptyMeta(PAGE_SIZE);

export default function AdminGameListings() {
  const { gameId } = useParams();
  const [game, setGame] = useState<GameResponse | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stockByListingId, setStockByListingId] = useState<Record<number, number>>({});
  const [pagination, setPagination] = useState(emptyPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingListingId, setDeletingListingId] = useState<number | null>(null);

  const fetchListingsPage = useCallback(async (page = currentPage) => {
    if (!gameId) return setErrorMessage("Jogo inválido."), setIsLoading(false);

    try {
      setIsLoading(true);
      setErrorMessage("");

      const [gameResponse, listingsResponse] = await Promise.all([
        api.get<GameResponse>(`/games/${gameId}`),
        api.get<PaginatedResponse<Listing>>("/listings", {
          params: { gameId, page, limit: PAGE_SIZE },
        }),
      ]);
      const listings = listingsResponse.data.items ?? [];
      const stockEntries = await Promise.all(
        listings.map(async ({ id }) => {
          try {
            const { data } = await api.get<{ stock?: { available?: number } }>(
              `/listings/${id}/stock`,
            );

            return [id, Number(data.stock?.available ?? 0)] as const;
          } catch {
            return [id, 0] as const;
          }
        }),
      );

      setGame(gameResponse.data);
      setListings(listings);
      setStockByListingId(Object.fromEntries(stockEntries));
      setPagination(listingsResponse.data.meta ?? emptyPagination);
    } catch (error) {
      setGame(null);
      setListings([]);
      setStockByListingId({});
      setPagination(emptyPagination);
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível carregar os listings deste jogo."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, gameId]);

  useEffect(() => {
    void fetchListingsPage();
  }, [fetchListingsPage]);

  const removeListing = async (listingId: number) => {
    if (!window.confirm("Deseja excluir este listing?")) return;

    try {
      setDeletingListingId(listingId);
      setErrorMessage("");
      await api.delete(`/listings/${listingId}`);

      if (listings.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
        return;
      }

      await fetchListingsPage();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível excluir o listing."),
      );
    } finally {
      setDeletingListingId(null);
    }
  };

  return (
    <AdminLayout
      title={game ? `Listings de ${game.title}` : "Listings do jogo"}
      description="Cada listing representa a combinação de jogo, plataforma e preço."
      backTo="/admin/games"
      backLabel="Voltar para jogos"
      actions={
        gameId ? (
          <AdminLinkButton to={`/admin/games/${gameId}/listings/new`} tone="primary">
            Novo listing
          </AdminLinkButton>
        ) : null
      }
    >
      <AdminPageState
        loading={isLoading}
        error={errorMessage}
        isEmpty={listings.length === 0}
        loadingText="Carregando listings..."
        emptyText="Nenhum listing cadastrado para este jogo."
        emptyClassName="rounded-xl border border-gray-800 bg-gray-900 p-5 text-gray-300"
      >
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="rounded-[28px] border border-slate-800 bg-slate-950/78 p-5 shadow-[0_18px_45px_rgba(2,6,23,0.28)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {listing.platform?.name || "Plataforma"}
                    </h2>
                    <p className="mt-2 text-2xl font-semibold text-blue-100">
                      {formatMoney(listing.price)}
                    </p>
                  </div>
                  <AdminStatusBadge active={listing.isActive} />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Estoque disponível: {stockByListingId[listing.id] ?? 0} key(s).
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <AdminLinkButton to={`/admin/games/${gameId}/listings/${listing.id}/edit`} tone="primary">Editar</AdminLinkButton>
                  <AdminLinkButton to={`/admin/games/${gameId}/listings/${listing.id}/keys`}>Gerenciar keys</AdminLinkButton>
                  <AdminButton
                    type="button"
                    tone="danger"
                    disabled={deletingListingId === listing.id}
                    onClick={() => { void removeListing(listing.id); }}
                  >
                    {deletingListingId === listing.id ? "Excluindo..." : "Excluir"}
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
