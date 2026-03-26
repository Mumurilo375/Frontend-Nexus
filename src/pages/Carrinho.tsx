import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import api from "../services/api";

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
    () => items.reduce((sum, item) => sum + Number(item.listing?.price ?? 0), 0),
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
      setItems((current) => current.filter((item) => item.listingId !== listingId));
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
    <div>
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
        <h1 className="text-3xl font-bold">Carrinho</h1>

        {loading && <p className="mt-4 text-gray-300">Carregando carrinho...</p>}
        {!loading && error && <p className="mt-4 text-red-300">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="mt-6 rounded-xl bg-gray-900 p-5">
            <p className="text-gray-300">Seu carrinho esta vazio.</p>
            <Link to="/loja" className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm">
              Ir para loja
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-3">
              {items.map((item) => (
                <article key={item.id} className="rounded-xl bg-gray-900 p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.listing?.game?.coverImageUrl || "/logo.png"}
                      alt={item.listing?.game?.title || "Jogo"}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-semibold">{item.listing?.game?.title || "Jogo"}</h2>
                      <p className="text-sm text-gray-300">Plataforma: {item.listing?.platform?.name || "-"}</p>
                      <p className="mt-1 text-sm text-gray-300">Quantidade: 1</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{toMoney(Number(item.listing?.price ?? 0))}</p>
                      <button
                        type="button"
                        onClick={() => {
                          void removeItem(item.listingId);
                        }}
                        disabled={busyListingId !== null}
                        className="mt-2 rounded-md bg-red-700 px-3 py-1 text-sm disabled:opacity-60"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-xl bg-gray-900 p-5">
              <h2 className="text-xl font-semibold">Resumo</h2>
              <p className="mt-3 text-gray-300">Itens: {items.length}</p>
              <p className="text-gray-100">Subtotal: {toMoney(subtotal)}</p>
              <Link to="/checkout" className="mt-4 block rounded-lg bg-emerald-700 px-4 py-2 text-center font-semibold">
                Confirmar pedido
              </Link>
              <button
                type="button"
                onClick={() => {
                  void clearCart();
                }}
                disabled={busyListingId !== null}
                className="mt-2 w-full rounded-lg bg-gray-700 px-4 py-2 text-sm disabled:opacity-60"
              >
                Limpar carrinho
              </button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
