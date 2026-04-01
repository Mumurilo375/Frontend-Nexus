import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PlaystationConsole = "/plataforms/playstationConsole.png";
const XboxConsole = "/plataforms/xboxConsole.png";
const NintendoConsole = "/plataforms/nintendoconsole.png";
const PcConsole = "/plataforms/computador.png";

const platforms = [
  {
    id: "PlayStation",
    consoleImage: PlaystationConsole,
    accent: "from-blue-500/20 to-blue-950/15",
  },
  {
    id: "Xbox",
    consoleImage: XboxConsole,
    accent: "from-green-500/20 to-green-950/15",
  },
  {
    id: "Nintendo Switch",
    consoleImage: NintendoConsole,
    accent: "from-red-500/20 to-red-950/15",
  },
  {
    id: "Steam",
    consoleImage: PcConsole,
    accent: "from-zinc-300/20 to-zinc-900/20",
  },
];

export default function Plataforms() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex(
      (previous) => (previous - 1 + platforms.length) % platforms.length,
    );
  };

  const goToNext = () => {
    setCurrentIndex((previous) => (previous + 1) % platforms.length);
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % platforms.length);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section id="plataforms" className="bg-black px-8 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-5xl font-bold md:text-6xl">
            Escolha sua plataforma
          </h2>
          <p className="text-xl text-gray-400">4 plataformas para jogar</p>
        </div>

        <div className="mx-auto w-full max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-zinc-900/40 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-2 text-white transition hover:scale-105 hover:bg-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="size-6" />
            </button>

            <button
              type="button"
              onClick={goToNext}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-2 text-white transition hover:scale-105 hover:bg-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Próximo slide"
            >
              <ChevronRight className="size-6" />
            </button>

            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {platforms.map((platform) => {
                return (
                  <article key={platform.id} className="relative min-w-full">
                    <div
                      className={`absolute inset-0 bg-linear-to-b ${platform.accent}`}
                    ></div>

                    <img
                      src={platform.consoleImage}
                      alt={platform.id}
                      className="mx-auto h-90 w-full object-contain p-8 sm:h-105"
                    />

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-7 py-3 backdrop-blur-sm">
                      <h3 className="text-xl font-semibold text-white sm:text-2xl">
                        {platform.id}
                      </h3>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {platforms.map((platform, index) => {
              return (
                <span
                  key={platform.id}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    index === currentIndex
                      ? "w-8 bg-blue-400"
                      : "w-2.5 bg-zinc-600"
                  }`}
                  aria-hidden="true"
                ></span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
