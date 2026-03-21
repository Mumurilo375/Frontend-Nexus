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
    <aside>
      <nav className="fixed left-5 top-15 w-60 bg-black overflow-y-auto leading-10 text-center text-semibold text-gray-300">
        {" "}
        <h2 className="font-bold text-2xl  p-4 mb-1">Categorias</h2>
        <ul className="mb-2">
          <li>
            <button
              type="button"
              onClick={() => onSelectCategory("Todas")}
              className={
                selectedCategory === "Todas"
                  ? "font-bold text-white"
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
                onClick={() => onSelectCategory(category)}
                className={
                  selectedCategory === category
                    ? "font-bold text-white"
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
