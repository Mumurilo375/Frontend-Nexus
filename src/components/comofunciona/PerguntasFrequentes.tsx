export default function PerguntasFrequentes() {
  return (
    <section className="relative flex min-h-[60vh] w-full flex-col items-center justify-center  bg-linear-to-r from-blue-900/40 via-transparent to-black/10 px-4 py-16 text-center sm:min-h-[68vh] sm:py-20">
      <div className="mx-auto w-full max-w-6xl space-y-4 text-center">
        <h1 className="md:text-7xl text-2xl mb-20">Perguntas Frequentes</h1>
        <div className="">
          <details className="mx-auto w-full rounded-lg bg-gray-600 px-8 py-4 md:max-w-5xl">
            <summary className="cursor-pointer text-lg font-semibold text-gray-200">
              O que são keys de jogos?
            </summary>
            <p className="mt-2 text-gray-300">
              Keys de jogos são códigos alfanuméricos que permitem ativar e
              baixar jogos digitais em plataformas como Steam, Xbox, PlayStation
              e Epic Games. Elas funcionam como um ingresso digital para acessar
              o conteúdo do jogo.
            </p>
          </details>
        </div>

        <div>
          <details className="mx-auto w-full rounded-lg bg-gray-600 px-8 py-4 md:max-w-5xl">
            <summary className="cursor-pointer text-lg font-semibold text-gray-200">
              O que faço se minha key não funcionar?
            </summary>
            <p className="mt-2 text-gray-300">
              Não. Cada key pode ser ativada apenas uma vez em uma única conta.
              Depois de resgatada, ela fica permanentemente vinculada àquela
              conta.
            </p>
          </details>
        </div>

        <div>
          <details className="mx-auto w-full rounded-lg bg-gray-600 px-8 py-4 md:max-w-5xl">
            <summary className="cursor-pointer text-lg font-semibold text-gray-200">
              Posso usar a mesma key em várias contas?
            </summary>
            <p className="mt-2 text-gray-300">
              Não. Cada key pode ser ativada apenas uma vez em uma única conta.
              Depois de resgatada, ela fica permanentemente vinculada àquela
              conta.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
