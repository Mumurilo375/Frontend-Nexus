import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";

const cardClass =
  "rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-blue-500/60 hover:bg-gray-800";

const linkClass =
  "inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500";

export default function AdminDashboard() {
  return (
    <AdminLayout
      title="Painel admin"
      description="Gerencie jogos, categorias e listings da demo em telas simples e separadas."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <section className={cardClass}>
          <h2 className="text-xl font-semibold">Jogos</h2>
          <p className="mt-2 text-sm text-gray-300">
            Cadastre, edite, exclua e acesse os listings de cada jogo.
          </p>
          <Link to="/admin/games" className={`mt-4 ${linkClass}`}>
            Gerenciar jogos
          </Link>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-semibold">Categorias</h2>
          <p className="mt-2 text-sm text-gray-300">
            Mantenha a lista de categorias usada pelo projeto.
          </p>
          <Link to="/admin/categories" className={`mt-4 ${linkClass}`}>
            Gerenciar categorias
          </Link>
        </section>

        <section className={cardClass}>
          <h2 className="text-xl font-semibold">Listings</h2>
          <p className="mt-2 text-sm text-gray-300">
            Os listings sao geridos dentro de cada jogo para manter o fluxo
            simples.
          </p>
          <Link to="/admin/games" className={`mt-4 ${linkClass}`}>
            Abrir por jogo
          </Link>
        </section>
      </div>
    </AdminLayout>
  );
}
