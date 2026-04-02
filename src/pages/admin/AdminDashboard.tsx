import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";

const linkClass =
  "inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500";

const sections = [
  {
    title: "Jogos",
    label: "Catalogo",
    description: "Cadastre, edite, exclua e abra os listings de cada jogo.",
    to: "/admin/games",
    cta: "Gerenciar jogos",
  },
  {
    title: "Categorias",
    label: "Organizacao",
    description: "Mantenha a classificacao usada na loja e no admin.",
    to: "/admin/categories",
    cta: "Gerenciar categorias",
  },
];

export default function AdminDashboard() {
  return (
    <AdminLayout
      title="Painel admin"
      description="Acesse os dois fluxos principais de gestao da demo."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="nexus-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/80">
              {section.label}
            </p>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm text-gray-300">{section.description}</p>
            <Link to={section.to} className={`mt-4 ${linkClass}`}>
              {section.cta}
            </Link>
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
