import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Footer from "../globals/Footer";
import NavBar from "../globals/NavBar";

type AdminLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export default function AdminLayout({
  title,
  description,
  children,
  backTo,
  backLabel = "Voltar",
  actions,
}: AdminLayoutProps) {
  return (
    <div>
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-950/70 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              {backTo && (
                <Link
                  to={backTo}
                  className="text-sm text-blue-300 transition hover:text-blue-200"
                >
                  {backLabel}
                </Link>
              )}
              <h1 className="mt-2 text-3xl font-bold">{title}</h1>
              <p className="mt-2 text-sm text-gray-300">{description}</p>
            </div>

            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
          </div>

          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
