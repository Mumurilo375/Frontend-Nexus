import { Heart, ShieldCheck } from "lucide-react";
import React from "react";
import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import Intro from "../components/loja/Intro";
import Filtro from "../components/loja/Filtro";
import Produtos from "../components/loja/Produtos";

function Loja() {
  return (
    <div>
      <NavBar />
      <Intro />
      <Filtro />
      <Produtos />
      <Footer />
    </div>
  );
}
export default Loja;
