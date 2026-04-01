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
        className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-white transition hover:border-blue-500/60 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Anterior
      </button>

      <span className="rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-2.5 text-gray-200 shadow-[0_18px_45px_rgba(2,6,23,0.28)]">
        Pagina {page} de {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-white transition hover:border-blue-500/60 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Proxima
      </button>
    </div>
  );
}
