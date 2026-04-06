import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import DetailsMid from "../components/loja/DetailsMid";
import Rating from "../components/loja/Rating";

export default function GameDetails() {
  return (
    <div className="nexus-page-shell">
      <NavBar />
      <DetailsMid />
      <Rating />
      <Footer />
    </div>
  );
}
