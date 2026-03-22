type FiltroProps = {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

function Filtro({
  categories,
  selectedCategory,
  onSelectCategory,
}: FiltroProps) {
  return (
    <aside className="w-full lg:w-64 lg:shrink-0 left-0">
      <nav className="text-semibold sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl bg-black p-4 leading-10 text-gray-300">
        <h2 className="font-bold text-2xl  p-4 mb-1">Categorias</h2>
        <ul className="mb-2">
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory("Todas")}
              className={
                selectedCategory === "Todas"
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
                onClick={() => onSelectCategory(category)}
                className={
                  selectedCategory === category
                    ? "font-bold text-blue-600"
                    : "hover:text-white"
                }
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
        <h2 className="font-bold text-2xl  p-4 mb-2">Plataformas</h2>
        <ul>
          <li>
            <a href="#">Playstation</a>
          </li>
          <li>
            <a href="#">Xbox</a>
          </li>
          <li>
            <a href="#">Nintendo</a>
          </li>
          <li>
            <a href="#">PC</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
export default Filtro;
