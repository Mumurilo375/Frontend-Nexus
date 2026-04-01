import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../services/api";
import { getApiErrorMessage } from "../../services/http";

type CategoryDetails = {
  id: number;
  name: string;
};

export default function AdminCategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadCategory = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get<CategoryDetails>(`/categories/${id}`);
        setName(data.name ?? "");
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            "Nao foi possivel carregar a categoria.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCategory();
  }, [id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Informe o nome da categoria.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (isEditMode) {
        await api.put(`/categories/${id}`, { name: name.trim() });
      } else {
        await api.post("/categories", { name: name.trim() });
      }

      void navigate("/admin/categories");
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Nao foi possivel salvar a categoria.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title={isEditMode ? "Editar categoria" : "Nova categoria"}
      description="Formulario simples para manter as categorias do projeto."
      backTo="/admin/categories"
      backLabel="Voltar para categorias"
    >
      {loading && <p className="text-gray-300">Carregando formulario...</p>}

      {!loading && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-[28px] border border-slate-800 bg-slate-950/78 p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr,280px]">
            <label className="text-sm text-gray-200">
              Nome
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500/70"
                required
              />
            </label>

            <aside className="rounded-[24px] border border-slate-800 bg-slate-900/55 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/80">
                Estrutura
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Use nomes curtos e claros para manter os filtros da loja e do
                painel mais organizados.
              </p>
            </aside>
          </div>

          {error && (
            <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <Link
              to="/admin/categories"
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
