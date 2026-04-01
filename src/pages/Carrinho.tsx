import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import api from "../services/api";
import { ArrowRight, ShoppingBag, Trash2Icon } from "lucide-react";

type CartItem = {
  id: number;
  listingId: number;
  listing?: {
    id: number;
    price: number | string;
    game?: { title?: string; coverImageUrl?: string };
    platform?: { name?: string };
  };
};

type CartResponse = {
  items: CartItem[];
  meta?: { subtotal?: number; totalItems?: number };
};

function toMoney(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

export default function Carrinho() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyListingId, setBusyListingId] = useState<number | null>(null);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + Number(item.listing?.price ?? 0), 0),
    [items],
  );

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get<CartResponse>("/cart");
      setItems(data.items ?? []);
    } catch {
      setItems([]);
      setError("Nao foi possivel carregar o carrinho.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();
  }, []);

  const removeItem = async (listingId: number) => {
    try {
      setBusyListingId(listingId);
      await api.delete(`/cart/${listingId}`);
      setItems((current) =>
        current.filter((item) => item.listingId !== listingId),
      );
      window.dispatchEvent(new Event("nexus:counts-updated"));
    } finally {
      setBusyListingId(null);
    }
  };

  const clearCart = async () => {
    try {
      setBusyListingId(-1);
      await api.delete("/cart");
      setItems([]);
      window.dispatchEvent(new Event("nexus:counts-updated"));
    } finally {
      setBusyListingId(null);
    }
  };

  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.1),_transparent_30%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
        <div className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.4)]">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200/80">
                Checkout
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">Carrinho</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Revise os itens antes de seguir para o pagamento. O fluxo foi
                simplificado para a demo, mas a experiencia continua limpa e
                direta.
              </p>
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </div>
          </div>

          {loading && <p className="mt-6 text-gray-300">Carregando carrinho...</p>}
          {!loading && error && (
            <p className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="mt-6 rounded-[28px] border border-slate-800 bg-slate-900/55 p-6">
              <p className="text-gray-300">Seu carrinho esta vazio.</p>
              <Link
                to="/loja"
                className="mt-4 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Ir para loja
              </Link>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <section className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[28px] border border-slate-800 bg-slate-900/55 p-5 shadow-[0_18px_45px_rgba(2,6,23,0.26)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <img
                        src={item.listing?.game?.coverImageUrl || "/logo.png"}
                        alt={item.listing?.game?.title || "Jogo"}
                        className="h-24 w-24 rounded-2xl border border-slate-800 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="truncate text-xl font-semibold text-white">
                            {item.listing?.game?.title || "Jogo"}
                          </h2>
                          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-100">
                            {item.listing?.platform?.name || "Sem plataforma"}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          Entrega automatica na biblioteca apos a confirmacao do
                          pedido.
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                        <p className="text-2xl font-semibold text-white">
                          {toMoney(Number(item.listing?.price ?? 0))}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            void removeItem(item.listingId);
                          }}
                          disabled={busyListingId !== null}
                          className="mt-0 inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-rose-500/50 hover:text-rose-200 disabled:opacity-60 sm:mt-4"
                        >
                          <Trash2Icon className="h-4 w-4" />
                          Remover
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              <aside className="h-fit rounded-[28px] border border-slate-800 bg-slate-900/60 p-6 lg:sticky lg:top-28">
                <h2 className="text-xl font-semibold text-white">Resumo</h2>
                <div className="mt-5 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/85 p-4 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Itens</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold text-white">
                    <span>Subtotal</span>
                    <span>{toMoney(subtotal)}</span>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-6 text-slate-400">
                  No checkout voce escolhe a forma de pagamento fake e recebe as
                  keys na biblioteca logo apos concluir o pedido.
                </p>
                <Link
                  to="/loja"
                  className="group mt-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-blue-500/50 hover:text-white"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Continuar comprando
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/checkout"
                  className="mt-3 block rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Ir para pagamento
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    void clearCart();
                  }}
                  disabled={busyListingId !== null}
                  className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:border-slate-500 disabled:opacity-60"
                >
                  Limpar carrinho
                </button>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
