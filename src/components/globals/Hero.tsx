import {ArrowDown} from "lucide-react";
function Hero() {
  return (
    <section className="relative h-screen overflow-hidden bg-black">
      <div className="absolute top-5 right-0 left-0 bottom-0 z-0">
        <img
          src="../../public/utils/residenthero.jpg"
          alt=""
          className="w-full h-full   object-cover opacity-90"
        />
        <div className="absolute insert-0  bg-gradient-to-b from-black/30 via-transparent to-black/80"></div>
      </div>
      <div className="absolute bottom-8 left-1/2 z-10 animate-bounce">
        <ArrowDown className="size-7"/>
      </div>
    </section>
  );
}
export default Hero;
