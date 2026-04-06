import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import {
  AdminFormActions,
  AdminNotice,
  AdminSideCard,
  AdminTextareaField,
  AdminTextField,
  AdminToggleField,
  adminFormClass,
} from "./adminShared";
import api from "../../services/api";
import { getApiErrorMessage } from "../../services/http";

type GameResponse = { title: string; description: string; longDescription: string; releaseDate: string; coverImageUrl: string; isActive?: boolean };
type GameValues = { title: string; description: string; longDescription: string; releaseDate: string; coverImageUrl: string; isActive: boolean };
const emptyGame: GameValues = { title: "", description: "", longDescription: "", releaseDate: "", coverImageUrl: "", isActive: true };
const textareas = [
  ["description", "Descrição curta", "min-h-24"],
  ["longDescription", "Descrição longa", "min-h-36"],
] as const;
const inputs = [
  ["releaseDate", "Data de lançamento", "date"],
  ["coverImageUrl", "URL da capa", "url"],
] as const;

export default function AdminGameForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [values, setValues] = useState<GameValues>(emptyGame);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchGame = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const { data } = await api.get<GameResponse>(`/games/${id}`);

        setValues({
          title: data.title ?? "",
          description: data.description ?? "",
          longDescription: data.longDescription ?? "",
          releaseDate: data.releaseDate ?? "",
          coverImageUrl: data.coverImageUrl ?? "",
          isActive: data.isActive !== false,
        });
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error, "Não foi possível carregar o jogo."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchGame();
  }, [id]);

  const setField = <Field extends keyof GameValues>(field: Field, value: GameValues[Field]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const saveGame = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      longDescription: values.longDescription.trim(),
      releaseDate: values.releaseDate,
      coverImageUrl: values.coverImageUrl.trim(),
    };

    if (Object.values(payload).some((value) => !String(value).trim())) {
      setErrorMessage("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      if (isEditing) {
        await api.put(`/games/${id}`, { ...payload, isActive: values.isActive });
      } else {
        await api.post("/games", payload);
      }

      void navigate("/admin/games");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível salvar o jogo."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const previewImage = values.coverImageUrl.trim() || "/utils/logo.png";

  return (
    <AdminLayout
      title={isEditing ? "Editar jogo" : "Novo jogo"}
      description="Preencha os dados obrigatórios do jogo. O listing continua sendo cadastrado em uma tela separada."
      backTo="/admin/games"
      backLabel="Voltar para jogos"
    >
      {isLoading ? (
        <p className="text-gray-300">Carregando formulário...</p>
      ) : (
        <form onSubmit={saveGame} className={adminFormClass}>
          <div className="grid gap-5 lg:grid-cols-[1fr,280px]">
            <div className="space-y-5">
              <AdminTextField label="Título" type="text" value={values.title} onChange={({ target }) => setField("title", target.value)} required />
              {textareas.map(([field, label, className]) => (
                <AdminTextareaField
                  key={field}
                  label={label}
                  value={values[field]}
                  onChange={({ target }) => setField(field, target.value)}
                  className={className}
                  required
                />
              ))}

              <div className="grid gap-4 md:grid-cols-2">
                {inputs.map(([field, label, type]) => (
                  <AdminTextField
                    key={field}
                    label={label}
                    type={type}
                    value={values[field]}
                    onChange={({ target }) => setField(field, target.value)}
                    required
                  />
                ))}
              </div>
            </div>

            <AdminSideCard eyebrow="Preview" className="p-4">
              <img
                src={previewImage}
                alt={values.title || "Preview do jogo"}
                className="mt-4 h-56 w-full rounded-[20px] border border-slate-800 object-cover"
              />
              <h2 className="mt-4 text-lg font-semibold text-white">
                {values.title || "Título do jogo"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {values.description || "A descrição curta aparece aqui como apoio visual."}
              </p>
            </AdminSideCard>
          </div>

          {isEditing && (
            <AdminToggleField
              label="Jogo ativo"
              checked={values.isActive}
              onChange={(checked) => setField("isActive", checked)}
            />
          )}

          {errorMessage && <AdminNotice>{errorMessage}</AdminNotice>}

          <AdminFormActions backTo="/admin/games" saving={isSaving} submitLabel="Salvar" />
        </form>
      )}
    </AdminLayout>
  );
}
