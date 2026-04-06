import { FilterIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";

type Category = {
  id: number;
  name: string;
};

type Game = {
  id: number;
  categories?: Category[];
};

type GamesResponse = {
  items: Game[];
};

type ListingItem = {
  id: number;
  isActive?: boolean;
  platform?: {
    name?: string;
  };
};

type ListingsResponse = {
  items: ListingItem[];
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

function Filtro() {
  const [menuAbertoMobile, setMenuAbertoMobile] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedPlatforms = useMemo(
    () =>
      searchParams
        .getAll("platform")
        .map((platform) => platform.trim())
        .filter(Boolean),
    [searchParams],
  );

  const selectedCategories = useMemo(
    () =>
      searchParams
        .getAll("category")
        .map((category) => category.trim())
        .filter(Boolean),
    [searchParams],
  );

  const selectedPlatformSet = useMemo(
    () => new Set(selectedPlatforms.map((platform) => normalizeText(platform))),
    [selectedPlatforms],
  );

  const selectedCategorySet = useMemo(
    () =>
      new Set(selectedCategories.map((category) => normalizeText(category))),
    [selectedCategories],
  );

  const irParaTopo = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const carregarFiltros = async () => {
      try {
        setLoading(true);

        const [gamesResponse, listingsResponse] = await Promise.all([
          api.get<GamesResponse>("/games", {
            params: { page: 1, limit: 60 },
          }),
          api.get<ListingsResponse>("/listings", {
            params: { page: 1, limit: 200 },
          }),
        ]);

        const categoryNames = (gamesResponse.data?.items ?? [])
          .flatMap((game) => game.categories ?? [])
          .map((category) => category.name)
          .filter(Boolean);

        const platformNames = (listingsResponse.data?.items ?? [])
          .filter((listing) => listing.isActive !== false)
          .map((listing) => String(listing.platform?.name ?? "").trim())
          .filter(Boolean);

        setCategories(
          Array.from(new Set(categoryNames)).sort((a, b) => a.localeCompare(b)),
        );
        setPlatforms(
          Array.from(new Set(platformNames)).sort((a, b) => a.localeCompare(b)),
        );
      } catch {
        setCategories([]);
        setPlatforms([]);
      } finally {
        setLoading(false);
      }
    };

    void carregarFiltros();
  }, []);

  const atualizarParametroLista = (key: string, values: string[]) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);

    values.forEach((value) => {
      if (value.trim()) {
        next.append(key, value.trim());
      }
    });

    setSearchParams(next);
  };

  const alternarSelecionado = (values: string[], value: string) => {
    const alvo = normalizeText(value);
    const existe = values.some((current) => normalizeText(current) === alvo);

    if (existe) {
      return values.filter((current) => normalizeText(current) !== alvo);
    }

    return [...values, value];
  };

  const selecionarPlataforma = (plataforma: string) => {
    atualizarParametroLista(
      "platform",
      alternarSelecionado(selectedPlatforms, plataforma),
    );
    irParaTopo();
    setMenuAbertoMobile(false);
  };

  const selecionarCategoria = (categoria: string) => {
    atualizarParametroLista(
      "category",
      alternarSelecionado(selectedCategories, categoria),
    );
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

        {loading && (
          <p className="px-4 text-sm text-slate-400">Carregando...</p>
        )}

        <h2 className="mb-2 p-4 text-2xl font-bold text-white">Plataformas</h2>
        <ul className="mb-2">
          <li>
            <button
              type="button"
              onClick={() => {
                atualizarParametroLista("platform", []);
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
                  selectedPlatformSet.has(normalizeText(platform))
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
                atualizarParametroLista("category", []);
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
                  selectedCategorySet.has(normalizeText(category))
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
