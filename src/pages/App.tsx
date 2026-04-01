import Footer from "../components/globals/Footer";
import Hero from "../components/globals/Hero";
import Highlights from "../components/globals/Highlights";
import Intro from "../components/globals/Intro";
import NavBar from "../components/globals/NavBar";
import Plataforms from "../components/globals/Plataforms";

function App() {
  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_32%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <NavBar />
      <Hero />
      <Intro />
      <Highlights />
      <Plataforms />
      <Footer />
    </div>
  );
}

export default App;
