import { Link } from "react-router-dom";
import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";

const highlightCards = [
  {
    title: "Selecoes em destaque",
    description:
      "Uma curadoria visual com jogos que combinam bem com a proposta da loja.",
  },
  {
    title: "Combos por plataforma",
    description:
      "Espaco ideal para destacar oportunidades da Steam, Xbox e PlayStation.",
  },
  {
    title: "Campanhas sazonais",
    description:
      "Aqui podem entrar banners de ferias, fim de semana ou promocoes especiais.",
  },
];

function Ofertas() {
  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_35%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
        <section className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.4)] sm:p-8">
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">
            Curadoria
          </span>
          <h1 className="mt-5 text-4xl font-bold text-white sm:text-5xl">
            Pagina de ofertas em preparacao
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Esta area foi transformada em uma vitrine mais coerente com a loja.
            Mesmo sem promocoes reais, ela ja comunica como o Nexus poderia
            destacar campanhas, colecoes e oportunidades de compra.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {highlightCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[28px] border border-slate-800 bg-slate-900/60 p-5"
              >
                <h2 className="text-xl font-semibold text-white">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {card.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/loja"
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Ir para a loja
            </Link>
            <Link
              to="/como-funciona"
              className="rounded-full border border-slate-700 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500/50 hover:text-white"
            >
              Entender o fluxo
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Ofertas;
