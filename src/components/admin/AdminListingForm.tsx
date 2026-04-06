import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  AdminFormActions,
  AdminNotice,
  AdminReadonlyField,
  AdminSelectField,
  AdminSideCard,
  AdminTextField,
  AdminToggleField,
  adminFormClass,
} from "./adminShared";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
} from "../../services/http";

type Platform = { id: number; name: string };
type GameResponse = { title: string; platformListings?: Array<{ platform?: Platform }> };
type ListingResponse = { id: number; price: number | string; isActive?: boolean; platform?: { id: number } };
type ListingValues = { platformId: string; price: string; isActive: boolean };
const emptyListing: ListingValues = { platformId: "", price: "", isActive: true };

export default function AdminListingForm() {
  const navigate = useNavigate();
  const { gameId, listingId } = useParams();
  const isEditing = Boolean(listingId);
  const [game, setGame] = useState<GameResponse | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [values, setValues] = useState<ListingValues>(emptyListing);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const setField = <Field extends keyof ListingValues>(field: Field, value: ListingValues[Field]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const usedPlatformIds = new Set(
    (game?.platformListings ?? [])
      .map((listing) => listing.platform?.id)
      .filter((platformId): platformId is number => Boolean(platformId)),
  );
  const selectedPlatformId = Number(values.platformId);
  const freePlatforms = platforms.filter(
    ({ id }) => !usedPlatformIds.has(id) || (isEditing && id === selectedPlatformId),
  );
  const hasNoFreePlatforms = !isEditing && freePlatforms.length === 0;
  const platformNote = hasNoFreePlatforms
    ? "Todas as plataformas já possuem listing para este jogo."
    : "Só aparecem plataformas ainda não usadas neste jogo.";
  const backTo = gameId ? `/admin/games/${gameId}/listings` : "/admin/games";

  useEffect(() => {
    if (!gameId) {
      setErrorMessage("Jogo inválido.");
      setIsLoading(false);
      return;
    }

    const fetchFormData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [gameResponse, platformsResponse] = await Promise.all([
          api.get<GameResponse>(`/games/${gameId}`),
          api.get<PaginatedResponse<Platform>>("/platforms", {
            params: { page: 1, limit: 100 },
          }),
        ]);

        setGame(gameResponse.data);
        setPlatforms(platformsResponse.data.items ?? []);

        if (!listingId) {
          return;
        }

        const { data } = await api.get<ListingResponse>(`/listings/${listingId}`);

        setValues({
          platformId: String(data.platform?.id ?? ""),
          price: String(data.price ?? ""),
          isActive: data.isActive !== false,
        });
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error, "Não foi possível carregar o formulário do listing."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFormData();
  }, [gameId, listingId]);

  const saveListing = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const price = Number(values.price);

    if (!Number.isFinite(price) || price <= 0) {
      setErrorMessage("Informe um preço maior que zero.");
      return;
    }

    if (!isEditing && !values.platformId) {
      setErrorMessage("Selecione a plataforma.");
      return;
    }

    if (hasNoFreePlatforms) {
      setErrorMessage("Este jogo já possui listings em todas as plataformas disponíveis.");
      return;
    }

    if (!gameId) {
      setErrorMessage("Jogo inválido.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      if (isEditing) {
        await api.put(`/listings/${listingId}`, {
          price,
          isActive: values.isActive,
        });
        void navigate(backTo);
      } else {
        const { data } = await api.post<ListingResponse>("/listings", {
          gameId: Number(gameId),
          platformId: Number(values.platformId),
          price,
        });
        void navigate(`/admin/games/${gameId}/listings/${data.id}/keys`);
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível salvar o listing."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const description = !game
    ? "Preencha os dados do listing."
    : isEditing
      ? `Atualize o listing vinculado ao jogo ${game.title}.`
      : `Crie o listing de ${game.title} e abasteça as keys na etapa seguinte.`;

  return (
    <AdminLayout
      title={isEditing ? "Editar listing" : "Novo listing"}
      description={description}
      backTo={backTo}
      backLabel="Voltar para listings"
    >
      {isLoading ? (
        <p className="text-gray-300">Carregando formulário...</p>
      ) : (
        <form onSubmit={saveListing} className={adminFormClass}>
          <div className="grid gap-5 lg:grid-cols-[1fr,280px]">
            <div className="space-y-5">
              <AdminReadonlyField label="Jogo" value={game?.title ?? ""} />
              <AdminSelectField
                label="Plataforma"
                value={values.platformId}
                onChange={({ target }) => setField("platformId", target.value)}
                disabled={isEditing}
                note={!isEditing ? platformNote : undefined}
                className="disabled:text-gray-400"
                required
              >
                <option value="">Selecione</option>
                {freePlatforms.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </AdminSelectField>
              <AdminTextField label="Preço" type="number" min="0.01" step="0.01" value={values.price} onChange={({ target }) => setField("price", target.value)} required />
            </div>

            <AdminSideCard eyebrow="Resumo">
              <h2 className="mt-4 text-lg font-semibold text-white">
                {game?.title || "Jogo selecionado"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {isEditing
                  ? "Ajuste preço e status sem duplicar listings do mesmo jogo."
                  : "Depois de salvar, você vai para a tela de keys para abastecer o estoque."}
              </p>
            </AdminSideCard>
          </div>

          {isEditing && (
            <AdminToggleField
              label="Listing ativo"
              checked={values.isActive}
              onChange={(checked) => setField("isActive", checked)}
            />
          )}

          {errorMessage && <AdminNotice>{errorMessage}</AdminNotice>}

          <AdminFormActions
            backTo={backTo}
            saving={isSaving}
            disabled={hasNoFreePlatforms}
            submitLabel={isEditing ? "Salvar" : "Salvar e gerenciar keys"}
          />
        </form>
      )}
    </AdminLayout>
  );
}
