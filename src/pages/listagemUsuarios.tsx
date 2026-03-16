import { useEffect, useState } from "react";
import api from "../services/api";

type User = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  cpf: string;
  avatarUrl?: string | null;
};

type UsersListResponse = { items: User[] };

export default function ListagemUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const status = loading ? "Carregando..." : error ? error : "Conexao OK: frontend recebeu resposta do backend.";
  const statusClass = error
    ? "border-rose-500/50 bg-rose-500/10 text-rose-200"
    : "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";

  const carregar = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const { data } = await api.get<UsersListResponse>("/users", {
        params: { page: 1, limit: 10 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setUsers(data?.items ?? []);
    } catch {
      setUsers([]);
      setError("Falha ao buscar usuarios. Verifique backend, frontend e CORS.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <section className="max-w-3xl mx-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-2xl font-bold">Teste API: usuarios</h1>
        <p className="mt-1 text-sm text-slate-300">GET /users?page=1&limit=10</p>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => void carregar()}
            className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Recarregar
          </button>
        </div>

        <p className={`mt-4 rounded-md border p-3 text-sm ${statusClass}`}>{status}</p>

        <ul className="mt-4 space-y-3">
          {users.map((user) => (
            <li key={user.id} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
              <p className="font-semibold">{user.username}</p>
              <p className="text-slate-200">{user.email}</p>
              <p className="text-sm text-slate-300">{user.fullName} | CPF: {user.cpf}</p>
            </li>
          ))}
        </ul>

        {!loading && !error && users.length === 0 && <p className="mt-4 text-sm text-slate-300">Sem usuarios.</p>}
      </section>
    </main>
  );
}