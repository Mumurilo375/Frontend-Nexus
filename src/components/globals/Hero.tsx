import { ArrowDown } from "lucide-react";

function Hero() {
  return (
    <section className="relative h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <img
          src="/utils/residenthero1.jpg"
          alt="Resident Evil Requiem"
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/35 via-transparent to-black/85"></div>
      </div>

      <div className="relative z-20 flex h-full items-center justify-end px-4 sm:px-8 lg:px-14">
        <div className="w-full max-w-140 rounded-2xl border border-white/20 bg-black/55 p-4 shadow-[0_0_45px_rgba(15,110,255,0.35)] backdrop-blur-sm sm:p-5">
          <div className="overflow-hidden rounded-xl">
            <iframe
              className="aspect-video w-full"
              src="https://www.youtube.com/embed/hYcpNzFNZrk?si=5uxbdHzOsepuOnmH"
              title="Trailer de Resident Evil Requiem"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-zinc-200 sm:text-base">
            Resident Evil Requiem é um survival horror que mistura terror e
            ação, focado em uma nova investigação ligada ao desastre de Raccoon
            City, conectando eventos antigos com uma história mais sombria e
            atual.
          </p>

          <button
            type="button"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_25px_rgba(59,130,246,0.7)] transition hover:scale-[1.03] hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-black sm:text-base"
          >
            Comprar agora
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 animate-bounce text-white">
        <ArrowDown className="size-7" />
      </div>
    </section>
  );
}

export default Hero;
