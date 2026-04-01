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
    <div className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_34%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
        <div className="flex flex-col gap-5 rounded-[30px] border border-slate-800/80 bg-slate-950/85 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.42)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              {backTo && (
                <Link
                  to={backTo}
                  className="inline-flex rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-sm text-slate-300 transition hover:border-blue-500/60 hover:text-white"
                >
                  {backLabel}
                </Link>
              )}
              <h1 className="mt-3 text-3xl font-bold text-slate-50">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                {description}
              </p>
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
