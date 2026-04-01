import { useEffect, useState } from "react";
import Footer from "../components/globals/Footer";
import Pagination from "../components/globals/Pagination";
import NavBar from "../components/globals/NavBar";
import api from "../services/api";
import {
  getApiErrorMessage,
  type PaginatedResponse,
  type PaginationMeta,
} from "../services/http";

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  createdAt?: string;
  items?: Array<{
    id: number;
    price: number | string;
    listing?: { game?: { title?: string }; platform?: { name?: string } };
  }>;
};

type LibraryItem = {
  id: number;
  gameKey?: { keyValue?: string; soldAt?: string };
  listing?: { game?: { title?: string }; platform?: { name?: string } };
  order?: { orderNumber?: string };
};

const PAGE_SIZE = 5;
const emptyMeta: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

function toMoney(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

export default function MeusPedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [ordersMeta, setOrdersMeta] = useState<PaginationMeta>(emptyMeta);
  const [libraryMeta, setLibraryMeta] = useState<PaginationMeta>(emptyMeta);
  const [ordersPage, setOrdersPage] = useState(1);
  const [libraryPage, setLibraryPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [ordersResponse, libraryResponse] = await Promise.all([
          api.get<PaginatedResponse<Order>>("/orders", {
            params: { page: ordersPage, limit: PAGE_SIZE },
          }),
          api.get<PaginatedResponse<LibraryItem>>("/library/keys", {
            params: { page: libraryPage, limit: PAGE_SIZE },
          }),
        ]);

        setOrders(ordersResponse.data.items ?? []);
        setOrdersMeta(ordersResponse.data.meta ?? emptyMeta);
        setLibrary(libraryResponse.data.items ?? []);
        setLibraryMeta(libraryResponse.data.meta ?? emptyMeta);
      } catch (requestError) {
        setOrders([]);
        setLibrary([]);
        setOrdersMeta(emptyMeta);
        setLibraryMeta(emptyMeta);
        setError(
          getApiErrorMessage(
            requestError,
            "Nao foi possivel carregar pedidos e chaves.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [libraryPage, ordersPage]);

  return (
    <div>
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
        <h1 className="text-3xl font-bold">Meus pedidos</h1>
        {loading && <p className="mt-4 text-gray-300">Carregando...</p>}
        {!loading && error && <p className="mt-4 text-red-300">{error}</p>}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-gray-900 p-5">
              <h2 className="text-xl font-semibold">Pedidos</h2>
              {orders.length === 0 && <p className="mt-3 text-gray-300">Voce ainda nao tem pedidos.</p>}
              <ul className="mt-3 space-y-3">
                {orders.map((order) => (
                  <li key={order.id} className="rounded-lg bg-gray-800 p-3">
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-gray-300">Status: {order.status}</p>
                    <p className="text-sm text-gray-300">Total: {toMoney(Number(order.totalAmount ?? 0))}</p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-300">
                      {(order.items ?? []).map((item) => (
                        <li key={item.id}>
                          {(item.listing?.game?.title || "Jogo") + " - " + (item.listing?.platform?.name || "Plataforma")}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <Pagination
                page={ordersMeta.page}
                totalPages={ordersMeta.totalPages}
                onPageChange={setOrdersPage}
              />
            </section>

            <section className="rounded-xl bg-gray-900 p-5">
              <h2 className="text-xl font-semibold">Historico de chaves entregues</h2>
              {library.length === 0 && <p className="mt-3 text-gray-300">Nenhuma chave entregue ainda.</p>}
              <ul className="mt-3 space-y-3">
                {library.map((item) => (
                  <li key={item.id} className="rounded-lg bg-gray-800 p-3">
                    <p className="font-semibold">{item.listing?.game?.title || "Jogo"}</p>
                    <p className="text-sm text-gray-300">Plataforma: {item.listing?.platform?.name || "-"}</p>
                    <p className="text-sm text-gray-300">Pedido: {item.order?.orderNumber || "-"}</p>
                    <p className="mt-1 break-all rounded bg-black/40 px-2 py-1 text-xs text-emerald-300">
                      KEY: {item.gameKey?.keyValue || "-"}
                    </p>
                  </li>
                ))}
              </ul>
              <Pagination
                page={libraryMeta.page}
                totalPages={libraryMeta.totalPages}
                onPageChange={setLibraryPage}
              />
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
