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

type ListingDetails = {
  id: number;
  price: number | string;
  isActive?: boolean;
  game?: {
    id: number;
    title: string;
  };
  platform?: {
    id: number;
    name: string;
  };
};

type StockSummary = {
  available: number;
  reserved: number;
  sold: number;
  total: number;
};

type ListingStockResponse = {
  listingId: number;
  stock: StockSummary;
};

type GameKeyItem = {
  id: number;
  keyValue: string;
  status: string;
  createdAt?: string;
  soldAt?: string | null;
};

type BulkCreateResponse = {
  createdCount: number;
  skippedCount: number;
  stock: StockSummary;
};

type BulkDeleteResponse = {
  deletedCount: number;
  stock: StockSummary;
};

const PAGE_SIZE = 10;
const emptyMeta: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("pt-BR");
}

export default function AdminListingKeys() {
  const { gameId, listingId } = useParams();
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [stock, setStock] = useState<StockSummary | null>(null);
  const [keys, setKeys] = useState<GameKeyItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [keyText, setKeyText] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(
    async (nextPage: number) => {
      if (!listingId) {
        setError("Listing inválido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [listingResponse, stockResponse, keysResponse] = await Promise.all([
          api.get<ListingDetails>(`/listings/${listingId}`),
          api.get<ListingStockResponse>(`/listings/${listingId}/stock`),
          api.get<PaginatedResponse<GameKeyItem>>("/game-keys", {
            params: { listingId, page: nextPage, limit: PAGE_SIZE },
          }),
        ]);

        setListing(listingResponse.data);
        setStock(stockResponse.data.stock);
        setKeys(keysResponse.data.items ?? []);
        setMeta(keysResponse.data.meta ?? emptyMeta);
        setSelectedIds([]);
      } catch (requestError) {
        setListing(null);
        setStock(null);
        setKeys([]);
        setMeta(emptyMeta);
        setError(
          getApiErrorMessage(
            requestError,
            "Não foi possível carregar as keys deste listing.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [listingId],
  );

  useEffect(() => {
    void loadData(page);
  }, [loadData, page]);

  const handleAddKeys = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!listingId) {
      setError("Listing inválido.");
      return;
    }

    if (!keyText.trim()) {
      setError("Cole pelo menos uma key.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const { data } = await api.post<BulkCreateResponse>("/game-keys/bulk", {
        listingId: Number(listingId),
        keyValues: keyText.split(/\r?\n/),
      });

      setKeyText("");
      setStock(data.stock);
      setMessage(
        data.skippedCount > 0
          ? `${data.createdCount} key(s) adicionada(s) e ${data.skippedCount} ignorada(s).`
          : `${data.createdCount} key(s) adicionada(s).`,
      );

      if (page !== 1) {
        setPage(1);
      } else {
        await loadData(1);
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível adicionar as keys.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelection = (keyId: number) => {
    setSelectedIds((current) =>
      current.includes(keyId)
        ? current.filter((id) => id !== keyId)
        : [...current, keyId],
    );
  };

  const handleRemoveSelected = async () => {
    if (!listingId || selectedIds.length === 0) {
      return;
    }

    const confirmed = window.confirm("Deseja remover as keys selecionadas?");
    if (!confirmed) {
      return;
    }

    try {
      setRemoving(true);
      setError("");
      setMessage("");

      const { data } = await api.post<BulkDeleteResponse>(
        "/game-keys/bulk-delete",
        {
          listingId: Number(listingId),
          ids: selectedIds,
        },
      );

      setStock(data.stock);
      setMessage(`${data.deletedCount} key(s) removida(s).`);

      if (keys.length === selectedIds.length && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadData(page);
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível remover as keys selecionadas.",
        ),
      );
    } finally {
      setRemoving(false);
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
          <Link
            to={`/admin/games/${gameId}/listings/${listingId}/edit`}
            className="rounded-full border border-slate-700 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Editar listing
          </Link>
        ) : null
      }
    >
      {loading && <p className="text-gray-300">Carregando keys...</p>}

      {!loading && error && (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!loading && message && (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}

      {!loading && listing && stock && (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
            <section className="nexus-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {listing.game?.title || "Jogo"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {listing.platform?.name || "Plataforma"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    listing.isActive === false
                      ? "border border-slate-700 bg-slate-900 text-slate-300"
                      : "border border-blue-500/20 bg-blue-500/10 text-blue-100"
                  }`}
                >
                  {listing.isActive === false ? "Inativo" : "Ativo"}
                </span>
              </div>
              <p className="mt-4 text-2xl font-semibold text-blue-100">
                R$ {Number(listing.price ?? 0).toFixed(2)}
              </p>
            </section>

            <section className="nexus-card grid grid-cols-2 gap-3 p-5 text-sm">
              <div>
                <p className="text-slate-500">Disponíveis</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {stock.available}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Reservadas</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {stock.reserved}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Vendidas</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {stock.sold}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Total</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {stock.total}
                </p>
              </div>
            </section>
          </div>

          <form
            onSubmit={handleAddKeys}
            className="nexus-card grid gap-4 p-5"
          >
            <div>
              <label className="text-sm font-medium text-slate-100">
                Adicionar keys
              </label>
              <textarea
                value={keyText}
                onChange={(event) => setKeyText(event.target.value)}
                rows={8}
                placeholder="Cole uma key por linha"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/70"
              />
              <p className="mt-2 text-xs text-slate-400">
                Linhas vazias e keys duplicadas são ignoradas.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Adicionando..." : "Adicionar keys"}
              </button>
            </div>
          </form>

          <section className="nexus-card p-5">
            <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Keys cadastradas
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {meta.total} key(s) neste listing
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void handleRemoveSelected();
                }}
                disabled={removing || selectedIds.length === 0}
                className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removing ? "Removendo..." : "Remover selecionadas"}
              </button>
            </div>

            {keys.length === 0 && (
              <p className="py-6 text-sm text-slate-300">
                Nenhuma key cadastrada para este listing.
              </p>
            )}

            {keys.length > 0 && (
              <div className="mt-4 space-y-3">
                {keys.map((item) => {
                  const canRemove = item.status === "available";
                  const selected = selectedIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:grid-cols-[24px,1fr,120px,120px]"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={!canRemove}
                          onChange={() => toggleSelection(item.id)}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-sm text-slate-100">
                          {item.keyValue}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Criada em {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "sold"
                              ? "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                              : item.status === "reserved"
                                ? "border border-amber-500/30 bg-amber-500/10 text-amber-200"
                                : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {item.status === "sold"
                          ? `Vendida em ${formatDate(item.soldAt)}`
                          : canRemove
                            ? "Disponível para remoção"
                            : "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          </section>
        </>
      )}
    </AdminLayout>
  );
}
