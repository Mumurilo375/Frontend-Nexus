import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  AdminButton,
  AdminLinkButton,
  AdminPageState,
  createEmptyMeta,
} from "./adminShared";
import Pagination from "../../components/globals/Pagination";
import api from "../../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
} from "../../services/http";

type Category = { id: number; name: string };

const PAGE_SIZE = 8;
const emptyPagination = createEmptyMeta(PAGE_SIZE);

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  const fetchCategoriesPage = useCallback(async (page = currentPage) => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const { data } = await api.get<PaginatedResponse<Category>>("/categories", {
        params: { page, limit: PAGE_SIZE },
      });

      setCategories(data.items ?? []);
      setPagination(data.meta ?? emptyPagination);
    } catch (error) {
      setCategories([]);
      setPagination(emptyPagination);
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível carregar as categorias."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    void fetchCategoriesPage();
  }, [fetchCategoriesPage]);

  const removeCategory = async (categoryId: number) => {
    if (!window.confirm("Deseja excluir esta categoria?")) return;

    try {
      setDeletingCategoryId(categoryId);
      setErrorMessage("");
      await api.delete(`/categories/${categoryId}`);

      if (categories.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
        return;
      }

      await fetchCategoriesPage();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Não foi possível excluir a categoria."),
      );
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const totalLabel = `${pagination.total} categoria${
    pagination.total === 1 ? " cadastrada" : "s cadastradas"
  }`;

  return (
    <AdminLayout
      title="Categorias"
      description="CRUD completo de categorias com listagem paginada."
      backTo="/admin"
      backLabel="Voltar ao painel"
      actions={
        <AdminLinkButton to="/admin/categories/new" tone="primary">
          Nova categoria
        </AdminLinkButton>
      }
    >
      <AdminPageState
        loading={isLoading}
        error={errorMessage}
        isEmpty={categories.length === 0}
        loadingText="Carregando categorias..."
        emptyText="Nenhuma categoria cadastrada."
      >
        <>
          <div className="nexus-card p-4">
            <p className="pb-4 text-sm text-slate-300">{totalLabel}</p>
            <div className="overflow-hidden rounded-[24px] border border-slate-800">
              <table className="min-w-full divide-y divide-slate-800 bg-slate-950 text-sm">
                <thead className="bg-slate-900 text-left text-gray-300">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {categories.map(({ id, name }) => (
                    <tr key={id}>
                      <td className="px-4 py-4 text-gray-400">{id}</td>
                      <td className="px-4 py-4 font-medium">{name}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <AdminLinkButton to={`/admin/categories/${id}/edit`} tone="primary">Editar</AdminLinkButton>
                          <AdminButton
                            type="button"
                            tone="danger"
                            disabled={deletingCategoryId === id}
                            onClick={() => { void removeCategory(id); }}
                          >
                            {deletingCategoryId === id ? "Excluindo..." : "Excluir"}
                          </AdminButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      </AdminPageState>
    </AdminLayout>
  );
}
