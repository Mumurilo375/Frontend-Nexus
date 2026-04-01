import Footer from "../components/globals/Footer";
import Hero from "../components/comofunciona/Hero";
import PerguntasFrequentes from "../components/comofunciona/PerguntasFrequentes";
import Plataforms from "../components/comofunciona/Plataforms";
import Steps from "../components/comofunciona/Steps";
import NavBar from "../components/globals/NavBar";

function ComoFunciona() {
  return (
    <div className="bg-slate-950">
      <NavBar />
      <Hero />
      <Steps />
      <Plataforms />
      <PerguntasFrequentes />
      <Footer />
    </div>
  );
}
export default ComoFunciona;
