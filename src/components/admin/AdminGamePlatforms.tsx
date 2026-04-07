import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  AdminButton,
  AdminNotice,
  AdminPageState,
  AdminTextareaField,
  AdminTextField,
  AdminToggleField,
  createEmptyMeta,
  getKeyStatusBadgeClass,
} from "./adminShared";
import Pagination from "../globals/Pagination";
import api from "../../services/api";
import { resolveAssetUrl } from "../../services/assets";
import {
  getApiErrorMessage,
  type PaginatedResponse,
  type PaginationMeta,
} from "../../services/http";

type StockSummary = {
  available: number;
  reserved: number;
  sold: number;
  total: number;
};

type PlatformMonitorItem = {
  platform: {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    isActive?: boolean;
  };
  hasListing: boolean;
  listingId: number | null;
  price: number | null;
  isActive: boolean;
  stock: StockSummary;
};

type GamePlatformsResponse = {
  game: {
    id: number;
    title?: string;
    coverImageUrl?: string;
  };
  platforms: PlatformMonitorItem[];
};

type GameKey = {
  id: number;
  keyValue: string;
  status: string;
};

type SaveKeysResponse = {
  listingId: number;
  createdCount: number;
  skippedCount: number;
  stock: StockSummary;
};

type DeleteKeysResponse = {
  stock: StockSummary;
};

type PlatformFormState = {
  price: string;
  isActive: boolean;
  newKeysText: string;
  error: string;
  success: string;
  isSaving: boolean;
  isAddingKeys: boolean;
};

type KeysPanelState = {
  isOpen: boolean;
  isLoading: boolean;
  isRemoving: boolean;
  error: string;
  items: GameKey[];
  meta: PaginationMeta;
  page: number;
  selectedIds: number[];
};

const keysPageSize = 8;
const emptyKeysMeta = createEmptyMeta(keysPageSize);

function getPlatformLogoUrl(platform: PlatformMonitorItem["platform"]) {
  return resolveAssetUrl(platform.iconUrl, "/utils/logo.png");
}

function formatPlatformPrice(price: number | null) {
  return price === null ? "" : Number(price).toFixed(2).replace(".", ",");
}

function parsePlatformPrice(value: string) {
  const rawPrice = value.trim().replace(/\s+/g, "");

  if (!rawPrice) {
    return null;
  }

  const normalizedPrice =
    rawPrice.includes(",") && rawPrice.includes(".")
      ? rawPrice.lastIndexOf(",") > rawPrice.lastIndexOf(".")
        ? rawPrice.replace(/\./g, "").replace(",", ".")
        : rawPrice.replace(/,/g, "")
      : rawPrice.replace(",", ".");
  const price = Number(normalizedPrice);

  return Number.isFinite(price) && price > 0 ? price : null;
}

function sanitizePlatformPrice(value: string) {
  return value.replace(/[^\d,.\s]/g, "");
}

function buildPlatformFormState(platform: PlatformMonitorItem): PlatformFormState {
  return {
    price: formatPlatformPrice(platform.price),
    isActive: platform.isActive,
    newKeysText: "",
    error: "",
    success: "",
    isSaving: false,
    isAddingKeys: false,
  };
}

function buildKeysPanelState(): KeysPanelState {
  return {
    isOpen: false,
    isLoading: false,
    isRemoving: false,
    error: "",
    items: [],
    meta: emptyKeysMeta,
    page: 1,
    selectedIds: [],
  };
}

export default function AdminGamePlatforms({ gameId }: { gameId?: string }) {
  const [game, setGame] = useState<GamePlatformsResponse["game"] | null>(null);
  const [platforms, setPlatforms] = useState<PlatformMonitorItem[]>([]);
  const [platformForms, setPlatformForms] = useState<Record<number, PlatformFormState>>({});
  const [keysPanels, setKeysPanels] = useState<Record<number, KeysPanelState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const configurePlatformForms = useCallback((items: PlatformMonitorItem[]) => {
    setPlatformForms((currentForms) =>
      Object.fromEntries(
        items.map((platform) => [
          platform.platform.id,
          {
            ...buildPlatformFormState(platform),
            newKeysText: currentForms[platform.platform.id]?.newKeysText ?? "",
          },
        ]),
      ),
    );
    setKeysPanels((currentPanels) =>
      Object.fromEntries(
        items.map((platform) => [
          platform.platform.id,
          currentPanels[platform.platform.id] ?? buildKeysPanelState(),
        ]),
      ),
    );
  }, []);

  const fetchPlatformMonitor = useCallback(async () => {
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
      configurePlatformForms(data.platforms ?? []);
    } catch (error) {
      setGame(null);
      setPlatforms([]);
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível carregar as plataformas do jogo."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [configurePlatformForms, gameId]);

  useEffect(() => {
    void fetchPlatformMonitor();
  }, [fetchPlatformMonitor]);

  const getPlatformById = useCallback(
    (platformId: number) =>
      platforms.find((platform) => platform.platform.id === platformId) ?? null,
    [platforms],
  );

  const replacePlatformState = useCallback((nextPlatform: PlatformMonitorItem) => {
    setPlatforms((currentPlatforms) =>
      currentPlatforms.map((platform) =>
        platform.platform.id === nextPlatform.platform.id ? nextPlatform : platform,
      ),
    );
  }, []);

  const replacePlatformStock = useCallback(
    (platformId: number, stock: StockSummary, listingId?: number) => {
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
    },
    [],
  );

  const updatePlatformForm = (
    platformId: number,
    updater: (current: PlatformFormState) => PlatformFormState,
  ) => {
    setPlatformForms((currentForms) => ({
      ...currentForms,
      [platformId]: updater(
        currentForms[platformId] ??
          buildPlatformFormState({
            platform: { id: platformId, name: "", slug: "" },
            hasListing: false,
            listingId: null,
            price: null,
            isActive: false,
            stock: { available: 0, reserved: 0, sold: 0, total: 0 },
          }),
      ),
    }));
  };

  const updateKeysPanel = (
    platformId: number,
    updater: (current: KeysPanelState) => KeysPanelState,
  ) => {
    setKeysPanels((currentPanels) => ({
      ...currentPanels,
      [platformId]: updater(currentPanels[platformId] ?? buildKeysPanelState()),
    }));
  };

  const fetchKeysPage = useCallback(
    async (platformId: number, page = 1) => {
      const platform = getPlatformById(platformId);

      if (!platform?.listingId) {
        return;
      }

      try {
        updateKeysPanel(platformId, (current) => ({
          ...current,
          isLoading: true,
          error: "",
          page,
        }));

        const { data } = await api.get<PaginatedResponse<GameKey>>("/game-keys", {
          params: {
            listingId: platform.listingId,
            page,
            limit: keysPageSize,
          },
        });

        updateKeysPanel(platformId, (current) => ({
          ...current,
          isLoading: false,
          items: data.items ?? [],
          meta: data.meta ?? emptyKeysMeta,
          page,
          selectedIds: [],
        }));
      } catch (error) {
        updateKeysPanel(platformId, (current) => ({
          ...current,
          isLoading: false,
          items: [],
          meta: emptyKeysMeta,
          error: getApiErrorMessage(error, "Não foi possível carregar as keys."),
        }));
      }
    },
    [getPlatformById],
  );

  const savePlatform = async (platformId: number) => {
    const platform = getPlatformById(platformId);
    const form = platformForms[platformId];

    if (!platform || !form || !gameId) {
      return;
    }

    const parsedPrice = form.price.trim() ? parsePlatformPrice(form.price) : null;

    if (form.price.trim() && parsedPrice === null) {
      updatePlatformForm(platformId, (current) => ({
        ...current,
        error: "Informe um preço válido usando vírgula ou ponto.",
      }));
      return;
    }

    if (!platform.hasListing && parsedPrice === null) {
      updatePlatformForm(platformId, (current) => ({
        ...current,
        error: "Informe um preço para configurar a plataforma.",
      }));
      return;
    }

    try {
      updatePlatformForm(platformId, (current) => ({
        ...current,
        isSaving: true,
        error: "",
        success: "",
      }));

      const payload: { price?: number; isActive: boolean } = {
        isActive: form.isActive,
      };

      if (parsedPrice !== null) {
        payload.price = parsedPrice;
      }

      const { data } = await api.put<PlatformMonitorItem>(
        `/games/${gameId}/platforms/${platformId}`,
        payload,
      );

      replacePlatformState(data);
      updatePlatformForm(platformId, (current) => ({
        ...buildPlatformFormState(data),
        newKeysText: current.newKeysText,
        success: "Preço e status atualizados para esta plataforma.",
      }));
    } catch (error) {
      updatePlatformForm(platformId, (current) => ({
        ...current,
        isSaving: false,
        error: getApiErrorMessage(error, "Não foi possível salvar a plataforma."),
      }));
    }
  };

  const addKeys = async (platformId: number) => {
    const platform = getPlatformById(platformId);
    const form = platformForms[platformId];

    if (!platform || !form || !gameId) {
      return;
    }

    if (!platform.hasListing) {
      updatePlatformForm(platformId, (current) => ({
        ...current,
        error: "Salve a plataforma antes de adicionar keys.",
      }));
      return;
    }

    if (!form.newKeysText.trim()) {
      updatePlatformForm(platformId, (current) => ({
        ...current,
        error: "Cole pelo menos uma key.",
      }));
      return;
    }

    try {
      updatePlatformForm(platformId, (current) => ({
        ...current,
        isAddingKeys: true,
        error: "",
        success: "",
      }));

      const keyValues = form.newKeysText
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean);

      const { data } = await api.post<SaveKeysResponse>(
        `/games/${gameId}/platforms/${platformId}/keys`,
        { keyValues },
      );

      replacePlatformStock(platformId, data.stock, data.listingId);
      updatePlatformForm(platformId, (current) => ({
        ...current,
        isAddingKeys: false,
        newKeysText: "",
        success: data.skippedCount
          ? `${data.createdCount} key(s) adicionada(s), ${data.skippedCount} ignorada(s).`
          : `${data.createdCount} key(s) adicionada(s).`,
      }));

      if (keysPanels[platformId]?.isOpen) {
        await fetchKeysPage(platformId, 1);
      }
    } catch (error) {
      updatePlatformForm(platformId, (current) => ({
        ...current,
        isAddingKeys: false,
        error: getApiErrorMessage(error, "Não foi possível adicionar as keys."),
      }));
    }
  };

  const toggleSelectedKey = (platformId: number, keyId: number) => {
    updateKeysPanel(platformId, (current) => ({
      ...current,
      selectedIds: current.selectedIds.includes(keyId)
        ? current.selectedIds.filter((id) => id !== keyId)
        : [...current.selectedIds, keyId],
    }));
  };

  const removeSelectedKeys = async (platformId: number) => {
    const platform = getPlatformById(platformId);
    const keysPanel = keysPanels[platformId];

    if (!platform?.listingId || !keysPanel || keysPanel.selectedIds.length === 0) {
      return;
    }

    if (!window.confirm("Deseja remover as keys selecionadas?")) {
      return;
    }

    try {
      updateKeysPanel(platformId, (current) => ({
        ...current,
        isRemoving: true,
        error: "",
      }));

      const { data } = await api.post<DeleteKeysResponse>("/game-keys/bulk-delete", {
        listingId: platform.listingId,
        ids: keysPanel.selectedIds,
      });

      replacePlatformStock(platformId, data.stock);
      await fetchKeysPage(platformId, keysPanel.page);
      updatePlatformForm(platformId, (current) => ({
        ...current,
        success: "Keys removidas com sucesso.",
      }));
      updateKeysPanel(platformId, (current) => ({
        ...current,
        isRemoving: false,
        selectedIds: [],
      }));
    } catch (error) {
      updateKeysPanel(platformId, (current) => ({
        ...current,
        isRemoving: false,
        error: getApiErrorMessage(error, "Não foi possível remover as keys."),
      }));
    }
  };

  const toggleKeysPanel = async (platformId: number) => {
    const nextOpenState = !(keysPanels[platformId]?.isOpen ?? false);

    setKeysPanels((currentPanels) =>
      Object.fromEntries(
        platforms.map((platform) => [
          platform.platform.id,
          {
            ...(currentPanels[platform.platform.id] ?? buildKeysPanelState()),
            isOpen: platform.platform.id === platformId ? nextOpenState : false,
          },
        ]),
      ),
    );

    if (nextOpenState) {
      await fetchKeysPage(platformId, keysPanels[platformId]?.page ?? 1);
    }
  };

  const availableKeysCount = platforms.reduce(
    (total, platform) => total + Number(platform.stock.available ?? 0),
    0,
  );

  return (
    <AdminLayout
      title={game?.title || "Preço e estoque"}
      description="Preço por plataforma e reposição de keys."
      backTo="/admin/games"
      backLabel="Voltar para jogos"
    >
      <AdminPageState
        loading={isLoading}
        error={errorMessage}
        isEmpty={platforms.length === 0}
        loadingText="Carregando monitor de plataformas..."
        emptyText="Nenhuma plataforma cadastrada no sistema."
      >
        <>
          <section className="max-w-5xl">
            <article className="nexus-card p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <img
                  src={resolveAssetUrl(game?.coverImageUrl)}
                  alt={game?.title || "Jogo"}
                  className="aspect-[21/10] w-full max-w-[360px] shrink-0 rounded-[24px] border border-slate-800 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-semibold text-white">
                    {game?.title || "Jogo"}
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-blue-100">
                      {availableKeysCount} keys disponíveis
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            {platforms.map((platform) => {
              const platformId = platform.platform.id;
              const form = platformForms[platformId] ?? buildPlatformFormState(platform);
              const keysPanel = keysPanels[platformId] ?? buildKeysPanelState();

              return (
                <article
                  key={platformId}
                  className="rounded-[24px] border border-slate-800 bg-slate-950/82 p-4 shadow-[0_18px_45px_rgba(2,6,23,0.28)]"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div className="flex min-w-0 items-center gap-4">
                        <img
                          src={getPlatformLogoUrl(platform.platform)}
                          alt={platform.platform.name}
                          className="h-14 w-14 shrink-0 rounded-2xl border border-slate-800 bg-slate-900 object-contain p-2"
                        />
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-white">
                            {platform.platform.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-400">
                            {platform.stock.available} disponíveis
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:ml-auto">
                        <AdminButton
                          type="button"
                          tone="secondary"
                          onClick={() => {
                            void toggleKeysPanel(platformId);
                          }}
                        >
                          {keysPanel.isOpen ? "Fechar estoque" : "Abrir estoque"}
                        </AdminButton>
                        <AdminToggleField
                          label="Venda ativa"
                          checked={form.isActive}
                          onChange={(checked) =>
                            updatePlatformForm(platformId, (current) => ({
                              ...current,
                              isActive: checked,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[180px,auto]">
                      <AdminTextField
                        label="Preço de venda"
                        type="text"
                        inputMode="decimal"
                        placeholder="10,00"
                        value={form.price}
                        onChange={({ target }) =>
                          updatePlatformForm(platformId, (current) => ({
                            ...current,
                            price: sanitizePlatformPrice(target.value),
                          }))
                        }
                        note="Não varia por key."
                      />

                      <div className="flex items-end">
                        <AdminButton
                          type="button"
                          disabled={form.isSaving}
                          onClick={() => {
                            void savePlatform(platformId);
                          }}
                        >
                          {form.isSaving
                            ? "Salvando..."
                            : platform.hasListing
                              ? "Salvar"
                              : "Criar"}
                        </AdminButton>
                      </div>
                    </div>

                    {form.error && (
                      <div>
                        <AdminNotice>{form.error}</AdminNotice>
                      </div>
                    )}
                    {form.success && (
                      <div>
                        <AdminNotice tone="success">{form.success}</AdminNotice>
                      </div>
                    )}

                    {keysPanel.isOpen && (
                      <div className="rounded-[22px] border border-slate-800 bg-slate-900/35 p-4">
                        <div className="grid gap-4 xl:grid-cols-2">
                          <div>
                            <AdminTextareaField
                              label="Novas keys"
                              rows={4}
                              value={form.newKeysText}
                              onChange={({ target }) =>
                                updatePlatformForm(platformId, (current) => ({
                                  ...current,
                                  newKeysText: target.value,
                                }))
                              }
                              placeholder="AAAAA-BBBBB-CCCCC&#10;DDDDD-EEEEE-FFFFF"
                              note="Uma por linha."
                              className="text-sm"
                            />

                            <div className="mt-3 flex flex-wrap gap-2">
                              <AdminButton
                                type="button"
                                disabled={form.isAddingKeys || !platform.hasListing}
                                onClick={() => {
                                  void addKeys(platformId);
                                }}
                              >
                                {form.isAddingKeys ? "Adicionando..." : "Adicionar"}
                              </AdminButton>
                              {!platform.hasListing && (
                                <p className="self-center text-sm text-slate-400">
                                  Salve a plataforma antes de abastecer o estoque.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm text-slate-400">
                                {keysPanel.meta.total} cadastradas
                              </p>
                              <AdminButton
                                type="button"
                                tone="subtleDanger"
                                disabled={
                                  keysPanel.isRemoving || keysPanel.selectedIds.length === 0
                                }
                                onClick={() => {
                                  void removeSelectedKeys(platformId);
                                }}
                              >
                                {keysPanel.isRemoving ? "Removendo..." : "Remover selecionadas"}
                              </AdminButton>
                            </div>

                            {keysPanel.error && (
                              <div className="mt-3">
                                <AdminNotice>{keysPanel.error}</AdminNotice>
                              </div>
                            )}

                            {keysPanel.isLoading ? (
                              <p className="mt-3 text-sm text-slate-300">Carregando keys...</p>
                            ) : keysPanel.items.length === 0 ? (
                              <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/45 p-4 text-sm text-slate-300">
                                Nenhuma key cadastrada para esta plataforma.
                              </p>
                            ) : (
                              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                                {keysPanel.items.map((gameKey) => {
                                  const canRemove = gameKey.status === "available";

                                  return (
                                    <div
                                      key={gameKey.id}
                                      className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/45 p-3 sm:grid-cols-[20px,1fr,auto]"
                                    >
                                      <div className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={keysPanel.selectedIds.includes(gameKey.id)}
                                          disabled={!canRemove}
                                          onChange={() =>
                                            toggleSelectedKey(platformId, gameKey.id)
                                          }
                                        />
                                      </div>

                                      <p className="truncate font-mono text-sm text-white">
                                        {gameKey.keyValue}
                                      </p>

                                      <span className={getKeyStatusBadgeClass(gameKey.status)}>
                                        {gameKey.status}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <Pagination
                              page={keysPanel.page}
                              totalPages={keysPanel.meta.totalPages}
                              onPageChange={(page) => {
                                void fetchKeysPage(platformId, page);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      </AdminPageState>
    </AdminLayout>
  );
}
