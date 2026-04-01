import { useState } from "react";
import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import Intro from "../components/loja/Intro";
import Filtro from "../components/loja/Filtro";
import Produtos from "../components/loja/Produtos";

function Loja() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);

  const toggleSelection = (values: string[], value: string) =>
    values.includes(value)
      ? values.filter((current) => current !== value)
      : [...values, value];

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((current) => toggleSelection(current, platform));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) => toggleSelection(current, category));
  };

  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_30%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <NavBar />
      <Intro />
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 pb-10 lg:flex-row lg:items-start lg:px-2 xl:px-0">
        <Filtro
          platforms={platforms}
          selectedPlatforms={selectedPlatforms}
          onTogglePlatform={togglePlatform}
          onClearPlatforms={() => setSelectedPlatforms([])}
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onClearCategories={() => setSelectedCategories([])}
        />
        <div className="min-w-0 flex-1">
          <Produtos
            selectedPlatforms={selectedPlatforms}
            onPlatformsLoaded={setPlatforms}
            selectedCategories={selectedCategories}
            onCategoriesLoaded={setCategories}
          />
        </div>
      </section>
      <Footer />
    </div>
  );
}
export default Loja;
