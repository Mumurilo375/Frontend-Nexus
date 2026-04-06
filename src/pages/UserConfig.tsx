import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import UserConfigMid from "../components/user/UserConfig";

export default function UserConfig() {
  return (
    <div className="bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.1),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <NavBar />
      <UserConfigMid />
      <Footer />
    </div>
  );
}
