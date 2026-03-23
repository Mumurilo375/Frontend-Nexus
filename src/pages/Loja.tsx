import { useState } from "react";
import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import Intro from "../components/loja/Intro";
import Filtro from "../components/loja/Filtro";
import Produtos from "../components/loja/Produtos";

function Loja() {
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedPlatform, setSelectedPlatform] = useState("Todas");
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);

  return (
    <div>
      <NavBar />
      <Intro />
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 pb-10 lg:flex-row lg:items-start lg:px-2 xl:px-0">
        <Filtro
          platforms={platforms}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <div className="min-w-0 flex-1">
          <Produtos
            selectedPlatform={selectedPlatform}
            onPlatformsLoaded={setPlatforms}
            selectedCategory={selectedCategory}
            onCategoriesLoaded={setCategories}
          />
        </div>
      </section>
      <Footer />
    </div>
  );
}
export default Loja;
