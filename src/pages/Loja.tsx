import { useState } from "react";
import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import Intro from "../components/loja/Intro";
import Filtro from "../components/loja/Filtro";
import Produtos from "../components/loja/Produtos";

function Loja() {
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [categories, setCategories] = useState<string[]>([]);

  return (
    <div>
      <NavBar />
      <Intro />
      <Filtro
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <Produtos
        selectedCategory={selectedCategory}
        onCategoriesLoaded={setCategories}
      />
      <Footer />
    </div>
  );
}
export default Loja;
