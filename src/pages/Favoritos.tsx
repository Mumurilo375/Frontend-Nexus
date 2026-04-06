import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import FavoritosMid from "../components/user/Favoritos";

function Favoritos() {
  return (
    <div className="bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.1),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <NavBar />
      <FavoritosMid />
      <Footer />
    </div>
  );
}

export default Favoritos;
