import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import CarrinhoMid from "../components/Carrinho/CarrinhoMid";

export default function Carrinho() {
  return (
    <div className="nexus-page-shell">
      <NavBar />
      <CarrinhoMid />
      <Footer />
    </div>
  );
}
