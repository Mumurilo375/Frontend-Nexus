function Hero() {
  return (
    <section className="relative flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-linear-to-r from-blue-900/40 via-transparent to-black/10 px-4 py-16 text-center sm:min-h-[68vh] sm:py-20">
      <h1 className="text-3xl font-bold leading-tight sm:text-5xl lg:text-7xl">Como funcionam as Keys?</h1>
      <p className="max-w-3xl text-sm font-semibold leading-6 text-gray-200 sm:text-base sm:leading-7">
        Keys são códigos digitais que permitem ativar e baixar jogos diretamente
        nas principais plataformas de jogos. Compre aqui, resgate lá, jogue em
        qualquer lugar.
      </p>
    </section>
  );
}
export default Hero;
