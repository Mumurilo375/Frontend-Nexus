export default function Steps() {
  return (
    <section className="flex bg-blue-950 w-full h-150 itens align-center text-center justify-center">
      <div className="mt-20">
        <h1 className="text-7xl font-bold py-6 ">
          Passo a passo
        </h1>
        <div className="lg:grid grid-cols-3 sm:grid gap-10 mt-20">
            <div className="bg-black h-70 w-70 rounded-4xl p-5 text-center">
                <h2 className="text-2xl font-bold py-4 mb-8">1. Compre a key</h2>
                <p className="text-gray-200 leading-8">Escolha seu jogo favorito em nossa loja e finalize a compra. Você receberá a key instantaneamente.</p>
            </div>
            <div className="bg-black h-70 w-70 rounded-4xl p-5 text-center">
               <h2 className="text-2xl font-bold py-4 mb-10">2. Copie o código</h2>
                <p className="text-gray-200">Acesse sua biblioteca e copie o código de ativação do jogo que você comprou.</p>
            </div>
            <div className="bg-black h-70 w-70 rounded-4xl p-5 text-center">
               <h2 className="text-2xl font-bold py-4 mb-10">3. Resgate e jogue</h2>
                <p className="text-gray-200">Cole o código na plataforma escolhida (Steam, Xbox, PlayStation ou Epic Games) e comece a jogar!</p>
            </div>
        </div>
      </div>
    </section>
  );
}
