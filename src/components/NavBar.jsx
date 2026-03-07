import {
  
  Search, UserRound, ShoppingCart, Library, Heart
} from "lucide-react";
function NavBar() {
  return (
    <nav className="fixed bg-black/90 top-0 w-full blackdrop-blur-md z-50">
        
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center gap-8">
          <div>
            <a href="#Logo" className=" absolute left-3 top-3  hover:text-blue-600"> <img src="logo.png" alt="" /></a>
          </div>
          <div className="flex gap-8">
            <a href="#inicio" className="hover:text-blue-600">Inicio</a>
            <a href="#loja" className="hover:text-blue-600">Loja</a>
            <a href="#biblioteca" className="hover:text-blue-600">  Biblioteca</a>
          </div>
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 gap-10">
            <a href="#Lupa" className="hover:text-blue-600"> <Search/></a>
            <a href="#perfil" className="hover:text-blue-600"> <UserRound/></a>
              <a href="#favoritos" className="hover:text-blue-600"> <Heart/></a>
            <a href="#loja" className="hover:text-blue-600"><ShoppingCart/></a>
            <a href="#carrinho" className="hover:text-blue-600"></a>
          </div>
      </div>
    </nav>
    
    
  );
}
export default NavBar;
