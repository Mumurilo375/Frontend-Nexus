import { useState } from "react";
import playstationIcon from "../../assets/playstation.png";
import xboxIcon from "../../assets/xbox.png";
import nintendoIcon from "../../assets/nintendo.png";
import pcIcon from "../../assets/pc.png";

const PlaystationConsole = "/plataforms/playstationConsole.png";
const XboxConsole = "/plataforms/xboxConsole.png";
const NintendoConsole = "/plataforms/nintendoconsole.png";
const PcConsole = "/plataforms/computador.png";

export default function Plataforms() {
  const plataforms = [
    {
      id: "PlayStation 4 e 5",
      icon: playstationIcon,
      consoleImage: PlaystationConsole,
      color: "bg-blue-900",
    },
    {
      id: "Xbox Series X",
      icon: xboxIcon,
      consoleImage: XboxConsole,
      color: "bg-green-900",
    },
    {
      id: "Nintendo Switch",
      icon: nintendoIcon,
      consoleImage: NintendoConsole,
      color: "bg-red-900",
    },
    {
      id: "PC",
      icon: pcIcon,
      consoleImage: PcConsole,
      color: "bg-gray-300",
    },
  ];
  const [selected, setSelected] = useState(plataforms[0].id);
  const selectedPlataform =
    plataforms.find((plataform) => plataform.id === selected) || plataforms[0];
  return (
    <section id="plataforms" className="bg-black py-15 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl mb:text-6xl font-bold mb-4f">
            Escolha sua plataforma
          </h2>
          <p className="text-xl text-gray-400 mb-4">
            4 plataformas para jogar{" "}
          </p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-3xl">
            <div className="relative flex itens-center  justify-center min-h-70">
              <img
                src={selectedPlataform.consoleImage}
                alt="PlataformIcon"
                className="max-w-full max-h-100 mx-auto"
              />
            </div>
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <div className="px-8 py-4 rounded-full bg-black/40 backdrop-blur-md inline-block ">
                <h3 className="text-2xl font-semibold">
                  {selectedPlataform.id}
                </h3>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {plataforms.map((plataform) => {
            return (
              <button
                key={plataform.id}
                onClick={() => setSelected(plataform.id)}
                className={`relative transition-all duration-300${
                  selected === plataform.id ? "scale-110" : "scale-100"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full overflow-hidden p-1  hover:scale-105 border-4 ${plataform.color} ${selected === plataform.id ? "border-white" : "border-gray-500"} `}
                >
                  <img
                    src={plataform.icon}
                    alt={plataform.id}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
