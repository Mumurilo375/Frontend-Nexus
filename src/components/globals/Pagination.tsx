type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-gray-700 px-4 py-2 text-white transition hover:border-blue-500 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Anterior
      </button>

      <span className="rounded-md border border-gray-800 bg-gray-900 px-4 py-2 text-gray-200">
        Pagina {page} de {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md border border-gray-700 px-4 py-2 text-white transition hover:border-blue-500 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Proxima
      </button>
    </div>
  );
}
