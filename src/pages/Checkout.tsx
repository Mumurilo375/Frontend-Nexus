import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import CheckoutMid from "../components/user/CheckoutMid";

export default function Checkout() {
  return (
    <div className="nexus-page-shell">
      <NavBar />
      <CheckoutMid />
      <Footer />
    </div>
  );
}
