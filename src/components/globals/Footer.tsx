import { Link } from "react-router-dom";

function Footer() {
  const supportItems = [
    "Central de ajuda",
    "Contato",
    "Politica de reembolso",
  ];
  const legalItems = ["Termos de uso", "Cookies", "Privacidade"];

  return (
    <footer className="grid w-full gap-8 bg-gray-800 px-6 py-12 sm:grid-cols-2 xl:grid-cols-4">
      <div className="max-w-sm">
        <h2 className="text-2xl font-bold">Nexus</h2>
        <p className="text-gray-300 text-sm mt-2">
          Descubra novos mundos, encontre grandes jogos e tenha acesso rapido as
          suas keys para ativar e jogar quando quiser
        </p>
      </div>
      <div>
        <h2 className="font-bold">Links Rápidos</h2>
        <Link
          to="/loja"
          className="mt-2 block transition hover:text-blue-300 hover:scale-105"
        >
          Loja
        </Link>
        <Link
          to="/ofertas"
          className="block transition hover:text-blue-300 hover:scale-105"
        >
          Ofertas
        </Link>
        <Link
          to="/comofunciona"
          className="block transition hover:text-blue-300 hover:scale-105"
        >
          Como funciona
        </Link>
      </div>
      <div>
        <h2 className="font-bold">Suporte</h2>
        {supportItems.map((item) => (
          <span key={item} className="mt-2 block text-gray-300">
            {item}
          </span>
        ))}
      </div>
      <div>
        <h2 className="font-bold">Legal</h2>
        {legalItems.map((item) => (
          <span key={item} className="mt-2 block text-gray-300">
            {item}
          </span>
        ))}
      </div>
    </footer>
  );
}
export default Footer;
