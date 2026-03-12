function Intro() {
  const specs = [
    {
      value: "Ativação Simples",
      label: "Copie a key, ative e jogue.",
      color: "text-blue-500",
    },
    {
      value: "Entrega Imediata",
      label: "Receba sua key logo após a compra.",
      color: "text-green-500",
    },
    {
      value: "Suporte a todo momento",
      label: "Atendimento disponível a qualquer hora",
      color: "text-yellow-500",
    },
    {
      value: "Grandes jogos para você",
      label: "Explore vários títulos na nossa biblioteca",
      color: "text-purple-500",
    },
  ];
  return (
    <section className="bg-black py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 ">NEXUS </h1>
        <p className="text-2xl md:text-4xl mb-4 text-gradient font-bold">
          Entre no próximo nível
        </p>
        <p className="text-lg md:text-1xl ">
          Descubra novos mundos, encontre grandes jogos e tenha acesso rápido às
          suas keys para ativar e jogar quando quiser
        </p>
      </div>
      <div className="mt-8 flex justify-center gap-4 mb-16">
        <a href="/loja" className="px-6 hover:opacity-70 py-3 font-medium transition-all duration-300 rounded-full bg-blue-500 text-black font-semibold hover:scale-105 shadow-lg cursor-pointer">
          Comprar Agora
        </a>
        <a href="/comofunciona" className="px-8  font-medium transition-all duration-300 py-3 rounded border border-white font-semibold rounded-full hover:scale-105 shadow-lg cursor-pointer hover:bg-white hover:text-black">
          Saiba Mais
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mx-auto max-w-5xl">
        {specs.map((spec, index) => (
            <div key={index} className="bg-gray-900 rounded-2xl p-6 hover:bg-gray-700 transition-all duration-300 hover:scale-105">
                <p className="text-2xl font-bold text-blue-500 mb-">{spec.value}</p>
                <p>{spec.label}</p>
            </div>
        ))}
      </div>
    </section>
  );
}
export default Intro;
