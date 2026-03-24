import playLogo from "../../assets/playlogo.png";
import xboxLogo from "../../assets/xbox.png";
import steamLogo from "../../assets/steam.png";
import nintendoLogo from "../../assets/nintendo.png";

export default function Plataforms() {
  return (
    <section className="w-full bg-blue-950 px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-10 text-center text-3xl font-semibold sm:mb-14 sm:text-5xl lg:text-6xl">
          Como resgatar em cada plataforma
        </h1>

        <div className="grid grid-cols-1 gap-5 lg:gap-6">
          <div className="rounded-3xl bg-black p-5 text-left sm:p-7">
            <div className="mb-4 flex items-center gap-3 sm:gap-4">
              <img
                src={playLogo}
                alt="Logo PlayStation"
                className="h-10 w-10 sm:h-15 sm:w-15"
              />
              <h1 className="text-2xl font-semibold sm:text-3xl">
                PlayStation
              </h1>
            </div>
            <h2 className="py-2 text-xl font-medium sm:text-2xl">
              No PlayStation console
            </h2>
            <p className="leading-7 text-gray-200">
              1- Vá para a PlayStation Store <br />
              2- Role até o final da página lateral e selecione "Resgatar
              Códigos" <br />
              3- Digite o código com cuidado e confirme
            </p>
            <h2 className="pt-5 text-xl font-medium sm:text-2xl">
              No site da PlayStation
            </h2>
            <p className="pt-2 leading-7 text-gray-200">
              1- Acesse store.playstation.com e faça login <br />
              2- Clique no avatar e selecione "Resgatar Códigos" <br />
              3- Insira o código e clique em "Resgatar"
            </p>
          </div>

          <div className="rounded-3xl bg-black p-5 text-left sm:p-7">
            <div className="mb-4 flex items-center gap-3 sm:gap-4">
              <img
                src={xboxLogo}
                alt="Logo Xbox"
                className="h-10 w-10 sm:h-12 sm:w-12"
              />
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Xbox (Console ou Microsoft Store)
              </h1>
            </div>
            <h2 className="py-2 text-xl font-medium sm:text-2xl">
              No Xbox console
            </h2>
            <p className="leading-7 text-gray-200">
              1- Pressione o botão Xbox para abrir o guia <br />
              2- Selecione "Store" e depois "Resgatar código" <br />
              3- Digite o código de 25 caracteres e confirme
            </p>
            <h2 className="pt-5 text-xl font-medium sm:text-2xl">
              Na Microsoft Store (PC)
            </h2>
            <p className="pt-2 leading-7 text-gray-200">
              1- Abra a Microsoft Store e faça login <br />
              2- Clique no ícone de menu (três pontos) e selecione "Resgatar
              código" <br />
              3- Cole o código e clique em "Avançar"
            </p>
          </div>

          <div className="rounded-3xl bg-black p-5 text-left sm:p-7">
            <div className="mb-4 flex items-center gap-3 sm:gap-4">
              <img
                src={steamLogo}
                alt="Logo Steam"
                className="h-10 w-10 sm:h-12 sm:w-12"
              />
              <h1 className="text-2xl font-semibold sm:text-3xl">Steam</h1>
            </div>
            <p className="leading-7 text-gray-200">
              1- Abra o cliente Steam e faça login na sua conta <br />
              2- Clique em "Jogos" no menu superior e selecione "Ativar um
              produto no Steam" <br />
              3- Clique em "Avançar" e aceite os termos <br />
              4- Cole o código da key e clique em "Avançar" <br />
              5- O jogo será adicionado à sua biblioteca automaticamente
            </p>
          </div>
          

          <div className="rounded-3xl bg-black p-5 text-left sm:p-7">
            <div className="mb-4 flex items-center gap-3 sm:gap-4">
              <img
                src={nintendoLogo}
                alt="Logo Xbox"
                className="h-10 w-10 sm:h-12 sm:w-12"
              />
              <h1 className="text-2xl font-semibold sm:text-3xl">
            Nintendo Switch
              </h1>
            </div>
            <h2 className="py-2 text-xl font-medium sm:text-2xl">
              No console
            </h2>
            <p className="leading-7 text-gray-200">
       1- Acesse a Nintendo eShop no seu Nintendo Switch

2- Selecione o usuário que deseja usar <br />

3- No menu lateral, role para baixo e selecione "Inserir código" <br />

4- Digite o código da key com cuidado <br />

5- Confirme e o jogo será adicionado automaticamente à sua conta <br />
            </p>
            <h2 className="pt-5 text-xl font-medium sm:text-2xl">
             No site
            </h2>
            <p className="pt-2 leading-7 text-gray-200">
            1- Acesse o site da Nintendo e faça login na sua conta  <br></br>

2- Vá até a opção de resgatar código (Nintendo eShop) <br></br>

3- Insira o código e confirme <br></br>

4- O jogo ficará disponível para download no seu console
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
