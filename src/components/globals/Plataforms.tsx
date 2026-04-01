import { useState } from "react";
import playstationIcon from "../../assets/playstation.png";
import xboxIcon from "../../assets/xbox.png";
import nintendoIcon from "../../assets/nintendo.png";
import SteamIcon from "../../assets/steam.png";

const PlaystationConsole = "/plataforms/playstationConsole.png";
const XboxConsole = "/plataforms/xboxConsole.png";
const NintendoConsole = "/plataforms/nintendoconsole.png";
const PcConsole = "/plataforms/computador.png";

export default function Plataforms() {
  const plataforms = [
    {
      id: "PlayStation",
      icon: playstationIcon,
      consoleImage: PlaystationConsole,
    },
    {
      id: "Xbox",
      icon: xboxIcon,
      consoleImage: XboxConsole,
    },
    {
      id: "Nintendo Switch",
      icon: nintendoIcon,
      consoleImage: NintendoConsole,
    },
    {
      id: "Steam",
      icon: SteamIcon,
      consoleImage: PcConsole,
    },
  ];
  const [selected, setSelected] = useState(plataforms[0].id);
  const selectedPlataform =
    plataforms.find((plataform) => plataform.id === selected) || plataforms[0];
  return (
    <section
      id="plataforms"
      className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_35%),linear-gradient(180deg,#020617_0%,#030712_100%)] px-8 py-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-white mb:text-6xl">
            Escolha sua plataforma
          </h2>
          <p className="mb-4 text-xl text-slate-400">
            4 plataformas para jogar{" "}
          </p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-3xl rounded-[32px] border border-slate-800 bg-slate-950/78 p-6 shadow-[0_18px_45px_rgba(2,6,23,0.3)]">
            <div className="relative flex min-h-70 items-center justify-center">
              <img
                src={selectedPlataform.consoleImage}
                alt="PlataformIcon"
                className="max-w-full max-h-100 mx-auto"
              />
            </div>
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <div className="inline-block rounded-full border border-slate-700 bg-slate-950/70 px-8 py-4 backdrop-blur-md">
                <h3 className="text-2xl font-semibold text-white">
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
                className={`relative transition-all duration-300 ${
                  selected === plataform.id ? "scale-110" : "scale-100"
                }`}
              >
                <div
                  className={`h-16 w-16 overflow-hidden rounded-full border p-1 shadow-lg ${
                    selected === plataform.id
                      ? "border-blue-400 bg-blue-500/10"
                      : "border-slate-700 bg-slate-950/80"
                  }`}
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
