import { FilterIcon } from "lucide-react";
import { useState } from "react";

type FiltroProps = {
  platforms: string[];
  selectedPlatforms: string[];
  onTogglePlatform: (platform: string) => void;
  onClearPlatforms: () => void;
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onClearCategories: () => void;
};

function Filtro({
  platforms,
  selectedPlatforms,
  onTogglePlatform,
  onClearPlatforms,
  categories,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
}: FiltroProps) {
  const [menuAbertoMobile, setMenuAbertoMobile] = useState(false);

  const irParaTopo = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selecionarPlataforma = (plataforma: string) => {
    onTogglePlatform(plataforma);
    irParaTopo();
    setMenuAbertoMobile(false);
  };

  const selecionarCategoria = (categoria: string) => {
    onToggleCategory(categoria);
    irParaTopo();
    setMenuAbertoMobile(false);
  };

  return (
    <aside className="w-full lg:w-64 lg:shrink-10 lg:self-start lg:sticky lg:top-24">
      <button
        type="button"
        onClick={() => setMenuAbertoMobile((valorAtual) => !valorAtual)}
        className="mb-3 w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-left font-semibold text-gray-100 lg:hidden"
        aria-expanded={menuAbertoMobile}
        aria-controls="filtro-categorias"
      >
        {menuAbertoMobile ? "Fechar filtros" : "Abrir filtros"}
      </button>

      <nav
        id="filtro-categorias"
        className={`nexus-card nexus-scrollbar max-h-[calc(100vh-7rem)] overflow-y-auto p-5 leading-10 text-gray-300 ${
          menuAbertoMobile ? "block" : "hidden"
        } lg:block`}
      >
        <h2 className="mb-1 p-4 text-2xl font-bold text-white">
          <FilterIcon className="mr-2 inline-block" />
          Filtros
        </h2>
        <h2 className="mb-2 p-4 text-2xl font-bold text-white">Plataformas</h2>
        <ul className="mb-2">
          <li>
            <button
              type="button"
              onClick={() => {
                onClearPlatforms();
                irParaTopo();
                setMenuAbertoMobile(false);
              }}
              className={
                selectedPlatforms.length === 0
                  ? "font-bold text-blue-300"
                  : "hover:text-white"
              }
            >
              Todas
            </button>
          </li>
          {platforms.map((platform) => (
            <li key={platform}>
              <button
                type="button"
                onClick={() => selecionarPlataforma(platform)}
                className={
                  selectedPlatforms.includes(platform)
                    ? "font-bold text-blue-300"
                    : "hover:text-white"
                }
              >
                {platform}
              </button>
            </li>
          ))}
        </ul>
        <h2 className="mb-1 p-4 text-2xl font-bold text-white">Categorias</h2>

        <ul className="mb-2">
          <li>
            <button
              type="button"
              onClick={() => {
                onClearCategories();
                irParaTopo();
                setMenuAbertoMobile(false);
              }}
              className={
                selectedCategories.length === 0
                  ? "font-bold text-blue-300"
                  : "hover:text-white"
              }
            >
              Todas
            </button>
          </li>
          {categories.map((category) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => selecionarCategoria(category)}
                className={
                  selectedCategories.includes(category)
                    ? "font-bold text-blue-300"
                    : "hover:text-white"
                }
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
export default Filtro;
