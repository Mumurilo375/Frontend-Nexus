import { Link } from "react-router-dom";
import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";

function Ofertas() {
  return (
    <div className="nexus-page-shell">
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
        <section className="nexus-panel p-6 sm:p-8">
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">
            Curadoria
          </span>
          <h1 className="mt-5 text-4xl font-bold text-white sm:text-5xl">
            Ofertas em breve
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Esta pagina continua temporaria. Enquanto as promocoes reais nao
            entram, o fluxo principal segue na loja e o processo completo fica
            explicado em como funciona.
          </p>

          <p className="nexus-card mt-8 max-w-3xl p-5 text-sm leading-7 text-slate-300">
            Use esta area como atalho: explore o catalogo completo ou veja como
            a compra e o resgate das keys funcionam na demo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
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
      </main>
      <Footer />
    </div>
  );
}

export default Ofertas;
