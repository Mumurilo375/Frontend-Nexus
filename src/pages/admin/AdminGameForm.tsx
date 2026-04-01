import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../services/api";
import { getApiErrorMessage } from "../../services/http";

type GameDetails = {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  releaseDate: string;
  coverImageUrl: string;
  isActive?: boolean;
};

type GameFormState = {
  title: string;
  description: string;
  longDescription: string;
  releaseDate: string;
  coverImageUrl: string;
  isActive: boolean;
};

const initialForm: GameFormState = {
  title: "",
  description: "",
  longDescription: "",
  releaseDate: "",
  coverImageUrl: "",
  isActive: true,
};

export default function AdminGameForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [form, setForm] = useState<GameFormState>(initialForm);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadGame = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get<GameDetails>(`/games/${id}`);

        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          longDescription: data.longDescription ?? "",
          releaseDate: data.releaseDate ?? "",
          coverImageUrl: data.coverImageUrl ?? "",
          isActive: data.isActive !== false,
        });
      } catch (requestError) {
        setError(
          getApiErrorMessage(requestError, "Nao foi possivel carregar o jogo."),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadGame();
  }, [id]);

  const handleChange = (field: keyof GameFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.longDescription.trim() ||
      !form.releaseDate.trim() ||
      !form.coverImageUrl.trim()
    ) {
      setError("Preencha todos os campos obrigatorios.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        longDescription: form.longDescription.trim(),
        releaseDate: form.releaseDate,
        coverImageUrl: form.coverImageUrl.trim(),
      };

      if (isEditMode) {
        await api.put(`/games/${id}`, { ...payload, isActive: form.isActive });
      } else {
        await api.post("/games", payload);
      }

      void navigate("/admin/games");
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Nao foi possivel salvar o jogo."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title={isEditMode ? "Editar jogo" : "Novo jogo"}
      description="Preencha os dados obrigatorios do jogo. O listing continua sendo cadastrado em uma tela separada."
      backTo="/admin/games"
      backLabel="Voltar para jogos"
    >
      {loading && <p className="text-gray-300">Carregando formulario...</p>}

      {!loading && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5"
        >
          <label className="text-sm text-gray-200">
            Titulo
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-white"
              required
            />
          </label>

          <label className="text-sm text-gray-200">
            Descricao curta
            <textarea
              value={form.description}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              className="mt-2 min-h-24 w-full rounded-md bg-gray-800 px-3 py-2 text-white"
              required
            />
          </label>

          <label className="text-sm text-gray-200">
            Descricao longa
            <textarea
              value={form.longDescription}
              onChange={(event) =>
                handleChange("longDescription", event.target.value)
              }
              className="mt-2 min-h-32 w-full rounded-md bg-gray-800 px-3 py-2 text-white"
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-gray-200">
              Data de lancamento
              <input
                type="date"
                value={form.releaseDate}
                onChange={(event) =>
                  handleChange("releaseDate", event.target.value)
                }
                className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-white"
                required
              />
            </label>

            <label className="text-sm text-gray-200">
              URL da capa
              <input
                type="url"
                value={form.coverImageUrl}
                onChange={(event) =>
                  handleChange("coverImageUrl", event.target.value)
                }
                className="mt-2 w-full rounded-md bg-gray-800 px-3 py-2 text-white"
                required
              />
            </label>
          </div>

          {isEditMode && (
            <label className="flex items-center gap-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  handleChange("isActive", event.target.checked)
                }
              />
              Jogo ativo
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
              to="/admin/games"
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
