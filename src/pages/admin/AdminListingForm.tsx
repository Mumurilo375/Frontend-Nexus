import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
} from "../../services/http";

type GameDetails = {
  id: number;
  title: string;
  platformListings?: Array<{
    id: number;
    platform?: Platform;
  }>;
};

type Platform = {
  id: number;
  name: string;
};

type ListingDetails = {
  id: number;
  price: number | string;
  isActive?: boolean;
  platform?: Platform;
};

type ListingFormState = {
  platformId: string;
  price: string;
  isActive: boolean;
};

const initialForm: ListingFormState = {
  platformId: "",
  price: "",
  isActive: true,
};
const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500/70";

export default function AdminListingForm() {
  const navigate = useNavigate();
  const { gameId, listingId } = useParams();
  const isEditMode = Boolean(listingId);
  const [game, setGame] = useState<GameDetails | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [form, setForm] = useState<ListingFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availablePlatforms = useMemo(() => {
    const usedPlatformIds = new Set(
      (game?.platformListings ?? [])
        .map((listing) => listing.platform?.id)
        .filter((platformId): platformId is number => Boolean(platformId)),
    );

    if (isEditMode) {
      const currentPlatformId = Number(form.platformId);

      return platforms.filter(
        (platform) =>
          !usedPlatformIds.has(platform.id) || platform.id === currentPlatformId,
      );
    }

    return platforms.filter((platform) => !usedPlatformIds.has(platform.id));
  }, [form.platformId, game?.platformListings, isEditMode, platforms]);

  useEffect(() => {
    if (!gameId) {
      setError("Jogo inválido.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const requests = [
          api.get<GameDetails>(`/games/${gameId}`),
          api.get<PaginatedResponse<Platform>>("/platforms", {
            params: { page: 1, limit: 100 },
          }),
        ] as const;

        const [gameResponse, platformsResponse] = await Promise.all(requests);

        setGame(gameResponse.data);
        setPlatforms(platformsResponse.data.items ?? []);

        if (!listingId) {
          return;
        }

        const { data } = await api.get<ListingDetails>(`/listings/${listingId}`);

        setForm({
          platformId: String(data.platform?.id ?? ""),
          price: String(data.price ?? ""),
          isActive: data.isActive !== false,
        });
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            "Não foi possível carregar o formulário do listing.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [gameId, listingId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedPrice = Number(form.price);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Informe um preço maior que zero.");
      return;
    }

    if (!isEditMode && !form.platformId) {
      setError("Selecione a plataforma.");
      return;
    }

    if (!isEditMode && availablePlatforms.length === 0) {
      setError("Este jogo já possui listings em todas as plataformas disponíveis.");
      return;
    }

    if (!gameId) {
      setError("Jogo inválido.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (isEditMode) {
        await api.put(`/listings/${listingId}`, {
          price: parsedPrice,
          isActive: form.isActive,
        });
        void navigate(`/admin/games/${gameId}/listings`);
      } else {
        const { data } = await api.post<ListingDetails>("/listings", {
          gameId: Number(gameId),
          platformId: Number(form.platformId),
          price: parsedPrice,
        });
        void navigate(`/admin/games/${gameId}/listings/${data.id}/keys`);
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível salvar o listing.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title={isEditMode ? "Editar listing" : "Novo listing"}
      description={
        game
          ? isEditMode
            ? `Atualize o listing vinculado ao jogo ${game.title}.`
            : `Crie o listing de ${game.title} e abasteça as keys na etapa seguinte.`
          : "Preencha os dados do listing."
      }
      backTo={gameId ? `/admin/games/${gameId}/listings` : "/admin/games"}
      backLabel="Voltar para listings"
    >
      {loading && <p className="text-gray-300">Carregando formulário...</p>}

      {!loading && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-[28px] border border-slate-800 bg-slate-950/78 p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr,280px]">
            <div className="space-y-5">
              <label className="text-sm text-gray-200">
                Jogo
                <input
                  type="text"
                  value={game?.title ?? ""}
                  readOnly
                  disabled
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-400"
                />
              </label>

              <label className="text-sm text-gray-200">
                Plataforma
                <select
                  value={form.platformId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      platformId: event.target.value,
                    }))
                  }
                  disabled={isEditMode}
                  className={`${inputClass} disabled:text-gray-400`}
                  required
                >
                  <option value="">Selecione</option>
                  {availablePlatforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
                {!isEditMode && availablePlatforms.length === 0 && (
                  <p className="mt-2 text-xs text-amber-300">
                    Todas as plataformas já possuem listing para este jogo.
                  </p>
                )}
                {!isEditMode && availablePlatforms.length > 0 && (
                  <p className="mt-2 text-xs text-slate-400">
                    Só aparecem plataformas ainda não usadas neste jogo.
                  </p>
                )}
              </label>

              <label className="text-sm text-gray-200">
                Preço
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  className={inputClass}
                  required
                />
              </label>
            </div>

            <aside className="rounded-[24px] border border-slate-800 bg-slate-900/55 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/80">
                Resumo
              </p>
              <h2 className="mt-4 text-lg font-semibold text-white">
                {game?.title || "Jogo selecionado"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {isEditMode
                  ? "Ajuste preço e status sem duplicar listings do mesmo jogo."
                  : "Depois de salvar, você vai para a tela de keys para abastecer o estoque."}
              </p>
            </aside>
          </div>

          {isEditMode && (
            <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Listing ativo
            </label>
          )}

          {error && (
            <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || (!isEditMode && availablePlatforms.length === 0)}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Salvando..."
                : isEditMode
                  ? "Salvar"
                  : "Salvar e gerenciar keys"}
            </button>
            <Link
              to={gameId ? `/admin/games/${gameId}/listings` : "/admin/games"}
              className="rounded-full border border-slate-700 bg-slate-950 px-5 py-2.5 text-sm text-gray-200 transition hover:border-blue-500/40 hover:text-white"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
