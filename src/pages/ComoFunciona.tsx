import Hero from "../components/comofunciona/Hero";
import PerguntasFrequentes from "../components/comofunciona/PerguntasFrequentes";
import Plataforms from "../components/comofunciona/Plataforms";
import Steps from "../components/comofunciona/Steps";
import NavBar from "../components/globals/NavBar";

function ComoFunciona() {
  return (
    <div>
      <NavBar />
      <Hero />
      <Steps />
      <Plataforms />
      <PerguntasFrequentes />
    </div>
  );
}
export default ComoFunciona;
