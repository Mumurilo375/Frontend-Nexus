import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import api from "../services/api";
import { getAuthUser, getToken, saveAuth } from "../services/auth";

type UserProfile = {
  id: number;
  email: string;
  username: string;
  fullName: string;
  cpf: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRenderableAvatar(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("data:image/") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("/")
  );
}

function isValidCpf(rawCpf: string): boolean {
  const cpf = rawCpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  for (let t = 9; t <= 10; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) {
      sum += Number(cpf[i]) * (t + 1 - i);
    }
    const digit = ((sum * 10) % 11) % 10;
    if (Number(cpf[t]) !== digit) return false;
  }

  return true;
}

function getFriendlyUpdateError(error: unknown): string {
  const maybeError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  const message = String(maybeError?.response?.data?.message ?? "");

  if (message.includes("Email cannot be changed")) {
    return "O email nao pode ser alterado.";
  }

  if (message.includes("Username is already in use")) {
    return "Este nome de usuario ja esta em uso.";
  }

  if (message.includes("CPF is already in use")) {
    return "Este CPF ja esta cadastrado.";
  }

  if (message.includes("Password must")) {
    return "A senha deve ter no minimo 8 caracteres, com caractére maiusculo, minusculo, numero e caractere especial.";
  }

  if (
    message.includes("Invalid CPF") ||
    message.includes("CPF must have 11 digits")
  ) {
    return "CPF invalido. Verifique os dados informados.";
  }

  if (message.includes("Network Error")) {
    return "Nao foi possivel conectar com o servidor.";
  }

  return (
    message || "Nao foi possivel atualizar seus dados agora. Tente novamente."
  );
}

export default function UserConfig() {
  const navigate = useNavigate();
  const authUser = useMemo(() => getAuthUser(), []);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [cpf, setCpf] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(authUser?.avatarUrl ?? "");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState(authUser?.email ?? "");

  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser?.id) {
        setErrorMessage("Nao foi possivel identificar o usuario autenticado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const { data } = await api.get<UserProfile>(`/users/${authUser.id}`);

        const apiAvatar = isRenderableAvatar(data.avatarUrl)
          ? String(data.avatarUrl)
          : "";
        const localAvatar = isRenderableAvatar(authUser.avatarUrl)
          ? String(authUser.avatarUrl)
          : "";
        const resolvedAvatarUrl = apiAvatar || localAvatar;

        setFullName(data.fullName ?? "");
        setUsername(data.username ?? "");
        setCpf(data.cpf ?? "");
        setAvatarUrl(resolvedAvatarUrl);
        setAvatarPreview(resolvedAvatarUrl);
        setEmail(data.email ?? authUser.email ?? "");
      } catch {
        setErrorMessage("Nao foi possivel carregar seus dados.");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [authUser]);

  const handleAvatarFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAvatarFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarPreview(result);
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim() || !username.trim() || !cpf.trim() || !password) {
      setErrorMessage(
        "Preencha os campos obrigatorios: nome, usuario, CPF e senha.",
      );
      setSuccessMessage("");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setErrorMessage("O email exibido esta invalido.");
      setSuccessMessage("");
      return;
    }

    if (!isValidCpf(cpf)) {
      setErrorMessage("CPF invalido.");
      setSuccessMessage("");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas nao conferem.");
      setSuccessMessage("");
      return;
    }

    if (!authUser?.id) {
      setErrorMessage("Nao foi possivel identificar o usuario autenticado.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = {
        fullName: fullName.trim(),
        username: username.trim(),
        cpf: cpf.trim(),
        password,
        avatarUrl: avatarUrl.trim() || null,
      };

      const { data } = await api.put<UserProfile>(
        `/users/${authUser.id}`,
        payload,
      );

      const token = getToken();
      if (token) {
        saveAuth(token, {
          id: data.id,
          email: data.email,
          username: data.username,
          avatarUrl: avatarPreview || data.avatarUrl || null,
          isAdmin: data.isAdmin,
        });
      }

      setAvatarUrl(avatarUrl);
      setAvatarFileName("");
      navigate(-1);
    } catch (error: unknown) {
      setErrorMessage(getFriendlyUpdateError(error));
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-3xl px-6 pb-10 pt-28">
        <h1 className="text-3xl font-bold">Configuracoes da conta</h1>
        <p className="mt-2 text-sm text-gray-300">
          Atualize seus dados. O email nao pode ser alterado.
        </p>

        {loading && <p className="mt-6 text-gray-300">Carregando dados...</p>}

        {!loading && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-xl bg-gray-900 p-5"
          >
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-100"
              >
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-100"
              >
                Nome de usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="cpf"
                className="block text-sm font-medium text-gray-100"
              >
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(event) => setCpf(event.target.value)}
                className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="avatarFile"
                className="block text-sm font-medium text-gray-100"
              >
                Foto de perfil
              </label>
              <div className="mt-2 flex items-center gap-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview da foto"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-xs text-gray-400">
                    Sem foto
                  </div>
                )}
                <input
                  id="avatarFile"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatarFile"
                  className="block cursor-pointer rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
                >
                  Escolher ícone
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Escolha uma imagem para atualizar sua foto no perfil.
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-100"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                className="mt-2 block w-full cursor-not-allowed rounded-md bg-gray-800 px-3 py-2 text-sm text-gray-400 outline-1 -outline-offset-1 outline-white/10"
              />
              <p className="mt-1 text-xs text-gray-400">
                O email fica bloqueado por regra de seguranca.
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-100"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                placeholder="Digite sua nova senha"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-100"
              >
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 block w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500"
                placeholder="Repita a senha"
                required
              />
            </div>

            {errorMessage && (
              <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
