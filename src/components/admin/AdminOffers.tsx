import { useEffect, useState } from "react";
import Pagination from "../globals/Pagination";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
  type PaginationMeta,
} from "../../services/http";
import AdminLayout from "./AdminLayout";
import {
  AdminButton,
  AdminNotice,
  AdminPageState,
  AdminToggleField,
  adminFieldClass,
} from "./adminShared";
import {
  createEmptyOfferFormState,
  type AdminOfferFormState,
  type AdminOfferItem,
  type AdminOfferListingOption,
} from "./adminOffers.types";

const PROMOTIONS_PAGE_SIZE = 12;
const LISTINGS_PAGE_SIZE = 100;
const emptyMeta: PaginationMeta = {
  page: 1,
  limit: PROMOTIONS_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

function normalizeDateInput(value?: string) {
  return value ? String(value).slice(0, 10) : "";
}

function normalizeDiscountInput(value: string) {
  if (!value) return "";
  return String(Math.min(100, Math.max(1, Number(value) || 0)));
}

function buildListingLabel(listing: {
  game?: { title?: string | null } | null;
  platform?: { name?: string | null } | null;
}) {
  return `${listing.game?.title || "Jogo"} · ${listing.platform?.name || "Plataforma"}`;
}

function mergeListingIds(currentIds: number[], nextIds: number[]) {
  return Array.from(new Set([...currentIds, ...nextIds]));
}

function buildPlatformOptions(listings: AdminOfferListingOption[]) {
  const platformMap = new Map<number, { id: number; name: string }>();

  listings.forEach((listing) => {
    const platformId = Number(listing.platform?.id ?? 0);
    if (!platformId || platformMap.has(platformId)) return;

    platformMap.set(platformId, {
      id: platformId,
      name: listing.platform?.name || "Plataforma",
    });
  });

  return Array.from(platformMap.values());
}

export default function AdminOffers() {
  const [promotions, setPromotions] = useState<AdminOfferItem[]>([]);
  const [promotionsMeta, setPromotionsMeta] = useState<PaginationMeta>(emptyMeta);
  const [promotionPage, setPromotionPage] = useState(1);
  const [listingOptions, setListingOptions] = useState<AdminOfferListingOption[]>([]);
  const [formState, setFormState] = useState<AdminOfferFormState>(createEmptyOfferFormState);
  const [selectedListingIds, setSelectedListingIds] = useState<number[]>([]);
  const [initialListingIds, setInitialListingIds] = useState<number[]>([]);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPromotionId, setDeletingPromotionId] = useState<number | null>(null);
  const [isListingPickerOpen, setIsListingPickerOpen] = useState(false);

  const loadData = async (page = promotionPage) => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [promotionsResponse, listingsResponse] = await Promise.all([
        api.get<PaginatedResponse<AdminOfferItem>>("/promotions", {
          params: { page, limit: PROMOTIONS_PAGE_SIZE },
        }),
        api.get<PaginatedResponse<AdminOfferListingOption>>("/listings", {
          params: { page: 1, limit: LISTINGS_PAGE_SIZE },
        }),
      ]);

      setPromotions(promotionsResponse.data.items ?? []);
      setPromotionsMeta(promotionsResponse.data.meta ?? emptyMeta);
      setListingOptions(listingsResponse.data.items ?? []);
    } catch (error) {
      setPromotions([]);
      setPromotionsMeta(emptyMeta);
      setListingOptions([]);
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível carregar as ofertas."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData(promotionPage);
  }, [promotionPage]);

  const platformOptions = buildPlatformOptions(listingOptions);
  const selectedListings = listingOptions.filter((listing) =>
    selectedListingIds.includes(listing.id),
  );

  const resetForm = (clearFeedback = true) => {
    setFormState(createEmptyOfferFormState());
    setSelectedListingIds([]);
    setInitialListingIds([]);
    setEditingPromotionId(null);
    setIsListingPickerOpen(false);
    if (clearFeedback) {
      setSubmitError("");
      setSubmitMessage("");
    }
  };

  const handleEditPromotion = (promotion: AdminOfferItem) => {
    setEditingPromotionId(promotion.id);
    setInitialListingIds(promotion.listingIds);
    setSelectedListingIds(promotion.listingIds);
    setSubmitError("");
    setSubmitMessage("");
    setIsListingPickerOpen(false);
    setFormState({
      name: promotion.name || "",
      description: promotion.description || "",
      discountPercentage: String(promotion.discountPercentage ?? ""),
      startDate: normalizeDateInput(promotion.startDate),
      endDate: normalizeDateInput(promotion.endDate),
      isActive: Boolean(promotion.isActive),
      platformId: "",
    });
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleAddPlatformListings = () => {
    const platformId = Number(formState.platformId);
    if (!platformId) return;

    const platformListingIds = listingOptions
      .filter((listing) => Number(listing.platform?.id ?? 0) === platformId)
      .map((listing) => listing.id);

    setSelectedListingIds((currentIds) =>
      mergeListingIds(currentIds, platformListingIds),
    );
    setFormState((currentState) => ({ ...currentState, platformId: "" }));
  };

  const handleDeletePromotion = async (promotionId: number) => {
    try {
      setDeletingPromotionId(promotionId);
      setSubmitError("");
      setSubmitMessage("");
      await api.delete(`/promotions/${promotionId}`);
      if (editingPromotionId === promotionId) {
        resetForm(false);
      }
      setSubmitMessage("Oferta removida com sucesso.");
      await loadData(promotionPage);
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Não foi possível remover a oferta."),
      );
    } finally {
      setDeletingPromotionId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedListingIds.length === 0) {
      setSubmitError("Selecione pelo menos um listing para a oferta.");
      return;
    }

    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || null,
      discountPercentage: Number(formState.discountPercentage),
      startDate: formState.startDate,
      endDate: formState.endDate,
      isActive: formState.isActive,
    };
    const nextListingIds = Array.from(new Set(selectedListingIds));
    const currentEditingPromotionId = editingPromotionId;

    try {
      setIsSaving(true);
      setSubmitError("");
      setSubmitMessage("");

      if (currentEditingPromotionId !== null) {
        await api.put(`/promotions/${currentEditingPromotionId}`, payload);

        const listingIdsToAdd = nextListingIds.filter(
          (listingId) => !initialListingIds.includes(listingId),
        );
        const listingIdsToRemove = initialListingIds.filter(
          (listingId) => !nextListingIds.includes(listingId),
        );

        await Promise.all([
          ...listingIdsToAdd.map((listingId) =>
            api.post(`/promotions/${currentEditingPromotionId}/listings/${listingId}`),
          ),
          ...listingIdsToRemove.map((listingId) =>
            api.delete(`/promotions/${currentEditingPromotionId}/listings/${listingId}`),
          ),
        ]);

        setSubmitMessage("Oferta atualizada com sucesso.");
      } else {
        const { data } = await api.post<{ id: number }>("/promotions", payload);

        await Promise.all(
          nextListingIds.map((listingId) =>
            api.post(`/promotions/${data.id}/listings/${listingId}`),
          ),
        );

        setSubmitMessage("Oferta criada com sucesso.");
      }

      resetForm(false);
      await loadData(currentEditingPromotionId !== null ? promotionPage : 1);
      if (currentEditingPromotionId === null) {
        setPromotionPage(1);
      }
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Não foi possível salvar a oferta."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Ofertas"
      description="Cadastre promoções simples com vários listings e gerencie tudo em um só lugar."
      actions={
        editingPromotionId !== null ? (
          <AdminButton type="button" tone="secondary" onClick={() => resetForm()}>
            Nova oferta
          </AdminButton>
        ) : undefined
      }
    >
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-slate-800 bg-slate-950/78 p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-200 md:col-span-2">
              Nome da oferta
              <input
                value={formState.name}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    name: event.target.value,
                  }))
                }
                className={adminFieldClass}
                required
              />
            </label>

            <label className="text-sm text-slate-200 md:col-span-2">
              Descrição
              <textarea
                value={formState.description}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    description: event.target.value,
                  }))
                }
                className={`${adminFieldClass} min-h-28`}
              />
            </label>

            <label className="text-sm text-slate-200">
              Desconto (%)
              <input
                type="number"
                min="1"
                max="100"
                value={formState.discountPercentage}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    discountPercentage: normalizeDiscountInput(event.target.value),
                  }))
                }
                className={`${adminFieldClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                required
              />
            </label>

            <div className="self-end">
              <AdminToggleField
                label="Oferta ativa"
                checked={formState.isActive}
                onChange={(isActive) =>
                  setFormState((currentState) => ({ ...currentState, isActive }))
                }
              />
            </div>

            <label className="text-sm text-slate-200">
              Data inicial
              <input
                type="date"
                value={formState.startDate}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    startDate: event.target.value,
                  }))
                }
                className={adminFieldClass}
                required
              />
            </label>

            <label className="text-sm text-slate-200">
              Data final
              <input
                type="date"
                value={formState.endDate}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    endDate: event.target.value,
                  }))
                }
                className={adminFieldClass}
                required
              />
            </label>

            <label className="text-sm text-slate-200">
              Plataforma
              <select
                value={formState.platformId}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    platformId: event.target.value,
                  }))
                }
                className={adminFieldClass}
              >
                <option value="">Selecione uma plataforma</option>
                {platformOptions.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="self-end">
              <AdminButton
                type="button"
                tone="secondary"
                onClick={handleAddPlatformListings}
              >
                Adicionar plataforma
              </AdminButton>
            </div>

            <section className="rounded-[28px] border border-slate-800 bg-slate-950/82 p-5 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Listings da oferta</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selectedListingIds.length === 0
                      ? "Nenhum listing selecionado."
                      : `${selectedListingIds.length} listing(s) selecionado(s).`}
                  </p>
                </div>

                <AdminButton
                  type="button"
                  tone="secondary"
                  onClick={() => setIsListingPickerOpen((currentState) => !currentState)}
                >
                  {isListingPickerOpen ? "Ocultar listings" : "Escolher listings"}
                </AdminButton>
              </div>

              {isListingPickerOpen && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {listingOptions.map((listing) => {
                    const selected = selectedListingIds.includes(listing.id);

                    return (
                      <button
                        key={listing.id}
                        type="button"
                        onClick={() =>
                          setSelectedListingIds((currentIds) =>
                            currentIds.includes(listing.id)
                              ? currentIds.filter((listingId) => listingId !== listing.id)
                              : [...currentIds, listing.id],
                          )
                        }
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? "border-blue-400/50 bg-blue-500/15 text-blue-100"
                            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white"
                        }`}
                      >
                        {buildListingLabel(listing)}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">Listings selecionados</p>
                <p className="text-sm text-slate-400">{selectedListingIds.length}</p>
              </div>

              {selectedListings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  Nenhum listing selecionado.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedListings.map((listing) => (
                    <button
                      key={listing.id}
                      type="button"
                      onClick={() =>
                        setSelectedListingIds((currentIds) =>
                          currentIds.filter((listingId) => listingId !== listing.id),
                        )
                      }
                      className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200 transition hover:border-rose-500/40 hover:text-white"
                    >
                      {buildListingLabel(listing)} · Remover
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {submitError && <AdminNotice>{submitError}</AdminNotice>}
          {submitMessage && <AdminNotice tone="success">{submitMessage}</AdminNotice>}

          <div className="mt-5 flex flex-wrap gap-3">
            <AdminButton type="submit" disabled={isSaving}>
              {isSaving
                ? "Salvando..."
                : editingPromotionId !== null
                  ? "Salvar alterações"
                  : "Criar oferta"}
            </AdminButton>
            <AdminButton type="button" tone="secondary" onClick={() => resetForm()}>
              Limpar formulário
            </AdminButton>
          </div>
        </form>

        <div className="rounded-[28px] border border-slate-800 bg-slate-950/78 p-6">
          <h2 className="text-xl font-semibold text-white">Resumo rápido</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Cada promoção pode ter vários listings. Você pode selecionar jogos
            manualmente ou adicionar todos os listings atuais de uma plataforma.
          </p>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Ofertas carregadas
              </p>
              <p className="mt-2 text-2xl font-semibold text-blue-100">
                {promotionsMeta.total}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Listings disponíveis
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {listingOptions.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Listings selecionados
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {selectedListingIds.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AdminPageState
        loading={isLoading}
        error={errorMessage}
        isEmpty={promotions.length === 0}
        loadingText="Carregando ofertas..."
        emptyText="Nenhuma oferta cadastrada."
      >
        <section className="space-y-4">
          {promotions.map((promotion) => (
            <article
              key={promotion.id}
              className="rounded-[24px] border border-slate-800 bg-slate-950/82 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-white">{promotion.name}</h2>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      -{promotion.discountPercentage}%
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                      {promotion.isActive ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300">
                    {promotion.description || "Sem descrição."}
                  </p>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                    <span>De {normalizeDateInput(promotion.startDate)}</span>
                    <span>até {normalizeDateInput(promotion.endDate)}</span>
                    <span>{promotion.listings.length} listing(s) vinculados</span>
                  </div>

                  {promotion.listings.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {promotion.listings.slice(0, 5).map((listing) => (
                        <span
                          key={listing.id}
                          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
                        >
                          {buildListingLabel(listing)}
                        </span>
                      ))}
                      {promotion.listings.length > 5 && (
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                          +{promotion.listings.length - 5} listing(s)
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Nenhum listing vinculado.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <AdminButton
                    type="button"
                    tone="secondary"
                    onClick={() => handleEditPromotion(promotion)}
                  >
                    Editar
                  </AdminButton>
                  <AdminButton
                    type="button"
                    tone="subtleDanger"
                    disabled={deletingPromotionId === promotion.id}
                    onClick={() => {
                      void handleDeletePromotion(promotion.id);
                    }}
                  >
                    {deletingPromotionId === promotion.id ? "Removendo..." : "Excluir"}
                  </AdminButton>
                </div>
              </div>
            </article>
          ))}

          <Pagination
            page={promotionsMeta.page}
            totalPages={promotionsMeta.totalPages}
            onPageChange={setPromotionPage}
          />
        </section>
      </AdminPageState>
    </AdminLayout>
  );
}
