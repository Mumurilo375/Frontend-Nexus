import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NavBar from "../components/globals/NavBar";
import Footer from "../components/globals/Footer";
import Filtro from "../components/loja/Filtro";
import Produtos from "../components/loja/Produtos";

function Loja() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlatforms = useMemo(
    () =>
      searchParams
        .getAll("platform")
        .map((platform) => platform.trim())
        .filter(Boolean),
    [searchParams],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] =
    useState<string[]>(initialPlatforms);
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);

  useEffect(() => {
    if (!searchParams.has("q")) {
      return;
    }

    const nextSearch = new URLSearchParams(searchParams);
    nextSearch.delete("q");

    void navigate(
      {
        pathname: "/loja",
        search: nextSearch.toString() ? `?${nextSearch.toString()}` : "",
      },
      { replace: true },
    );
  }, [navigate, searchParams]);

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
    <div className="nexus-page-shell">
      <NavBar />
      <main className="mx-auto w-full max-w-7xl px-6 pb-10 pt-28 lg:px-2 xl:px-0">
        <header className="mb-6 px-1">
          <h1 className="text-3xl font-semibold text-white">Loja</h1>
        </header>

        <section className="flex flex-col gap-6 lg:flex-row lg:items-start">
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
      </main>
      <Footer />
    </div>
  );
}
export default Loja;
