import { Search, UserRound, ShoppingCart, Heart } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
function NavBar() {
  return (
    <nav className="fixed bg-black/90 top-0 w-full blackdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center gap-8">
        <div>
          <a
            href="/"
            className=" absolute left-3 top-3  hover:text-blue-600 hover:scale-105 transition-all duration-300"
          >
            {" "}
            <img src="logo.png" alt="" />
          </a>
        </div>
        <div className="flex gap-8">
          <a href="/loja" className="hover:text-blue-600 hover:scale-105 transition-all duration-300">
            Loja
          </a>
          <a href="/ofertas" className="hover:text-blue-600 hover:scale-105 transition-all duration-300">
            Ofertas
          </a>

          <a href="/comofunciona" className="hover:text-blue-600 hover:scale-105 transition-all duration-300">
            {" "}
            Como funciona
          </a>
          <a href="/listagem-usuarios" className="hover:text-blue-600 hover:scale-105 transition-all duration-300">
            Teste API
          </a>
        </div>
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-6">
          <a href="#Lupa" className="hover:text-blue-600">
            {" "}
            <Search />
          </a>

          <a href="#favoritos" className="hover:text-blue-600">
            {" "}
            <Heart />
          </a>
          <a href="#loja" className="hover:text-blue-600">
            <ShoppingCart />
          </a>
          <Menu as="div" className="relative inline-block">
            <MenuButton className="hover:text-blue-600 focus:outline-none">
              <UserRound />
            </MenuButton>

            <MenuItems
              transition
              className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-300 shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
              <div className="py-1">
                <MenuItem>
                  <a
                    href="/login"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                  >
                    Login
                  </a>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                  >
                    Configurações
                  </a>
                </MenuItem>
                <MenuItem>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                  >
                    Minhas Keys
                  </a>
                </MenuItem>
                <form action="#" method="POST">
                  <MenuItem>
                    <button
                      type="submit"
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-focus:bg-gray-100 data-focus:text-gray-900 data-focus:outline-hidden"
                    >
                      Sair
                    </button>
                  </MenuItem>
                </form>
              </div>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </nav>
  );
}
export default NavBar;
