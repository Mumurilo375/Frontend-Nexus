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
  formatMoney,
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

function buildListingLabel(listing: AdminOfferListingOption) {
  const gameTitle = listing.game?.title || "Jogo";
  const platformName = listing.platform?.name || "Plataforma";
  const price = Number(listing.price ?? 0);

  return `${gameTitle} · ${platformName} · ${formatMoney(price)}`;
}

export default function AdminOffers() {
  const [promotions, setPromotions] = useState<AdminOfferItem[]>([]);
  const [promotionsMeta, setPromotionsMeta] = useState<PaginationMeta>(emptyMeta);
  const [promotionPage, setPromotionPage] = useState(1);
  const [listingOptions, setListingOptions] = useState<AdminOfferListingOption[]>([]);
  const [formState, setFormState] = useState<AdminOfferFormState>(createEmptyOfferFormState);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  const [editingListingId, setEditingListingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPromotionId, setDeletingPromotionId] = useState<number | null>(null);

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

  const resetForm = (clearFeedback = true) => {
    setFormState(createEmptyOfferFormState());
    setEditingPromotionId(null);
    setEditingListingId(null);
    if (clearFeedback) {
      setSubmitError("");
      setSubmitMessage("");
    }
  };

  const handleEditPromotion = (promotion: AdminOfferItem) => {
    setEditingPromotionId(promotion.id);
    setEditingListingId(promotion.listingId);
    setSubmitError("");
    setSubmitMessage("");
    setFormState({
      name: promotion.name || "",
      description: promotion.description || "",
      discountPercentage: String(promotion.discountPercentage ?? ""),
      startDate: normalizeDateInput(promotion.startDate),
      endDate: normalizeDateInput(promotion.endDate),
      isActive: Boolean(promotion.isActive),
      listingId: promotion.listingId ? String(promotion.listingId) : "",
    });
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
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

    if (!formState.listingId) {
      setSubmitError("Selecione um listing para a oferta.");
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

    try {
      setIsSaving(true);
      setSubmitError("");
      setSubmitMessage("");
      const currentEditingPromotionId = editingPromotionId;
      const isEditing = currentEditingPromotionId !== null;

      if (isEditing) {
        await api.put(`/promotions/${currentEditingPromotionId}`, payload);

        const nextListingId = Number(formState.listingId);
        if (editingListingId && editingListingId !== nextListingId) {
          await api.delete(
            `/promotions/${currentEditingPromotionId}/listings/${editingListingId}`,
          );
        }

        if (!editingListingId || editingListingId !== nextListingId) {
          await api.post(
            `/promotions/${currentEditingPromotionId}/listings/${nextListingId}`,
          );
        }

        setSubmitMessage("Oferta atualizada com sucesso.");
      } else {
        const { data } = await api.post<{ id: number }>("/promotions", payload);
        await api.post(`/promotions/${data.id}/listings/${Number(formState.listingId)}`);
        setSubmitMessage("Oferta criada com sucesso.");
      }

      resetForm(false);
      await loadData(isEditing ? promotionPage : 1);
      if (!isEditing) {
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
      description="Fluxo minimalista de promoções: uma oferta por listing, com cadastro e edição simples."
      actions={
        editingPromotionId ? (
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
              Listing
              <select
                value={formState.listingId}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    listingId: event.target.value,
                  }))
                }
                className={adminFieldClass}
                required
              >
                <option value="">Selecione um listing</option>
                {listingOptions.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {buildListingLabel(listing)}
                  </option>
                ))}
              </select>
            </label>

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
                    discountPercentage: event.target.value,
                  }))
                }
                className={adminFieldClass}
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
          </div>

          {submitError && <AdminNotice>{submitError}</AdminNotice>}
          {submitMessage && <AdminNotice tone="success">{submitMessage}</AdminNotice>}

          <div className="mt-5 flex flex-wrap gap-3">
            <AdminButton type="submit" disabled={isSaving}>
              {isSaving
                ? "Salvando..."
                : editingPromotionId
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
            Cada promoção desta interface trabalha com apenas um listing. Isso
            mantém o fluxo fácil de entender e reduz o código necessário para o
            projeto.
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
                <div className="space-y-2">
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

                  <p className="text-sm text-slate-400">
                    {promotion.listing?.game?.title || "Sem jogo"} ·{" "}
                    {promotion.listing?.platform?.name || "Sem plataforma"}
                  </p>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                    <span>De {normalizeDateInput(promotion.startDate)}</span>
                    <span>até {normalizeDateInput(promotion.endDate)}</span>
                    <span>
                      {promotion.listing?.pricing?.hasDiscount
                        ? `${formatMoney(
                            promotion.listing.pricing.basePrice,
                          )} -> ${formatMoney(promotion.listing.pricing.finalPrice)}`
                        : "Sem preço calculado"}
                    </span>
                  </div>
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
