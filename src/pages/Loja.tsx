import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import Filtro from "../components/loja/Filtro";
import Produtos from "../components/loja/Produtos";

function Loja() {
  return (
    <div className="nexus-page-shell">
      <NavBar />
      <main className="mx-auto w-full max-w-7xl px-6 pb-10 pt-28 lg:px-2 xl:px-0">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <Filtro />
          <div className="min-w-0 flex-1">
            <Produtos />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
export default Loja;
