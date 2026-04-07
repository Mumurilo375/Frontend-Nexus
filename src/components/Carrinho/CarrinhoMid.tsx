import { Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import nintendoLogo from "../../assets/nintendo.png";
import playstationLogo from "../../assets/playlogo.png";
import steamLogo from "../../assets/steam.png";
import xboxLogo from "../../assets/xbox.png";
import api from "../../services/api";
import { resolveAssetUrl } from "../../services/assets";

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

const platformLogoByName: Record<string, string> = {
  steam: steamLogo,
  playstation: playstationLogo,
  xbox: xboxLogo,
  "nintendo switch": nintendoLogo,
};

function toMoney(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function getPlatformLogo(platformName?: string) {
  const key = String(platformName ?? "")
    .trim()
    .toLowerCase();
  return platformLogoByName[key] || "/logo.png";
}

export default function CarrinhoMid() {
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
      setError("Não foi possível carregar o carrinho.");
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
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
      <div className="nexus-panel p-6">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 md:flex-row md:items-end md:justify-between">
          <h1 className="text-3xl font-bold text-white">Carrinho</h1>
          <div className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </div>
        </div>

        {loading && (
          <p className="mt-6 text-gray-300">Carregando carrinho...</p>
        )}
        {!loading && error && (
          <p className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="nexus-card mt-6 p-6">
            <p className="text-gray-300">Seu carrinho está vazio.</p>
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
                <article key={item.id} className="nexus-card p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img
                      src={resolveAssetUrl(item.listing?.game?.coverImageUrl)}
                      alt={item.listing?.game?.title || "Jogo"}
                      className="h-24 w-24 rounded-2xl border border-slate-800 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-xl font-semibold text-white">
                          {item.listing?.game?.title || "Jogo"}
                        </h2>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-950/90 p-1.5">
                          <img
                            src={getPlatformLogo(item.listing?.platform?.name)}
                            alt={item.listing?.platform?.name || "Plataforma"}
                            title={item.listing?.platform?.name || "Plataforma"}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
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

            <aside className="nexus-card h-fit p-6 lg:sticky lg:top-28">
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
              <Link
                to="/loja"
                className="mt-5 flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
              >
                Voltar para loja
              </Link>
              <Link
                to="/checkout"
                className="mt-3 block rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Finalizar compra
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
  );
}
