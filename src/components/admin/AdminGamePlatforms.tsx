import { useCallback, useEffect, useRef, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  AdminButton,
  AdminNotice,
  AdminPageState,
  AdminStatusBadge,  AdminTextField,
  AdminToggleField,
  createEmptyMeta,
  getKeyStatusBadgeClass,
} from "./adminShared";
import Pagination from "../globals/Pagination";
import api from "../../services/api";
import { resolveAssetUrl, resolvePlatformLogoUrl } from "../../services/assets";
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
  originalPrice: string;
  isActive: boolean;
  newKeysText: string;
  error: string;
  success: string;
  isSaving: boolean;
  isAddingKeys: boolean;
};

type PlatformKeysState = {
  isLoading: boolean;
  isRemoving: boolean;
  error: string;
  items: GameKey[];
  meta: PaginationMeta;
  page: number;
  selectedIds: number[];
};

type PlatformConfirmationState =
  | { type: "priceChange"; platformId: number }
  | { type: "removeKeys"; platformId: number };

const keysPageSize = 8;
const keyColumnSize = 6;
const keyGridColumnCount = 3;
const keyGridBlockSize = keyColumnSize * keyGridColumnCount;
const emptyKeysMeta = createEmptyMeta(keysPageSize);

function formatPlatformPrice(price: number | null) {
  return price === null ? "" : Number(price).toFixed(2).replace(".", ",");
}

function getPlatformPriceLabel(price: number | null) {
  return price === null ? "Sem preço" : `R$ ${formatPlatformPrice(price)}`;
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

function formatGameKeyValue(value: string) {
  const rawKeyValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return rawKeyValue.match(/.{1,4}/g)?.join("-") ?? "";
}

function getGameKeyLines(text: string) {
  return text ? text.split(/\r?\n/) : [];
}

function trimTrailingEmptyGameKeyLines(gameKeyLines: string[]) {
  const nextGameKeyLines = [...gameKeyLines];

  while (
    nextGameKeyLines.length > 0 &&
    !nextGameKeyLines[nextGameKeyLines.length - 1]?.trim()
  ) {
    nextGameKeyLines.pop();
  }

  return nextGameKeyLines;
}

function getPastedGameKeyValues(pastedText: string) {
  return pastedText
    .toUpperCase()
    .split(/\r?\n|[\s,;]+/)
    .flatMap((line) => line.replace(/[^A-Z0-9]/g, "").match(/.{1,12}/g) ?? [])
    .map(formatGameKeyValue)
    .filter(Boolean);
}

function getGameKeyValues(text: string) {
  const keyValues = getGameKeyLines(text)
    .map(formatGameKeyValue)
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    keyValues,
    hasIncompleteKey: keyValues.some(
      (keyValue) => keyValue.replace(/[^A-Z0-9]/g, "").length !== 12,
    ),
  };
}

function getVisibleGameKeyLines(text: string) {
  const gameKeyLines = trimTrailingEmptyGameKeyLines(
    getGameKeyLines(text).map(formatGameKeyValue),
  );
  const visibleLineCount = Math.max(
    keyGridBlockSize,
    Math.ceil((gameKeyLines.length + 1) / keyGridBlockSize) * keyGridBlockSize,
  );

  return Array.from({ length: visibleLineCount }, (_, lineIndex) => gameKeyLines[lineIndex] ?? "");
}

function updateGameKeyLineText(text: string, lineIndex: number, lineText: string) {
  const gameKeyLines = getGameKeyLines(text);

  while (gameKeyLines.length <= lineIndex) {
    gameKeyLines.push("");
  }

  gameKeyLines[lineIndex] = formatGameKeyValue(lineText);
  return trimTrailingEmptyGameKeyLines(gameKeyLines).join("\n");
}

function pasteGameKeyLineText(text: string, startLineIndex: number, pastedText: string) {
  const pastedKeyValues = getPastedGameKeyValues(pastedText);

  if (pastedKeyValues.length === 0) {
    return updateGameKeyLineText(text, startLineIndex, pastedText);
  }

  const gameKeyLines = getGameKeyLines(text);

  while (gameKeyLines.length < startLineIndex) {
    gameKeyLines.push("");
  }

  pastedKeyValues.forEach((keyValue, pastedIndex) => {
    gameKeyLines[startLineIndex + pastedIndex] = keyValue;
  });

  return trimTrailingEmptyGameKeyLines(gameKeyLines).join("\n");
}

function getGameKeyLineSections(text: string): string[][] {
  const visibleGameKeyLines = getVisibleGameKeyLines(text);

  return Array.from(
    { length: Math.ceil(visibleGameKeyLines.length / keyGridBlockSize) },
    (_, sectionIndex) =>
      visibleGameKeyLines.slice(
        sectionIndex * keyGridBlockSize,
        sectionIndex * keyGridBlockSize + keyGridBlockSize,
      ),
  );
}

function hasPlatformPriceChanged(platformFormState: PlatformFormState) {
  return (
    parsePlatformPrice(platformFormState.price) !==
    parsePlatformPrice(platformFormState.originalPrice)
  );
}

function shouldWarnAboutGlobalPriceChange(
  platform: PlatformMonitorItem,
  platformFormState: PlatformFormState,
) {
  return platform.hasListing && hasPlatformPriceChanged(platformFormState);
}

function createPlatformFormState(platform: PlatformMonitorItem): PlatformFormState {
  const formattedPrice = formatPlatformPrice(platform.price);

  return {
    price: formattedPrice,
    originalPrice: formattedPrice,
    isActive: platform.isActive,
    newKeysText: "",
    error: "",
    success: "",
    isSaving: false,
    isAddingKeys: false,
  };
}

function createPlatformKeysState(): PlatformKeysState {
  return {
    isLoading: false,
    isRemoving: false,
    error: "",
    items: [],
    meta: emptyKeysMeta,
    page: 1,
    selectedIds: [],
  };
}

function createFallbackPlatformMonitorItem(platformId: number): PlatformMonitorItem {
  return {
    platform: { id: platformId, name: "", slug: "" },
    hasListing: false,
    listingId: null,
    price: null,
    isActive: false,
    stock: { available: 0, reserved: 0, sold: 0, total: 0 },
  };
}

function PlatformConfirmModal({
  title,
  message,
  confirmLabel,
  tone = "primary",
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-4 py-6">
      <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-950 p-5 shadow-[0_30px_80px_rgba(2,6,23,0.6)]">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <AdminButton type="button" tone="secondary" onClick={onCancel}>
            Cancelar
          </AdminButton>
          <AdminButton type="button" tone={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

export default function AdminGamePlatforms({ gameId }: { gameId?: string }) {
  const [game, setGame] = useState<GamePlatformsResponse["game"] | null>(null);
  const [platforms, setPlatforms] = useState<PlatformMonitorItem[]>([]);
  const [platformBeingManaged, setPlatformBeingManaged] = useState<number | null>(null);
  const [platformFormStateById, setPlatformFormStateById] = useState<Record<number, PlatformFormState>>({});
  const [platformKeysStateById, setPlatformKeysStateById] = useState<Record<number, PlatformKeysState>>({});
  const gameKeyInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PlatformConfirmationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const syncPlatformState = useCallback((items: PlatformMonitorItem[]) => {
    setPlatformFormStateById((currentFormStateById) =>
      Object.fromEntries(
        items.map((platform) => [
          platform.platform.id,
          {
            ...createPlatformFormState(platform),
            newKeysText: currentFormStateById[platform.platform.id]?.newKeysText ?? "",
          },
        ]),
      ),
    );
    setPlatformKeysStateById((currentKeysStateById) =>
      Object.fromEntries(
        items.map((platform) => [
          platform.platform.id,
          currentKeysStateById[platform.platform.id] ?? createPlatformKeysState(),
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
      syncPlatformState(data.platforms ?? []);
    } catch (error) {
      setGame(null);
      setPlatforms([]);
      setErrorMessage(getApiErrorMessage(error, "Não foi possível carregar as plataformas do jogo."));
    } finally {
      setIsLoading(false);
    }
  }, [gameId, syncPlatformState]);

  useEffect(() => {
    void fetchPlatformMonitor();
  }, [fetchPlatformMonitor]);

  const findPlatformMonitorItem = useCallback(
    (platformId: number) =>
      platforms.find((platform) => platform.platform.id === platformId) ?? null,
    [platforms],
  );

  const updatePlatformFormState = (
    platformId: number,
    updateFormState: (currentFormState: PlatformFormState) => PlatformFormState,
  ) => {
    setPlatformFormStateById((currentFormStateById) => ({
      ...currentFormStateById,
      [platformId]: updateFormState(
        currentFormStateById[platformId] ??
          createPlatformFormState(createFallbackPlatformMonitorItem(platformId)),
      ),
    }));
  };

  const updatePlatformKeysState = (
    platformId: number,
    updateKeysState: (currentKeysState: PlatformKeysState) => PlatformKeysState,
  ) => {
    setPlatformKeysStateById((currentKeysStateById) => ({
      ...currentKeysStateById,
      [platformId]: updateKeysState(
        currentKeysStateById[platformId] ?? createPlatformKeysState(),
      ),
    }));
  };

  const replacePlatformMonitorItem = useCallback((nextPlatform: PlatformMonitorItem) => {
    setPlatforms((currentPlatforms) =>
      currentPlatforms.map((platform) =>
        platform.platform.id === nextPlatform.platform.id ? nextPlatform : platform,
      ),
    );
  }, []);

  const updatePlatformStockSummary = useCallback(
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

  const fetchPlatformKeysPage = useCallback(
    async (platformId: number, page = 1) => {
      const platform = findPlatformMonitorItem(platformId);

      if (!platform?.listingId) {
        return;
      }

      try {
        updatePlatformKeysState(platformId, (currentKeysState) => ({
          ...currentKeysState,
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

        updatePlatformKeysState(platformId, (currentKeysState) => ({
          ...currentKeysState,
          isLoading: false,
          items: data.items ?? [],
          meta: data.meta ?? emptyKeysMeta,
          page,
          selectedIds: [],
        }));
      } catch (error) {
        updatePlatformKeysState(platformId, (currentKeysState) => ({
          ...currentKeysState,
          isLoading: false,
          items: [],
          meta: emptyKeysMeta,
          error: getApiErrorMessage(error, "Não foi possível carregar as keys."),
        }));
      }
    },
    [findPlatformMonitorItem],
  );

  const openPlatformManagementModal = async (platformId: number) => {
    const platform = findPlatformMonitorItem(platformId);

    if (!platform) {
      return;
    }

    setPlatformBeingManaged(platformId);
    setPendingConfirmation(null);
    setPlatformFormStateById((currentFormStateById) => ({
      ...currentFormStateById,
      [platformId]: createPlatformFormState(platform),
    }));

    if (!platform.listingId) {
      setPlatformKeysStateById((currentKeysStateById) => ({
        ...currentKeysStateById,
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
    const platformFormState = platformFormStateById[platformId];

    if (!platform || !platformFormState || !gameId) {
      return;
    }

    const parsedPrice = platformFormState.price.trim()
      ? parsePlatformPrice(platformFormState.price)
      : null;

    if (platformFormState.price.trim() && parsedPrice === null) {
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        error: "Informe um preço válido usando vírgula ou ponto.",
      }));
      return;
    }

    if (!platform.hasListing && parsedPrice === null) {
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        error: "Informe um preço para configurar a plataforma.",
      }));
      return;
    }

    try {
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        isSaving: true,
        error: "",
        success: "",
      }));

      const payload: { price?: number; isActive: boolean } = {
        isActive: platformFormState.isActive,
      };

      if (parsedPrice !== null) {
        payload.price = parsedPrice;
      }

      const { data } = await api.put<PlatformMonitorItem>(
        `/games/${gameId}/platforms/${platformId}`,
        payload,
      );

      replacePlatformMonitorItem(data);
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...createPlatformFormState(data),
        newKeysText: currentFormState.newKeysText,
        success: "Plataforma salva.",
      }));
    } catch (error) {
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        isSaving: false,
        error: getApiErrorMessage(error, "Não foi possível salvar a plataforma."),
      }));
    }
  };

  const requestPlatformSettingsSave = (platformId: number) => {
    const platform = findPlatformMonitorItem(platformId);
    const platformFormState = platformFormStateById[platformId];

    if (!platform || !platformFormState) {
      return;
    }

    if (shouldWarnAboutGlobalPriceChange(platform, platformFormState)) {
      setPendingConfirmation({ type: "priceChange", platformId });
      return;
    }

    void savePlatformSettings(platformId);
  };

  const addKeysToPlatform = async (platformId: number) => {
    const platform = findPlatformMonitorItem(platformId);
    const platformFormState = platformFormStateById[platformId];

    if (!platform || !platformFormState || !gameId) {
      return;
    }

    if (!platform.hasListing) {
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        error: "Salve o preço antes de adicionar keys.",
      }));
      return;
    }

    const { keyValues, hasIncompleteKey } = getGameKeyValues(platformFormState.newKeysText);

    if (keyValues.length === 0) {
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        error: "Cole pelo menos uma key.",
      }));
      return;
    }

    if (hasIncompleteKey) {
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        error: "Complete todas as keys no formato XXXX-XXXX-XXXX.",
      }));
      return;
    }

    try {
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        isAddingKeys: true,
        error: "",
        success: "",
      }));

      const { data } = await api.post<SaveKeysResponse>(
        `/games/${gameId}/platforms/${platformId}/keys`,
        { keyValues },
      );

      updatePlatformStockSummary(platformId, data.stock, data.listingId);
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        isAddingKeys: false,
        newKeysText: "",
        success: data.skippedCount
          ? `${data.createdCount} adicionadas, ${data.skippedCount} ignoradas.`
          : `${data.createdCount} adicionadas.`,
      }));
      await fetchPlatformKeysPage(platformId, 1);
    } catch (error) {
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        isAddingKeys: false,
        error: getApiErrorMessage(error, "Não foi possível adicionar as keys."),
      }));
    }
  };

  const toggleSelectedKey = (platformId: number, keyId: number) => {
    updatePlatformKeysState(platformId, (currentKeysState) => ({
      ...currentKeysState,
      selectedIds: currentKeysState.selectedIds.includes(keyId)
        ? currentKeysState.selectedIds.filter((selectedId) => selectedId !== keyId)
        : [...currentKeysState.selectedIds, keyId],
    }));
  };

  const removeSelectedPlatformKeys = async (platformId: number) => {
    const platform = findPlatformMonitorItem(platformId);
    const platformKeysState = platformKeysStateById[platformId];

    if (!platform?.listingId || !platformKeysState || platformKeysState.selectedIds.length === 0) {
      return;
    }

    try {
      updatePlatformKeysState(platformId, (currentKeysState) => ({
        ...currentKeysState,
        isRemoving: true,
        error: "",
      }));

      const { data } = await api.post<DeleteKeysResponse>("/game-keys/bulk-delete", {
        listingId: platform.listingId,
        ids: platformKeysState.selectedIds,
      });

      updatePlatformStockSummary(platformId, data.stock);
      await fetchPlatformKeysPage(platformId, platformKeysState.page);
      updatePlatformFormState(platformId, (currentFormState) => ({
        ...currentFormState,
        success: "Keys removidas.",
      }));
      updatePlatformKeysState(platformId, (currentKeysState) => ({
        ...currentKeysState,
        isRemoving: false,
        selectedIds: [],
      }));
    } catch (error) {
      updatePlatformKeysState(platformId, (currentKeysState) => ({
        ...currentKeysState,
        isRemoving: false,
        error: getApiErrorMessage(error, "Não foi possível remover as keys."),
      }));
    }
  };

  const requestSelectedKeysRemoval = (platformId: number) => {
    const platformKeysState = platformKeysStateById[platformId];

    if (!platformKeysState || platformKeysState.selectedIds.length === 0) {
      return;
    }

    setPendingConfirmation({ type: "removeKeys", platformId });
  };

  const confirmPendingAction = () => {
    if (!pendingConfirmation) {
      return;
    }

    const platformId = pendingConfirmation.platformId;
    const confirmationType = pendingConfirmation.type;

    setPendingConfirmation(null);

    if (confirmationType === "priceChange") {
      void savePlatformSettings(platformId);
      return;
    }

    void removeSelectedPlatformKeys(platformId);
  };

  const availableKeysCount = platforms.reduce(
    (totalKeys, platform) => totalKeys + Number(platform.stock.available ?? 0),
    0,
  );
  const managedPlatform =
    platformBeingManaged === null ? null : findPlatformMonitorItem(platformBeingManaged);
  const managedPlatformFormState =
    platformBeingManaged === null ? null : platformFormStateById[platformBeingManaged] ?? null;
  const managedPlatformKeysState =
    platformBeingManaged === null ? null : platformKeysStateById[platformBeingManaged] ?? null;
  const confirmationPlatform =
    pendingConfirmation === null ? null : findPlatformMonitorItem(pendingConfirmation.platformId);
  const selectedKeysCount =
    pendingConfirmation?.type === "removeKeys"
      ? platformKeysStateById[pendingConfirmation.platformId]?.selectedIds.length ?? 0
      : 0;
  const managedPlatformKeyLineSections: string[][] =
    managedPlatformFormState === null
      ? []
      : getGameKeyLineSections(managedPlatformFormState.newKeysText);
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
                        {getPlatformPriceLabel(platform.price)}
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

          {managedPlatform && managedPlatformFormState && managedPlatformKeysState && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 py-6">
              <div className="flex max-h-[75vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-[0_30px_80px_rgba(2,6,23,0.6)]">
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 p-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 p-2">
                      <img
                        src={resolvePlatformLogoUrl(
                          managedPlatform.platform.name,
                          managedPlatform.platform.iconUrl,
                        )}
                        alt={managedPlatform.platform.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold text-white">
                        {managedPlatform.platform.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {managedPlatform.stock.available} keys disponíveis
                      </p>
                    </div>
                  </div>

                  <AdminButton
                    type="button"
                    tone="secondary"
                    onClick={closePlatformManagementModal}
                  >
                    Fechar
                  </AdminButton>
                </div>

                <div className="overflow-y-auto p-5">
                  <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
                    <section className="space-y-4">
                      <div className="rounded-[24px] border border-slate-800 bg-slate-900/35 p-4">
                        <div className="max-w-[180px]">
                          <AdminTextField
                            label="Preço"
                            type="text"
                            inputMode="decimal"
                            placeholder="10,00"
                            value={managedPlatformFormState.price}
                            onChange={({ target }) =>
                              updatePlatformFormState(managedPlatform.platform.id, (currentFormState) => ({
                                ...currentFormState,
                                price: sanitizePlatformPrice(target.value),
                              }))
                            }
                          />
                        </div>

                        <div className="mt-3">
                          <AdminToggleField
                            label="Plataforma ativa"
                            checked={managedPlatformFormState.isActive}
                            onChange={(checked) =>
                              updatePlatformFormState(managedPlatform.platform.id, (currentFormState) => ({
                                ...currentFormState,
                                isActive: checked,
                              }))
                            }
                          />
                        </div>

                        <AdminButton
                          type="button"
                          className="mt-3 w-full"
                          disabled={managedPlatformFormState.isSaving}
                          onClick={() => requestPlatformSettingsSave(managedPlatform.platform.id)}
                        >
                          {managedPlatformFormState.isSaving ? "Salvando..." : "Salvar"}
                        </AdminButton>
                      </div>
                    </section>

                    <section className="grid gap-4">
                      {(managedPlatformFormState.error || managedPlatformFormState.success) && (
                        <div className="grid gap-3">
                          {managedPlatformFormState.error && (
                            <AdminNotice>{managedPlatformFormState.error}</AdminNotice>
                          )}
                          {managedPlatformFormState.success && (
                            <AdminNotice tone="success">
                              {managedPlatformFormState.success}
                            </AdminNotice>
                          )}
                        </div>
                      )}

                      <section className="rounded-[24px] border border-slate-800 bg-slate-900/35 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-white">Novas keys</h3>
                            <p className="mt-1 text-xs text-slate-400">Formato XXXX-XXXX-XXXX</p>
                          </div>
                          <AdminButton
                            type="button"
                            disabled={managedPlatformFormState.isAddingKeys || !managedPlatform.hasListing}
                            onClick={() => {
                              void addKeysToPlatform(managedPlatform.platform.id);
                            }}
                          >
                            {managedPlatformFormState.isAddingKeys ? "Adicionando..." : "Adicionar"}
                          </AdminButton>
                        </div>

                        <div className="mt-3 overflow-hidden rounded-[22px] border border-slate-700 bg-slate-950/80">
                          {managedPlatformKeyLineSections.map((gameKeyLineSection, keySectionIndex) => (
                            <div
                              key={keySectionIndex}
                              className={keySectionIndex === 0 ? "" : "border-t border-slate-800"}
                            >
                              <div className="grid xl:grid-cols-3">
                                {Array.from({ length: keyGridColumnCount }, (_unused, keyColumnIndex) => {
                                  const keyColumnLines = gameKeyLineSection.slice(
                                    keyColumnIndex * keyColumnSize,
                                    keyColumnIndex * keyColumnSize + keyColumnSize,
                                  );

                                  return (
                                    <div
                                      key={keyColumnIndex}
                                      className={keyColumnIndex === 0 ? "" : "xl:border-l xl:border-slate-800"}
                                    >
                                      {keyColumnLines.map((keyLineValue, keyLineIndex) => {
                                        const gameKeyLineIndex =
                                          keySectionIndex * keyGridBlockSize +
                                          keyColumnIndex * keyColumnSize +
                                          keyLineIndex;

                                        return (
                                          <div
                                            key={gameKeyLineIndex}
                                            className={keyLineIndex === 0 ? "" : "border-t border-slate-800"}
                                          >
                                            <input
                                              ref={(inputElement) => {
                                                gameKeyInputRefs.current[gameKeyLineIndex] = inputElement;
                                              }}
                                              type="text"
                                              value={keyLineValue}
                                              placeholder={gameKeyLineIndex === 0 ? "AAAA-BBBB-CCCC" : ""}
                                              onChange={({ target }) => {
                                                const nextGameKeyValue = formatGameKeyValue(target.value);

                                                updatePlatformFormState(
                                                  managedPlatform.platform.id,
                                                  (currentFormState) => ({
                                                    ...currentFormState,
                                                    newKeysText: updateGameKeyLineText(
                                                      currentFormState.newKeysText,
                                                      gameKeyLineIndex,
                                                      nextGameKeyValue,
                                                    ),
                                                  }),
                                                );

                                                if (nextGameKeyValue.replace(/[^A-Z0-9]/g, "").length === 12) {
                                                  requestAnimationFrame(() => {
                                                    gameKeyInputRefs.current[gameKeyLineIndex + 1]?.focus();
                                                  });
                                                }
                                              }}
                                              onPaste={(event) => {
                                                const pastedText = event.clipboardData.getData("text");
                                                const pastedKeyValues = getPastedGameKeyValues(pastedText);

                                                event.preventDefault();
                                                updatePlatformFormState(
                                                  managedPlatform.platform.id,
                                                  (currentFormState) => ({
                                                    ...currentFormState,
                                                    newKeysText: pasteGameKeyLineText(
                                                      currentFormState.newKeysText,
                                                      gameKeyLineIndex,
                                                      pastedText,
                                                    ),
                                                  }),
                                                );
                                                requestAnimationFrame(() => {
                                                  gameKeyInputRefs.current[
                                                    gameKeyLineIndex + Math.max(pastedKeyValues.length, 1)
                                                  ]?.focus();
                                                });
                                              }}
                                              className="w-full border-0 bg-transparent px-4 py-4 font-mono text-xs uppercase tracking-[0.14em] text-white outline-none placeholder:text-slate-600"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {!managedPlatform.hasListing && (
                          <p className="mt-3 text-sm text-slate-400">Salve o preço para liberar o estoque.</p>
                        )}
                      </section>

                      <section className="rounded-[24px] border border-slate-800 bg-slate-900/35 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-white">Keys cadastradas</h3>
                            <p className="mt-1 text-xs text-slate-400">
                              {managedPlatformKeysState.meta.total} no estoque
                            </p>
                          </div>
                          <AdminButton
                            type="button"
                            tone="subtleDanger"
                            disabled={
                              managedPlatformKeysState.isRemoving ||
                              managedPlatformKeysState.selectedIds.length === 0
                            }
                            onClick={() => requestSelectedKeysRemoval(managedPlatform.platform.id)}
                          >
                            {managedPlatformKeysState.isRemoving ? "Removendo..." : "Remover selecionadas"}
                          </AdminButton>
                        </div>

                        {managedPlatformKeysState.error && (
                          <div className="mt-3">
                            <AdminNotice>{managedPlatformKeysState.error}</AdminNotice>
                          </div>
                        )}

                        {managedPlatformKeysState.isLoading ? (
                          <p className="mt-3 text-sm text-slate-300">Carregando keys...</p>
                        ) : managedPlatformKeysState.items.length === 0 ? (
                          <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/45 p-4 text-sm text-slate-300">
                            Nenhuma key cadastrada.
                          </p>
                        ) : (
                          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                            {managedPlatformKeysState.items.map((gameKey) => {
                              const canRemove = gameKey.status === "available";

                              return (
                                <label
                                  key={gameKey.id}
                                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/45 p-3"
                                >
                                  <input
                                    type="checkbox"
                                    checked={managedPlatformKeysState.selectedIds.includes(gameKey.id)}
                                    disabled={!canRemove}
                                    onChange={() =>
                                      toggleSelectedKey(managedPlatform.platform.id, gameKey.id)
                                    }
                                  />
                                  <span className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 font-mono text-xs tracking-[0.18em] text-white break-all">
                                    {formatGameKeyValue(gameKey.keyValue)}
                                  </span>
                                  <span className={getKeyStatusBadgeClass(gameKey.status)}>
                                    {gameKey.status}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        <Pagination
                          page={managedPlatformKeysState.page}
                          totalPages={managedPlatformKeysState.meta.totalPages}
                          scrollToTop={false}
                          onPageChange={(page) => {
                            void fetchPlatformKeysPage(managedPlatform.platform.id, page);
                          }}
                        />
                      </section>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          )}

          {pendingConfirmation && confirmationPlatform && (
            <PlatformConfirmModal
              title={
                pendingConfirmation.type === "priceChange"
                  ? "Confirmar novo preço"
                  : "Remover keys selecionadas"
              }
              message={
                pendingConfirmation.type === "priceChange"
                  ? `Esse novo preço será aplicado a todas as keys existentes e futuras de ${confirmationPlatform.platform.name}.`
                  : `${selectedKeysCount} key(s) disponível(is) selecionada(s) será(ão) removida(s) agora.`
              }
              confirmLabel={
                pendingConfirmation.type === "priceChange"
                  ? "Salvar novo preço"
                  : "Remover keys"
              }
              tone={pendingConfirmation.type === "priceChange" ? "primary" : "danger"}
              onCancel={() => setPendingConfirmation(null)}
              onConfirm={confirmPendingAction}
            />
          )}
        </>
      </AdminPageState>
    </AdminLayout>
  );
}












