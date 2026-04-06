import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import MeusPedidosMid from "../components/user/MeusPedidosMid";

export default function MeusPedidos() {
  return (
    <div className="nexus-page-shell">
      <NavBar />
      <MeusPedidosMid />
      <Footer />
    </div>
  );
}
