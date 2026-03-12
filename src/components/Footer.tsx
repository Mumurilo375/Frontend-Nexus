import { ShieldCheck } from "lucide-react";

function Footer() {
  return (
    <footer className="grid grid-cols-4 bg-gray-800 w-full p-15 px-6 gap-2">
      <div className="mr-20">
        <h2 className="text-2xl font-bold">Nexus</h2>
        <p className="text-gray-300 text-sm mt-2">
          Descubra novos mundos, encontre grandes jogos e tenha acesso rapido as
          suas keys para ativar e jogar quando quiser
        </p>
      </div>
      <div className="ml-10">
        <h2 className="font-bold">Links Rápidos</h2>
        <a
          href="/loja"
          className="hover:text-blue-300 hover:scale:105 cursor:pointer"
        >
          Loja
        </a>{" "}
        <br />
        <a
          href="/ofertas"
          className="hover:text-blue-300 hover:scale:105 cursor:pointer"
        >
          Ofertas
        </a>{" "}
        <br />
        <a
          href="/comofunciona"
          className="hover:text-blue-300 hover:scale:105 cursor:pointer"
        >
          Como funciona
        </a>{" "}
        <br />
      </div>
      <div className="ml-7">
        <h2 className="font-bold">Suporte</h2>
        <a
          href="#"
          className="hover:text-blue-300 hover:scale:105 cursor:pointer"
        >
          Central de ajuda
        </a>
        <br />
        <a
          href="#"
          className="hover:text-blue-300 hover:scale:105 cursor:pointer"
        >
          Contato
        </a>
        <br />
        <a
          href="#"
          className="hover:text-blue-300 hover:scale:105 cursor:pointer"
        >
          Politica de reembolso
        </a>
        <br />
      </div>
      <div className="ml-10">
        <h2 className="font-bold m">Legal</h2>
        <a
          href="#"
          className="hover:text-blue-300 hover:scale:105 cursor:pointer"
        >
          Termos de uso
        </a>
        <br />
        <a
          href="#"
          className="hover:text-blue-300 hover:scale:105 cursor:pointer"
        >
          Cookies
        </a>
        <br />
        <a
          href="#"
          className="hover:text-blue-300 hover:scale:105 cursor:pointer"
        >
          Privacidade
        </a>
        <br />
      </div>
      <div className="flex py-5 px-5"> <ShieldCheck className="size-5 mr-1"/> Todos os direitos reservados</div>
    </footer>
  );
}
export default Footer;
