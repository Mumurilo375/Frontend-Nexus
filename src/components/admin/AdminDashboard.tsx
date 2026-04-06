import AdminLayout from "./AdminLayout";
import { AdminLinkButton } from "./adminShared";

const sections = [
  { title: "Jogos", label: "Catálogo", description: "Cadastre, edite, exclua e abra os listings de cada jogo.", to: "/admin/games", cta: "Gerenciar jogos" },
  { title: "Categorias", label: "Organização", description: "Mantenha a classificação usada na loja e no admin.", to: "/admin/categories", cta: "Gerenciar categorias" },
];

export default function AdminDashboard() {
  return (
    <AdminLayout title="Painel admin" description="Acesse os dois fluxos principais de gestão da demo.">
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(({ title, label, description, to, cta }) => (
          <section key={title} className="nexus-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/80">
              {label}
            </p>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-gray-300">{description}</p>
            <AdminLinkButton to={to} tone="primary" className="mt-4 inline-flex">
              {cta}
            </AdminLinkButton>
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
