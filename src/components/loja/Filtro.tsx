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
    <aside className="w-full lg:w-64  lg:shrink-10 lg:self-start lg:sticky lg:top-24">
      <button
        type="button"
        onClick={() => setMenuAbertoMobile((valorAtual) => !valorAtual)}
        className="mb-3 w-full rounded-xl bg-black/10 px-4 py-3 text-left font-semibold text-gray-100 lg:hidden"
        aria-expanded={menuAbertoMobile}
        aria-controls="filtro-categorias"
      >
        {menuAbertoMobile ? "Fechar filtros" : "Abrir filtros"}
      </button>

      <nav
        id="filtro-categorias"
        className={`nexus-scrollbar text-semibold max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl bg-black p-4 leading-10 text-gray-300 ${
          menuAbertoMobile ? "block" : "hidden"
        } lg:block`}
      >
        <h2 className="font-bold text-2xl text p-4 mb-1"> 
          <FilterIcon className="inline-block mr-2" />
          Filtros</h2>
        <h2 className="font-bold text-2xl p-4 mb-2">Plataformas</h2>
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
                  ? "font-bold text-blue-600"
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
                    ? "font-bold text-blue-600"
                    : "hover:text-white"
                }
              >
                {platform}
              </button>
            </li>
          ))}
        </ul>
        <h2 className="font-bold text-2xl p-4 mb-1">Categorias</h2>
          
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
                  ? "font-bold text-blue-600"
                  : "hover:text-blue-600"
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
                    ? "font-bold text-blue-600"
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
