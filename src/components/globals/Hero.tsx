import { ArrowDown } from "lucide-react";

function Hero() {
  return (
    <section className="relative h-screen overflow-hidden bg-slate-950">
      <div className="absolute bottom-0 left-0 right-0 top-5 z-0">
        <img
          src="/utils/residenthero.jpg"
          alt=""
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.2)_38%,rgba(2,6,23,0.92)_100%)]" />
      </div>
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/60 p-3 backdrop-blur-sm animate-bounce">
        <ArrowDown className="size-7" />
      </div>
    </section>
  );
}

export default Hero;
