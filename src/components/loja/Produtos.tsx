import { Heart } from "lucide-react";

export default function Produtos(){
    const games = [
  {
    id: 1,
    title: "Resident Evil 4",
    description: "Enfrente criaturas assustadoras e sobreviva a uma missão intensa de resgate.",
    price: 19.99,
    image: "../../public/residentjogo.jpg",
  },
  {
    id: 2,
    title: "Batman: Arkham Knight",
    description: "Assuma o papel do Batman e proteja Gotham contra seus maiores inimigos.",
    price: 29.99,
    image: "../../public/batman.jpg",
  },
  {
    id: 3,
    title: "Mario Kart 8 Deluxe",
    description: "Corra em pistas malucas e dispute corridas divertidas com personagens clássicos.",
    price: 39.99,
    image: "../../public/mario.jpg",
  },
  {
    id: 4,
    title: "Mortal Kombat 11",
    description: "Participe de batalhas intensas com lutadores icônicos e golpes brutais.",
    price: 49.99,
    image: "../../public/mk.jpg",
  },
  {
    id: 5,
    title: "Fortnite",
    description: "Entre em batalhas online, construa estruturas e lute para ser o último sobrevivente.",
    price: 59.99,
    image: "../../public/fortinite.jpg",
  },
  {
    id: 6,
    title: "Crash Bandicoot 4: It's About Time",
    description: "Aventure-se em fases desafiadoras com Crash em uma jornada cheia de ação.",
    price: 69.99,
    image: "../../public/crash.jpg",
  },
  {
    id: 7,
    title: "Overwatch 2",
    description: "Jogue em equipe com heróis únicos em batalhas multiplayer cheias de estratégia.",
    price: 79.99,
    image: "../../public/over.jpg",
  },
  {
    id: 8,
    title: "The Witcher 3: Wild Hunt",
    description: "Explore um vasto mundo aberto e viva a jornada épica do caçador de monstros Geralt.",
    price: 89.99,
    image: "../../public/witcher.jpg",
  },
  {
    id: 9,
    title: "Battlefield 6",
    description: "Entre em guerras em larga escala com combates intensos e ambientes destrutíveis.",
    price: 99.99,
    image: "../../public/bf6.jpg",
  }
]
    return(
           <div className="grid grid-cols-3 gap-4 px-6">
        {games.map((game) => (
          <div key={game.id} className=" bg-gray-900 rounded-2xl p-6 my-4 flex flex-col items-start gap-4 hover:bg-gray-700 transition-all duration-300 hover:scale-105">
            <button className="bg-black/80 p-3 rounded-full absolute hover:scale-105 z-20 left-4 top-4" ><Heart /></button>

            <img src={game.image || "/logo.png"} alt={game.title} className="w-lg" />
            <h2 className="text-2xl font-bold mb-2 text-left">{game.title}</h2>
            <p className="text-gray-300">{game.description}</p>
            <div className="flex gap-4 justtify-between items-center">
              <p className="text-gray-300 text-1.5xl">R${game.price}</p>
              <button className="bg-blue-900 hover:scale-105 rounded-3xl py-2 px-5">Comprar</button>
            </div>
          </div>
        ))}
      </div>
    )
}