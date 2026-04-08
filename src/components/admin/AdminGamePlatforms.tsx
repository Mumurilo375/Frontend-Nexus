import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import AdminGamePlatformsModal from "./AdminGamePlatformsModal";
import {
  createFallbackPlatformMonitorItem,
  createPlatformFormState,
  createPlatformKeysState,
  emptyKeysMeta,
  getGameKeyValues,
  keysPageSize,
  parsePlatformPrice,
  shouldWarnAboutGlobalPriceChange,
  type DeleteKeysResponse,
  type GameKey,
  type GamePlatformsResponse,
  type PlatformConfirmationState,
  type PlatformFormState,
  type PlatformKeysState,
  type PlatformMonitorItem,
  type SaveKeysResponse,
  type StockSummary,
} from "./AdminGamePlatforms.helpers";
import { resolveAssetUrl, resolvePlatformLogoUrl } from "../../services/assets";
import { AdminButton, AdminPageState, AdminStatusBadge } from "./adminShared";
import api from "../../services/api";
import { getApiErrorMessage, type PaginatedResponse } from "../../services/http";

export default function AdminGamePlatforms({ gameId }: { gameId?: string }) {
  const [game, setGame] = useState<GamePlatformsResponse["game"] | null>(null);
  const [platforms, setPlatforms] = useState<PlatformMonitorItem[]>([]);
  const [platformBeingManaged, setPlatformBeingManaged] = useState<number | null>(null);
  const [platformFormStateById, setPlatformFormStateById] = useState<Record<number, PlatformFormState>>({});
  const [platformKeysStateById, setPlatformKeysStateById] = useState<Record<number, PlatformKeysState>>({});
  const [pendingConfirmation, setPendingConfirmation] = useState<PlatformConfirmationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const syncPlatformState = (items: PlatformMonitorItem[]) => {
    setPlatformFormStateById((currentState) =>
      Object.fromEntries(
        items.map((platform) => [
          platform.platform.id,
          {
            ...createPlatformFormState(platform),
            newKeysText: currentState[platform.platform.id]?.newKeysText ?? "",
          },
        ]),
      ),
    );
    setPlatformKeysStateById((currentState) =>
      Object.fromEntries(
        items.map((platform) => [
          platform.platform.id,
          currentState[platform.platform.id] ?? createPlatformKeysState(),
        ]),
      ),
    );
  };

  const findPlatformMonitorItem = (platformId: number) =>
    platforms.find((platform) => platform.platform.id === platformId) ?? null;

  const updatePlatformFormState = (
    platformId: number,
    updateFormState: (currentState: PlatformFormState) => PlatformFormState,
  ) => {
    setPlatformFormStateById((currentState) => ({
      ...currentState,
      [platformId]: updateFormState(
        currentState[platformId] ?? createPlatformFormState(createFallbackPlatformMonitorItem(platformId)),
      ),
    }));
  };

  const updatePlatformKeysState = (
    platformId: number,
    updateKeysState: (currentState: PlatformKeysState) => PlatformKeysState,
  ) => {
    setPlatformKeysStateById((currentState) => ({
      ...currentState,
      [platformId]: updateKeysState(currentState[platformId] ?? createPlatformKeysState()),
    }));
  };

  const replacePlatformMonitorItem = (nextPlatform: PlatformMonitorItem) =>
    setPlatforms((currentPlatforms) =>
      currentPlatforms.map((platform) =>
        platform.platform.id === nextPlatform.platform.id ? nextPlatform : platform,
      ),
    );

  const updatePlatformStockSummary = (platformId: number, stock: StockSummary, listingId?: number) =>
    setPlatforms((currentPlatforms) =>
      currentPlatforms.map((platform) =>
        platform.platform.id !== platformId
          ? platform
          : {
              ...platform,
              stock,
              listingId: listingId ?? platform.listingId,
              hasListing: Boolean(listingId ?? platform.listingId),
            },
      ),
    );

  const fetchPlatformKeysPage = async (platformId: number, page = 1) => {
    const platform = findPlatformMonitorItem(platformId);

    if (!platform?.listingId) {
      return;
    }

    try {
      updatePlatformKeysState(platformId, (currentState) => ({
        ...currentState,
        isLoading: true,
        error: "",
        page,
      }));

      const { data } = await api.get<PaginatedResponse<GameKey>>("/game-keys", {
        params: { listingId: platform.listingId, page, limit: keysPageSize },
      });

      updatePlatformKeysState(platformId, (currentState) => ({
        ...currentState,
        isLoading: false,
        items: data.items ?? [],
        meta: data.meta ?? emptyKeysMeta,
        page,
        selectedIds: [],
      }));
    } catch (error) {
      updatePlatformKeysState(platformId, (currentState) => ({
        ...currentState,
        isLoading: false,
        items: [],
        meta: emptyKeysMeta,
        error: getApiErrorMessage(error, "Não foi possível carregar as keys."),
      }));
    }
  };

  useEffect(() => {
    const fetchPlatformMonitor = async () => {
      if (!gameId) {
        setIsLoading(false);
        setErrorMessage("Jogo inválido.");
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const { data } = await api.get<GamePlatformsResponse>(`/games/${gameId}/platforms`);
        setGame(data.game);
        setPlatforms(data.platforms ?? []);
        syncPlatformState(data.platforms ?? []);
      } catch (error) {
        setGame(null);
        setPlatforms([]);
        setErrorMessage(
          getApiErrorMessage(error, "Não foi possível carregar as plataformas do jogo."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPlatformMonitor();
  }, [gameId]);

  const openPlatformManagementModal = async (platformId: number) => {
    const platform = findPlatformMonitorItem(platformId);

    if (!platform) {
      return;
    }

    setPlatformBeingManaged(platformId);
    setPendingConfirmation(null);
    setPlatformFormStateById((currentState) => ({
      ...currentState,
      [platformId]: createPlatformFormState(platform),
    }));

    if (!platform.listingId) {
      setPlatformKeysStateById((currentState) => ({
        ...currentState,
        [platformId]: createPlatformKeysState(),
      }));
      return;
    }

    await fetchPlatformKeysPage(platformId, 1);
  };

  const closePlatformManagementModal = () => {
    setPlatformBeingManaged(null);
    setPendingConfirmation(null);
  };

  const savePlatformSettings = async (platformId: number) => {
    const platform = findPlatformMonitorItem(platformId);
    const formState = platformFormStateById[platformId];

    if (!platform || !formState || !gameId) {
      return;
    }

    const parsedPrice = formState.price.trim() ? parsePlatformPrice(formState.price) : null;

    if (formState.price.trim() && parsedPrice === null) {
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        error: "Informe um preço válido usando vírgula ou ponto.",
      }));
      return;
    }

    if (!platform.hasListing && parsedPrice === null) {
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        error: "Informe um preço para configurar a plataforma.",
      }));
      return;
    }

    try {
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        isSaving: true,
        error: "",
        success: "",
      }));

      const payload: { price?: number; isActive: boolean } = { isActive: formState.isActive };

      if (parsedPrice !== null) {
        payload.price = parsedPrice;
      }

      const { data } = await api.put<PlatformMonitorItem>(
        `/games/${gameId}/platforms/${platformId}`,
        payload,
      );

      replacePlatformMonitorItem(data);
      updatePlatformFormState(platformId, (currentState) => ({
        ...createPlatformFormState(data),
        newKeysText: currentState.newKeysText,
        success: "Plataforma salva.",
      }));
    } catch (error) {
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        isSaving: false,
        error: getApiErrorMessage(error, "Não foi possível salvar a plataforma."),
      }));
    }
  };

  const requestPlatformSettingsSave = (platformId: number) => {
    const platform = findPlatformMonitorItem(platformId);
    const formState = platformFormStateById[platformId];

    if (!platform || !formState) {
      return;
    }

    if (shouldWarnAboutGlobalPriceChange(platform, formState)) {
      setPendingConfirmation({ type: "priceChange", platformId });
      return;
    }

    void savePlatformSettings(platformId);
  };

  const addKeysToPlatform = async (platformId: number) => {
    const platform = findPlatformMonitorItem(platformId);
    const formState = platformFormStateById[platformId];

    if (!platform || !formState || !gameId) {
      return;
    }

    if (!platform.hasListing) {
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        error: "Salve o preço antes de adicionar keys.",
      }));
      return;
    }

    const { keyValues, hasIncompleteKey } = getGameKeyValues(formState.newKeysText);

    if (!keyValues.length) {
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        error: "Cole pelo menos uma key.",
      }));
      return;
    }

    if (hasIncompleteKey) {
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        error: "Complete todas as keys no formato XXXX-XXXX-XXXX.",
      }));
      return;
    }

    try {
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        isAddingKeys: true,
        error: "",
        success: "",
      }));

      const { data } = await api.post<SaveKeysResponse>(
        `/games/${gameId}/platforms/${platformId}/keys`,
        { keyValues },
      );

      updatePlatformStockSummary(platformId, data.stock, data.listingId);
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        isAddingKeys: false,
        newKeysText: "",
        success: data.skippedCount
          ? `${data.createdCount} adicionadas, ${data.skippedCount} ignoradas.`
          : `${data.createdCount} adicionadas.`,
      }));
      await fetchPlatformKeysPage(platformId, 1);
    } catch (error) {
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        isAddingKeys: false,
        error: getApiErrorMessage(error, "Não foi possível adicionar as keys."),
      }));
    }
  };

  const toggleSelectedKey = (platformId: number, keyId: number) => {
    updatePlatformKeysState(platformId, (currentState) => ({
      ...currentState,
      selectedIds: currentState.selectedIds.includes(keyId)
        ? currentState.selectedIds.filter((selectedId) => selectedId !== keyId)
        : [...currentState.selectedIds, keyId],
    }));
  };

  const removeSelectedPlatformKeys = async (platformId: number) => {
    const platform = findPlatformMonitorItem(platformId);
    const keysState = platformKeysStateById[platformId];

    if (!platform?.listingId || !keysState || keysState.selectedIds.length === 0) {
      return;
    }

    try {
      updatePlatformKeysState(platformId, (currentState) => ({
        ...currentState,
        isRemoving: true,
        error: "",
      }));

      const { data } = await api.post<DeleteKeysResponse>("/game-keys/bulk-delete", {
        listingId: platform.listingId,
        ids: keysState.selectedIds,
      });

      updatePlatformStockSummary(platformId, data.stock);
      await fetchPlatformKeysPage(platformId, keysState.page);
      updatePlatformFormState(platformId, (currentState) => ({
        ...currentState,
        success: "Keys removidas.",
      }));
      updatePlatformKeysState(platformId, (currentState) => ({
        ...currentState,
        isRemoving: false,
        selectedIds: [],
      }));
    } catch (error) {
      updatePlatformKeysState(platformId, (currentState) => ({
        ...currentState,
        isRemoving: false,
        error: getApiErrorMessage(error, "Não foi possível remover as keys."),
      }));
    }
  };

  const requestSelectedKeysRemoval = (platformId: number) => {
    if ((platformKeysStateById[platformId]?.selectedIds.length ?? 0) > 0) {
      setPendingConfirmation({ type: "removeKeys", platformId });
    }
  };

  const confirmPendingAction = () => {
    if (!pendingConfirmation) {
      return;
    }

    const { platformId, type } = pendingConfirmation;
    setPendingConfirmation(null);

    if (type === "priceChange") {
      void savePlatformSettings(platformId);
      return;
    }

    void removeSelectedPlatformKeys(platformId);
  };

  const availableKeysCount = platforms.reduce((total, platform) => total + Number(platform.stock.available ?? 0), 0);
  const managedPlatform = platformBeingManaged === null ? null : findPlatformMonitorItem(platformBeingManaged);
  const managedPlatformFormState = platformBeingManaged === null ? null : platformFormStateById[platformBeingManaged] ?? null;
  const managedPlatformKeysState = platformBeingManaged === null ? null : platformKeysStateById[platformBeingManaged] ?? null;
  const managedPlatformId = managedPlatform?.platform.id ?? null;
  const selectedKeysCount =
    pendingConfirmation?.type === "removeKeys"
      ? platformKeysStateById[pendingConfirmation.platformId]?.selectedIds.length ?? 0
      : 0;
  const patchManagedPlatformForm = (changes: Partial<PlatformFormState>) => {
    if (managedPlatformId === null) {
      return;
    }

    updatePlatformFormState(managedPlatformId, (currentState) => ({ ...currentState, ...changes }));
  };

  return (
    <AdminLayout title="Plataformas" backTo="/admin/games" backLabel="Voltar para jogos">
      <AdminPageState
        loading={isLoading}
        error={errorMessage}
        isEmpty={platforms.length === 0}
        loadingText="Carregando plataformas..."
        emptyText="Nenhuma plataforma cadastrada no sistema."
      >
        <>
          <section className="rounded-[28px] border border-slate-800 bg-slate-950/82 p-4 shadow-[0_18px_45px_rgba(2,6,23,0.28)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <img
                src={resolveAssetUrl(game?.coverImageUrl)}
                alt={game?.title || "Jogo"}
                className="aspect-[21/10] w-full max-w-[170px] shrink-0 rounded-[24px] border border-slate-800 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Jogo
                </p>
                <h2 className="mt-2 truncate text-2xl font-semibold text-white">
                  {game?.title || "Jogo"}
                </h2>
              </div>
              <span className="shrink-0 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100">
                {availableKeysCount} keys disponíveis
              </span>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            {platforms.map((platform) => (
              <article
                key={platform.platform.id}
                className="rounded-[24px] border border-slate-800 bg-slate-950/82 p-4 shadow-[0_18px_45px_rgba(2,6,23,0.28)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 p-2">
                    <img
                      src={resolvePlatformLogoUrl(platform.platform.name, platform.platform.iconUrl)}
                      alt={platform.platform.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold text-white">
                      {platform.platform.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                        {platform.price === null ? "Sem preço" : `R$ ${platform.price.toFixed(2).replace(".", ",")}`}
                      </span>
                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                        {platform.stock.available} disponíveis
                      </span>
                      <AdminStatusBadge
                        active={platform.isActive}
                        activeLabel="Plataforma ativa"
                        inactiveLabel="Plataforma inativa"
                      />
                    </div>
                  </div>

                  <AdminButton
                    type="button"
                    tone="secondary"
                    onClick={() => {
                      void openPlatformManagementModal(platform.platform.id);
                    }}
                  >
                    Gerenciar
                  </AdminButton>
                </div>
              </article>
            ))}
          </section>

          {managedPlatform && managedPlatformFormState && managedPlatformKeysState && managedPlatformId !== null && (
            <AdminGamePlatformsModal
              platform={managedPlatform}
              formState={managedPlatformFormState}
              keysState={managedPlatformKeysState}
              pendingConfirmation={pendingConfirmation}
              selectedKeysCount={selectedKeysCount}
              onClose={closePlatformManagementModal}
              onPriceChange={(price) => patchManagedPlatformForm({ price })}
              onActiveChange={(isActive) => patchManagedPlatformForm({ isActive })}
              onSave={() => requestPlatformSettingsSave(managedPlatformId)}
              onNewKeysTextChange={(newKeysText) => patchManagedPlatformForm({ newKeysText })}
              onAddKeys={() => {
                void addKeysToPlatform(managedPlatformId);
              }}
              onRemoveSelected={() => requestSelectedKeysRemoval(managedPlatformId)}
              onToggleSelectedKey={(keyId) => toggleSelectedKey(managedPlatformId, keyId)}
              onPageChange={(page) => {
                void fetchPlatformKeysPage(managedPlatformId, page);
              }}
              onCancelConfirmation={() => setPendingConfirmation(null)}
              onConfirmConfirmation={confirmPendingAction}
            />
          )}
        </>
      </AdminPageState>
    </AdminLayout>
  );
}
