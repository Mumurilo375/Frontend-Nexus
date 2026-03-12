function Highlights() {
  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-1">
          <h2 className="text-6xl font-bold mb-4">
            Para Todos os Tipos de Jogador
          </h2>
          <p className="text-xl text-gray-400 my-7">
            Descubra jogos de diferentes gêneros e estilos em um só lugar
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-900 rounded-3xl p-8 ">
            <img
              src="../../public/homemaranha.png"
              alt="wukong-game"
              className="w-full h-64 object-cover rounded-2xl mb-4"
            />
            <h3 className="font-bold mb-2 text-3xl">Ação e Aventura</h3>
            <p className="text-gray-300">
              Enfrente desafios intensos e explore novos mundos
            </p>
          </div>
          <div className="bg-gray-900 rounded-3xl p-8">
            <img
              src="../../public/eldenring.jpg"
              alt="eldenring-game"
              className="w-full h-64 object-cover rounded-2xl mb-4"
            />
            <h3 className="font-bold mb-2 text-3xl">Estratégia e RPG</h3>
            <p className="text-gray-300">
              Planeje cada movimento e construa sua jornada.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Highlights;
