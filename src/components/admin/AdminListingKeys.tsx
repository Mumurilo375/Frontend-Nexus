import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  AdminButton,
  AdminLinkButton,
  AdminNotice,
  AdminPageState,
  AdminStatusBadge,
  AdminTextareaField,
  createEmptyMeta,
  formatDate,
  formatMoney,
  getKeyStatusBadgeClass,
} from "./adminShared";
import Pagination from "../../components/globals/Pagination";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
} from "../../services/http";

type ListingResponse = { price: number | string; isActive?: boolean; game?: { title: string }; platform?: { name: string } };
type StockSummary = { available: number; reserved: number; sold: number; total: number };
type StockResponse = { stock: StockSummary };
type GameKey = { id: number; keyValue: string; status: string; createdAt?: string; soldAt?: string | null };
type AddKeysResponse = { createdCount: number; skippedCount: number; stock: StockSummary };
type RemoveKeysResponse = { deletedCount: number; stock: StockSummary };

const PAGE_SIZE = 10;
const emptyPagination = createEmptyMeta(PAGE_SIZE);
const stockCards = [
  ["available", "Disponíveis"],
  ["reserved", "Reservadas"],
  ["sold", "Vendidas"],
  ["total", "Total"],
] as const;

export default function AdminListingKeys() {
  const { gameId, listingId } = useParams();
  const [listingDetails, setListingDetails] = useState<ListingResponse | null>(null);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [gameKeys, setGameKeys] = useState<GameKey[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [newKeysText, setNewKeysText] = useState("");
  const [selectedKeyIds, setSelectedKeyIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingKeys, setIsAddingKeys] = useState(false);
  const [isRemovingKeys, setIsRemovingKeys] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchKeysPage = useCallback(async (page: number) => {
    if (!listingId) return setErrorMessage("Listing inválido."), setIsLoading(false);

    try {
      setIsLoading(true);
      setErrorMessage("");

      const [listingResponse, stockResponse, keysResponse] = await Promise.all([
        api.get<ListingResponse>(`/listings/${listingId}`),
        api.get<StockResponse>(`/listings/${listingId}/stock`),
        api.get<PaginatedResponse<GameKey>>("/game-keys", {
          params: { listingId, page, limit: PAGE_SIZE },
        }),
      ]);

      setListingDetails(listingResponse.data);
      setStockSummary(stockResponse.data.stock);
      setGameKeys(keysResponse.data.items ?? []);
      setPagination(keysResponse.data.meta ?? emptyPagination);
      setSelectedKeyIds([]);
    } catch (error) {
      setListingDetails(null);
      setStockSummary(null);
      setGameKeys([]);
      setPagination(emptyPagination);
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível carregar as keys deste listing."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void fetchKeysPage(currentPage);
  }, [currentPage, fetchKeysPage]);

  const toggleSelectedKey = (keyId: number) =>
    setSelectedKeyIds((current) =>
      current.includes(keyId) ? current.filter((id) => id !== keyId) : [...current, keyId],
    );

  const addKeys = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!listingId) return void setErrorMessage("Listing inválido.");
    if (!newKeysText.trim()) return void setErrorMessage("Cole pelo menos uma key.");

    try {
      setIsAddingKeys(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data } = await api.post<AddKeysResponse>("/game-keys/bulk", {
        listingId: Number(listingId),
        keyValues: newKeysText.split(/\r?\n/),
      });

      setNewKeysText("");
      setStockSummary(data.stock);
      setSuccessMessage(
        data.skippedCount
          ? `${data.createdCount} key(s) adicionada(s) e ${data.skippedCount} ignorada(s).`
          : `${data.createdCount} key(s) adicionada(s).`,
      );

      if (currentPage === 1) {
        await fetchKeysPage(1);
      } else {
        setCurrentPage(1);
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível adicionar as keys."),
      );
    } finally {
      setIsAddingKeys(false);
    }
  };

  const removeSelectedKeys = async () => {
    if (!listingId || selectedKeyIds.length === 0) return;
    if (!window.confirm("Deseja remover as keys selecionadas?")) return;

    try {
      setIsRemovingKeys(true);
      setErrorMessage("");
      setSuccessMessage("");

      const { data } = await api.post<RemoveKeysResponse>("/game-keys/bulk-delete", {
        listingId: Number(listingId),
        ids: selectedKeyIds,
      });

      setStockSummary(data.stock);
      setSuccessMessage(`${data.deletedCount} key(s) removida(s).`);

      if (gameKeys.length === selectedKeyIds.length && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        await fetchKeysPage(currentPage);
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível remover as keys selecionadas."),
      );
    } finally {
      setIsRemovingKeys(false);
    }
  };

  return (
    <AdminLayout
      title="Keys do listing"
      description="Cole as keys reais deste listing para abastecer o estoque."
      backTo={gameId ? `/admin/games/${gameId}/listings` : "/admin/games"}
      backLabel="Voltar para listings"
      actions={
        gameId && listingId ? (
          <AdminLinkButton to={`/admin/games/${gameId}/listings/${listingId}/edit`}>
            Editar listing
          </AdminLinkButton>
        ) : null
      }
    >
      <AdminPageState
        loading={isLoading}
        error={errorMessage}
        isEmpty={!listingDetails || !stockSummary}
        loadingText="Carregando keys..."
        emptyText="Listing não encontrado."
      >
        <>
          {successMessage && <AdminNotice tone="success">{successMessage}</AdminNotice>}

          <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
            <section className="nexus-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {listingDetails?.game?.title || "Jogo"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {listingDetails?.platform?.name || "Plataforma"}
                  </p>
                </div>
                <AdminStatusBadge active={listingDetails?.isActive} />
              </div>
              <p className="mt-4 text-2xl font-semibold text-blue-100">
                {formatMoney(listingDetails?.price)}
              </p>
            </section>

            <section className="nexus-card grid grid-cols-2 gap-3 p-5 text-sm">
              {stockCards.map(([key, label]) => (
                <div key={key}>
                  <p className="text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {stockSummary?.[key] ?? 0}
                  </p>
                </div>
              ))}
            </section>
          </div>

          <form onSubmit={addKeys} className="nexus-card grid gap-4 p-5">
            <AdminTextareaField label="Adicionar keys" value={newKeysText} onChange={({ target }) => setNewKeysText(target.value)} rows={8} placeholder="Cole uma key por linha" className="text-sm" note="Linhas vazias e keys duplicadas são ignoradas." />
            <div className="flex justify-end">
              <AdminButton type="submit" disabled={isAddingKeys}>{isAddingKeys ? "Adicionando..." : "Adicionar keys"}</AdminButton>
            </div>
          </form>

          <section className="nexus-card p-5">
            <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Keys cadastradas</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {pagination.total} key(s) neste listing
                </p>
              </div>
              <AdminButton type="button" tone="subtleDanger" disabled={isRemovingKeys || selectedKeyIds.length === 0} onClick={() => {
                void removeSelectedKeys();
              }}>
                {isRemovingKeys ? "Removendo..." : "Remover selecionadas"}
              </AdminButton>
            </div>

            {gameKeys.length === 0 ? (
              <p className="py-6 text-sm text-slate-300">
                Nenhuma key cadastrada para este listing.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {gameKeys.map((gameKey) => {
                  const canRemove = gameKey.status === "available";
                  const statusText =
                    gameKey.status === "sold"
                      ? `Vendida em ${formatDate(gameKey.soldAt)}`
                      : canRemove
                        ? "Disponível para remoção"
                        : "-";

                  return (
                    <div
                      key={gameKey.id}
                      className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:grid-cols-[24px,1fr,120px,120px]"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedKeyIds.includes(gameKey.id)}
                          disabled={!canRemove}
                          onChange={() => toggleSelectedKey(gameKey.id)}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-sm text-slate-100">
                          {gameKey.keyValue}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Criada em {formatDate(gameKey.createdAt)}
                        </p>
                      </div>
                      <div><span className={getKeyStatusBadgeClass(gameKey.status)}>{gameKey.status}</span></div>
                      <div className="text-sm text-slate-400">{statusText}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </section>
        </>
      </AdminPageState>
    </AdminLayout>
  );
}
