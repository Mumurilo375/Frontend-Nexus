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

export default function ListagemUsuarios() {
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    async function carregarUsers() {
      const token = localStorage.getItem("token");
      const { data } = await api.get("/users", {
        params: { page: 1, limit: 10 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const users = Array.isArray(data?.users) ? data.users : data;
      setAllUsers(Array.isArray(users) ? users : []);
    }

    carregarUsers();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-0 bg-white p-8 border border-gray-300 rounded-md">
      <h2>Listagem de Usuários</h2>
      <ul className="mt-4 space-y-2">
        {allUsers.map((user) => (
          <li key={user.id} className="bg-gray-100 rounded-md p-4">
            <p>Nome de usuário: {user.username}</p>
            <p>Email: {user.email}</p>
            <p>Nome completo: {user.fullName}</p>
            <p>CPF: {user.cpf}</p>
            <p>Avatar Url: {user.avatarUrl ?? "-"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
