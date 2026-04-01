import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/globals/Pagination";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
  type PaginationMeta,
} from "../../services/http";

type CategoryItem = {
  id: number;
  name: string;
};

const PAGE_SIZE = 8;
const emptyMeta: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCategories = useCallback(async (nextPage = page) => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get<PaginatedResponse<CategoryItem>>(
        "/categories",
        {
          params: { page: nextPage, limit: PAGE_SIZE },
        },
      );

      setCategories(data.items ?? []);
      setMeta(data.meta ?? emptyMeta);
    } catch (requestError) {
      setCategories([]);
      setMeta(emptyMeta);
      setError(
        getApiErrorMessage(
          requestError,
          "Nao foi possivel carregar as categorias.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleDelete = async (categoryId: number) => {
    const confirmed = window.confirm("Deseja excluir esta categoria?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(categoryId);
      setError("");
      await api.delete(`/categories/${categoryId}`);

      if (categories.length === 1 && page > 1) {
        setPage((current) => current - 1);
        return;
      }

      await loadCategories();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Nao foi possivel excluir a categoria.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="Categorias"
      description="CRUD completo de categorias com listagem paginada."
      backTo="/admin"
      backLabel="Voltar ao painel"
      actions={
        <Link
          to="/admin/categories/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Nova categoria
        </Link>
      }
    >
      {loading && <p className="text-gray-300">Carregando categorias...</p>}
      {!loading && error && (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!loading && !error && categories.length === 0 && (
        <p className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-gray-300">
          Nenhuma categoria cadastrada.
        </p>
      )}

      {!loading && !error && categories.length > 0 && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="min-w-full divide-y divide-gray-800 bg-gray-900 text-sm">
              <thead className="bg-gray-950 text-left text-gray-300">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3 text-gray-400">{category.id}</td>
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/categories/${category.id}/edit`}
                          className="rounded-md bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-500"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            void handleDelete(category.id);
                          }}
                          disabled={deletingId === category.id}
                          className="rounded-md bg-rose-600 px-3 py-2 text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === category.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </AdminLayout>
  );
}
