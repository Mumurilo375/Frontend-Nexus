import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!gameId) {
      setError("Jogo invalido.");
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
            "Nao foi possivel carregar o formulario do listing.",
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
      setError("Informe um preco maior que zero.");
      return;
    }

    if (!isEditMode && !form.platformId) {
      setError("Selecione a plataforma.");
      return;
    }

    if (!gameId) {
      setError("Jogo invalido.");
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
      } else {
        await api.post("/listings", {
          gameId: Number(gameId),
          platformId: Number(form.platformId),
          price: parsedPrice,
        });
      }

      void navigate(`/admin/games/${gameId}/listings`);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Nao foi possivel salvar o listing.",
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
          ? `Listing vinculado ao jogo ${game.title}.`
          : "Preencha os dados do listing."
      }
      backTo={gameId ? `/admin/games/${gameId}/listings` : "/admin/games"}
      backLabel="Voltar para listings"
    >
      {loading && <p className="text-gray-300">Carregando formulario...</p>}

      {!loading && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5"
        >
          <label className="text-sm text-gray-200">
            Jogo
            <input
              type="text"
              value={game?.title ?? ""}
              readOnly
              disabled
              className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-gray-400"
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
              className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-white disabled:text-gray-400"
              required
            >
              <option value="">Selecione</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-200">
            Preco
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
              className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-white"
              required
            />
          </label>

          {isEditMode && (
            <label className="flex items-center gap-3 text-sm text-gray-200">
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
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <Link
              to={gameId ? `/admin/games/${gameId}/listings` : "/admin/games"}
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 transition hover:border-gray-500"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
