import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import api from "../services/api";
import { resolveAssetUrl } from "../services/assets";
import { getApiErrorMessage, type PaginatedResponse } from "../services/http";
import type { OfferItem } from "./offers.types";

function toMoney(value: number) {
  return `R$ ${Number(value ?? 0).toFixed(2)}`;
}

function Ofertas() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const { data } = await api.get<PaginatedResponse<OfferItem>>("/promotions", {
          params: {
            page: 1,
            limit: 100,
            activeNow: true,
          },
        });

        setOffers((data.items ?? []).filter((offer) => Boolean(offer.listing)));
      } catch (error) {
        setOffers([]);
        setErrorMessage(
          getApiErrorMessage(error, "Não foi possível carregar as ofertas."),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadOffers();
  }, []);

  return (
    <div className="nexus-page-shell">
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
        <section className="nexus-panel p-6 sm:p-8">
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">
            Curadoria
          </span>
          <h1 className="mt-5 text-4xl font-bold text-white sm:text-5xl">
            Ofertas ativas
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Promoções em destaque com preço original, desconto aplicado e atalho
            direto para o jogo na loja.
          </p>
        </section>

        {isLoading && <p className="mt-6 text-sm text-slate-300">Carregando ofertas...</p>}

        {!isLoading && errorMessage && (
          <p className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {errorMessage}
          </p>
        )}

        {!isLoading && !errorMessage && offers.length === 0 && (
          <section className="nexus-card mt-6 p-6 text-sm leading-7 text-slate-300">
            Nenhuma oferta ativa no momento. Enquanto isso, você pode explorar o
            catálogo completo ou entender o fluxo da loja.

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/loja"
                className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Ir para a loja
              </Link>
              <Link
                to="/comofunciona"
                className="rounded-full border border-slate-700 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500/50 hover:text-white"
              >
                Entender o fluxo
              </Link>
            </div>
          </section>
        )}

        {!isLoading && !errorMessage && offers.length > 0 && (
          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <article
                key={offer.id}
                className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/88 shadow-[0_18px_45px_rgba(2,6,23,0.28)]"
              >
                <img
                  src={resolveAssetUrl(offer.listing?.game?.coverImageUrl)}
                  alt={offer.listing?.game?.title || "Oferta"}
                  className="aspect-[16/9] w-full object-cover"
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/80">
                        {offer.listing?.platform?.name || "Plataforma"}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">
                        {offer.listing?.game?.title || offer.name}
                      </h2>
                    </div>

                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
                      -{offer.discountPercentage}%
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {offer.description || offer.name}
                  </p>

                  <div className="mt-4">
                    <p className="text-sm text-slate-500 line-through">
                      {toMoney(offer.listing?.pricing?.basePrice ?? 0)}
                    </p>
                    <p className="text-3xl font-black text-blue-100">
                      {toMoney(offer.listing?.pricing?.finalPrice ?? 0)}
                    </p>
                  </div>

                  <Link
                    to={`/loja/${offer.listing?.game?.id ?? ""}`}
                    className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Ver na loja
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Ofertas;
