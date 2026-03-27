import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import Back from "../components/login/Back";
import api from "../services/api";

type CartItem = {
  id: number;
  listing?: {
    price: number | string;
    game?: { title?: string };
    platform?: { name?: string };
  };
};

type CartResponse = { items: CartItem[] };

type OrderResponse = {
  id: number;
  orderNumber: string;
  totalAmount: number | string;
  status: string;
};

type CheckoutCreateResponse = {
  order: OrderResponse;
};

function toMoney(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function getCheckoutErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return String(error.response?.data?.message ?? error.message ?? fallback);
  }

  return fallback;
}

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.listing?.price ?? 0), 0),
    [items],
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get<CartResponse>("/cart");
        setItems(data.items ?? []);
      } catch {
        setItems([]);
        setError("Nao foi possivel carregar o checkout.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const createOrder = async () => {
    try {
      setPlacingOrder(true);
      setError("");
      const { data } = await api.post<CheckoutCreateResponse>("/checkout", {
        paymentMethod,
      });
      setOrder(data.order);
      setItems([]);
      window.dispatchEvent(new Event("nexus:counts-updated"));
    } catch (error: unknown) {
      setError(
        getCheckoutErrorMessage(error, "Nao foi possivel finalizar o pedido."),
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div>
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-4xl px-6 pb-10 pt-28">
        <h1 className="text-3xl font-bold">Resumo do pedido</h1>

        {loading && <p className="mt-4 text-gray-300">Carregando resumo...</p>}

        {!loading && order && (
          <section className="mt-6 rounded-xl bg-emerald-900/30 p-5">
            <h2 className="text-2xl font-semibold">
              {order.status === "paid" ? "Pedido confirmado" : "Pedido criado"}
            </h2>
            <p className="mt-2 text-gray-200">Numero: {order.orderNumber}</p>
            <p className="text-gray-200">
              Total: {toMoney(Number(order.totalAmount ?? 0))}
            </p>

            {order.status === "pending" && (
              <p className="mt-2 text-sm text-gray-300">
                O pedido foi criado, mas ainda nao foi concluido. Se isso for de
                uma compra antiga, voce pode revisar em meus pedidos.
              </p>
            )}

            {order.status === "paid" && (
              <div className="mt-4 flex flex-wrap gap-3">
                <p className="basis-full text-sm text-emerald-200">
                  Compra concluida. Suas keys ja foram liberadas na sua
                  biblioteca.
                </p>
                <Link
                  to="/meus-pedidos"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold"
                >
                  Ver meus pedidos
                </Link>
                <Link
                  to="/loja"
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm"
                >
                  Continuar comprando
                </Link>
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="mt-4 flex gap-3">
                <Link
                  to="/loja"
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm"
                >
                  Voltar para loja
                </Link>
              </div>
            )}
          </section>
        )}

        {!loading && !order && (
          <section className="mt-6 rounded-xl bg-gray-900 p-5">
            {items.length === 0 ? (
              <>
                <p className="text-gray-300">Seu carrinho esta vazio.</p>
                <Link
                  to="/loja"
                  className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm"
                >
                  Ir para loja
                </Link>
              </>
            ) : (
              <>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-md bg-gray-800 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">
                          {item.listing?.game?.title || "Jogo"}
                        </p>
                        <p className="text-sm text-gray-300">
                          {item.listing?.platform?.name || "-"}
                        </p>
                      </div>
                      <p>{toMoney(Number(item.listing?.price ?? 0))}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-lg bg-gray-800 p-3">
                  <p className="font-semibold">Total: {toMoney(subtotal)}</p>
                  <label className="mt-3 block text-sm text-gray-300">
                    Forma de pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as "card" | "pix")
                    }
                    className="mt-1 w-full rounded-md bg-gray-700 px-3 py-2"
                  >
                    <option value="card">Cartao</option>
                    <option value="pix">PIX</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-400">
                    O pedido e confirmado diretamente pela plataforma e as keys
                    sao liberadas logo apos a compra.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void createOrder();
                    }}
                    disabled={placingOrder}
                    className="mt-4 w-full rounded-lg bg-emerald-700 px-4 py-2 font-semibold disabled:opacity-60"
                  >
                    {placingOrder ? "Finalizando..." : "Finalizar pedido"}
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {error && <p className="mt-4 text-red-300">{error}</p>}

        {!order && <Back />}
      </main>
      <Footer />
    </div>
  );
}
