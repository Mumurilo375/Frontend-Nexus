export default function Steps() {
  return (
    <section className="w-full bg-blue-950 px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-6xl text-center">
        <h1 className="py-4 text-3xl font-bold sm:text-5xl lg:text-6xl">
          Passo a passo
        </h1>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          <div className="rounded-3xl bg-black p-6 text-center">
            <h2 className="mb-6 text-xl font-bold sm:text-2xl">
              1. Compre a key
            </h2>
            <p className="leading-7 text-gray-200">
              Escolha seu jogo favorito em nossa loja e finalize a compra. Você
              receberá a key instantaneamente.
            </p>
          </div>
          <div className="rounded-3xl bg-black p-6 text-center">
            <h2 className="mb-6 text-xl font-bold sm:text-2xl">
              2. Copie o código
            </h2>
            <p className="leading-7 text-gray-200">
              Acesse sua biblioteca e copie o código de ativação do jogo que
              você comprou.
            </p>
          </div>
          <div className="rounded-3xl bg-black p-6 text-center">
            <h2 className="mb-6 text-xl font-bold sm:text-2xl">
              3. Resgate e jogue
            </h2>
            <p className="leading-7 text-gray-200">
              Cole o código na plataforma escolhida (Steam, Xbox, PlayStation ou
              Epic Games) e comece a jogar!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
