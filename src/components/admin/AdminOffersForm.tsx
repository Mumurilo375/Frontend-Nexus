import {
  AdminButton,
  AdminNotice,
  AdminSelectField,
  AdminTextareaField,
  AdminTextField,
  AdminToggleField,
} from "./adminShared";
import {
  getListingPlatformName,
  getListingTitle,
  normalizeDiscountInput,
} from "./adminOffers.helpers";
import type {
  AdminOfferFormState,
  AdminOfferListingOption,
} from "./admin.types";

export default function AdminOffersForm({
  formState,
  platformOptions,
  selectedListingIds,
  selectedListings,
  editingPromotionId,
  submitError,
  submitMessage,
  isSaving,
  onSubmit,
  onFieldChange,
  onAddPlatformListings,
  onOpenListingPicker,
  onRemoveListing,
  onReset,
}: {
  formState: AdminOfferFormState;
  platformOptions: Array<{ id: number; name: string }>;
  selectedListingIds: number[];
  selectedListings: AdminOfferListingOption[];
  editingPromotionId: number | null;
  submitError: string;
  submitMessage: string;
  isSaving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof AdminOfferFormState, value: string | boolean) => void;
  onAddPlatformListings: () => void;
  onOpenListingPicker: () => void;
  onRemoveListing: (listingId: number) => void;
  onReset: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[28px] border border-slate-800 bg-slate-950/78 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <AdminTextField
          label="Nome da oferta"
          value={formState.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          className="md:col-span-2"
          required
        />

        <AdminTextareaField
          label="Descrição"
          value={formState.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          className="min-h-28 md:col-span-2"
        />

        <AdminTextField
          label="Desconto (%)"
          type="number"
          min="1"
          max="100"
          value={formState.discountPercentage}
          onChange={(event) =>
            onFieldChange("discountPercentage", normalizeDiscountInput(event.target.value))
          }
          className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          required
        />

        <div className="self-end">
          <AdminToggleField
            label="Oferta ativa"
            checked={formState.isActive}
            onChange={(isActive) => onFieldChange("isActive", isActive)}
          />
        </div>

        <AdminTextField
          label="Data inicial"
          type="date"
          value={formState.startDate}
          onChange={(event) => onFieldChange("startDate", event.target.value)}
          required
        />

        <AdminTextField
          label="Data final"
          type="date"
          value={formState.endDate}
          onChange={(event) => onFieldChange("endDate", event.target.value)}
          required
        />

        <AdminSelectField
          label="Plataforma"
          value={formState.platformId}
          onChange={(event) => onFieldChange("platformId", event.target.value)}
        >
          <option value="">Selecione uma plataforma</option>
          {platformOptions.map((platform) => (
            <option key={platform.id} value={platform.id}>
              {platform.name}
            </option>
          ))}
        </AdminSelectField>

        <div className="self-end">
          <AdminButton type="button" tone="secondary" onClick={onAddPlatformListings}>
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

            <AdminButton type="button" tone="secondary" onClick={onOpenListingPicker}>
              Escolher jogos
            </AdminButton>
          </div>
        </section>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">Listings selecionados</p>
            <p className="text-sm text-slate-400">{selectedListingIds.length}</p>
          </div>

          {selectedListings.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Nenhum listing selecionado.</p>
          ) : (
            <div className="nexus-scrollbar mt-3 max-h-56 space-y-2 overflow-y-auto pr-2">
              {selectedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {getListingTitle(listing)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {getListingPlatformName(listing)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveListing(listing.id)}
                    className="shrink-0 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/15"
                  >
                    Remover
                  </button>
                </div>
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
        <AdminButton type="button" tone="secondary" onClick={onReset}>
          Limpar formulário
        </AdminButton>
      </div>
    </form>
  );
}
