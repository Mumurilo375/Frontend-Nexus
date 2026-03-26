import { useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import Intro from "../components/loja/Intro";
import Filtro from "../components/loja/Filtro";
import Produtos from "../components/loja/Produtos";
import { isAdminUser } from "../services/auth";

function Loja() {
  const isAdmin = isAdminUser();
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
    <div>
      <NavBar />
      <Intro />
      {isAdmin && (
        <section className="mx-auto w-full max-w-7xl px-6 lg:px-2 xl:px-0">
          <div className="mb-4 flex justify-end">
            <Link
              to="/admin/games"
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Adicionar e gerenciar games
            </Link>
          </div>
        </section>
      )}
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
