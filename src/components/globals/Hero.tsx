import { ArrowDown } from "lucide-react";

function Hero() {
  return (
    <section className="relative h-screen overflow-hidden bg-black">
      <div className="absolute bottom-0 left-0 right-0 top-5 z-0">
        <img
          src="/utils/residenthero.jpg"
          alt=""
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80"></div>
      </div>
      <div className="absolute bottom-8 left-1/2 z-10 animate-bounce">
        <ArrowDown className="size-7" />
      </div>
    </section>
  );
}

export default Hero;
