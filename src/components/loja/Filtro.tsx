import { FilterIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import type { GamesResponse, ListingsResponse } from "./loja.types";
import {
  collectFilterOptions,
  normalizeText,
  toggleNormalizedValue,
  updateSearchListParam,
} from "./loja.utils";

function Filtro() {
  const [menuAbertoMobile, setMenuAbertoMobile] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedPlatforms = useMemo(
    () => searchParams.getAll("platform").map((value) => value.trim()).filter(Boolean),
    [searchParams],
  );
  const selectedCategories = useMemo(
    () => searchParams.getAll("category").map((value) => value.trim()).filter(Boolean),
    [searchParams],
  );

  const closeMenuAndScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuAbertoMobile(false);
  };

  const updateSelection = (key: string, values: string[]) => {
    setSearchParams(updateSearchListParam(searchParams, key, values));
    closeMenuAndScrollTop();
  };

  const renderSection = (
    title: string,
    options: string[],
    selectedValues: string[],
    key: string,
  ) => {
    const selectedSet = new Set(selectedValues.map(normalizeText));

    return (
      <>
        <h2 className="mb-2 p-4 text-2xl font-bold text-white">{title}</h2>
        <ul className="mb-2">
          <li>
            <button
              type="button"
              onClick={() => updateSelection(key, [])}
              className={
                selectedValues.length === 0
                  ? "font-bold text-blue-300"
                  : "hover:text-white"
              }
            >
              Todas
            </button>
          </li>
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() =>
                  updateSelection(key, toggleNormalizedValue(selectedValues, option))
                }
                className={
                  selectedSet.has(normalizeText(option))
                    ? "font-bold text-blue-300"
                    : "hover:text-white"
                }
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  };

  useEffect(() => {
    const loadFilters = async () => {
      try {
        setLoading(true);

        const [{ data: gamesData }, { data: listingsData }] = await Promise.all([
          api.get<GamesResponse>("/games", { params: { page: 1, limit: 60 } }),
          api.get<ListingsResponse>("/listings", { params: { page: 1, limit: 200 } }),
        ]);

        const options = collectFilterOptions(
          gamesData.items ?? [],
          listingsData.items ?? [],
        );

        setCategories(options.categories);
        setPlatforms(options.platforms);
      } catch {
        setCategories([]);
        setPlatforms([]);
      } finally {
        setLoading(false);
      }
    };

    void loadFilters();
  }, []);

  return (
    <aside className="w-full lg:w-64 lg:shrink-10 lg:self-start lg:sticky lg:top-24">
      <button
        type="button"
        onClick={() => setMenuAbertoMobile((current) => !current)}
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

        {loading && <p className="px-4 text-sm text-slate-400">Carregando...</p>}

        {renderSection("Plataformas", platforms, selectedPlatforms, "platform")}
        {renderSection("Categorias", categories, selectedCategories, "category")}
      </nav>
    </aside>
  );
}

export default Filtro;
