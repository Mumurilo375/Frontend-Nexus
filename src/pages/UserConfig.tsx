import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/globals/Footer";
import { useAuth } from "../contexts/useAuth";
import NavBar from "../components/globals/NavBar";
import api from "../services/api";

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
const inputClass =
  "mt-2 block w-full rounded-2xl border border-slate-700 bg-slate-900/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500/70";

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

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function getPasswordStrengthError(password: string): string | null {
  if (password.length < 8) {
    return "A senha deve ter no minimo 8 caracteres.";
  }

  if (!/[a-z]/.test(password)) {
    return "A senha deve ter ao menos uma letra minuscula.";
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha deve ter ao menos uma letra maiuscula.";
  }

  if (!/\d/.test(password)) {
    return "A senha deve ter ao menos um numero.";
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "A senha deve ter ao menos um caractere especial.";
  }

  return null;
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
  const { syncUser, user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [cpf, setCpf] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(authUser?.avatarUrl ?? "");
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

    const passwordStrengthError = getPasswordStrengthError(password);
    if (passwordStrengthError) {
      setErrorMessage(passwordStrengthError);
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

      syncUser({
        id: data.id,
        email: data.email,
        username: data.username,
        avatarUrl: avatarPreview || data.avatarUrl || null,
        isAdmin: data.isAdmin,
      });

      setAvatarUrl(avatarUrl);
      void navigate(-1);
    } catch (error: unknown) {
      setErrorMessage(getFriendlyUpdateError(error));
      setSuccessMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.1),_transparent_30%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
        <div className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.4)]">
          <div className="border-b border-slate-800 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200/80">
              Minha conta
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              Configuracoes da conta
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Atualize seus dados com seguranca. O email fica bloqueado para
              preservar a autenticacao da conta.
            </p>
          </div>

          {loading && <p className="mt-6 text-gray-300">Carregando dados...</p>}

          {!loading && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[320px,1fr]">
              <aside className="rounded-[28px] border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex flex-col items-center text-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview da foto"
                      className="h-24 w-24 rounded-full border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-xs text-slate-400">
                      Sem foto
                    </div>
                  )}
                  <h2 className="mt-4 text-xl font-semibold text-white">
                    {fullName || authUser?.username || "Usuario Nexus"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    @{username || authUser?.username || "usuario"}
                  </p>
                </div>

                <div className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm">
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="mt-1 text-slate-200">{email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">CPF</p>
                    <p className="mt-1 text-slate-200">{cpf || "-"}</p>
                  </div>
                  <p className="text-xs leading-6 text-slate-400">
                    A alteracao de email fica bloqueada. Nome, usuario, CPF,
                    senha e avatar continuam editaveis.
                  </p>
                </div>
              </aside>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-[28px] border border-slate-800 bg-slate-900/50 p-6"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-100">
                    Nome completo
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className={inputClass}
                      required
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-100">
                    Nome de usuario
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className={inputClass}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-100">
                    CPF
                    <input
                      id="cpf"
                      type="text"
                      value={cpf}
                      onChange={(event) => setCpf(formatCpf(event.target.value))}
                      className={inputClass}
                      maxLength={14}
                      required
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-100">
                    Email
                    <input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="mt-2 block w-full cursor-not-allowed rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-500"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      O email fica bloqueado por regra de seguranca.
                    </p>
                  </label>
                </div>

                <div className="rounded-[24px] border border-slate-800 bg-slate-950/75 p-5">
                  <label
                    htmlFor="avatarFile"
                    className="block text-sm font-medium text-slate-100"
                  >
                    Foto de perfil
                  </label>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <input
                      id="avatarFile"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="avatarFile"
                      className="inline-flex cursor-pointer rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-blue-500/60 hover:text-white"
                    >
                      Escolher imagem
                    </label>
                    <p className="text-xs text-slate-400">
                      Atualize a imagem usada na navbar e no perfil.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-100">
                    Senha
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={inputClass}
                      placeholder="Digite sua nova senha"
                      required
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-100">
                    Confirmar senha
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={inputClass}
                      placeholder="Repita a senha"
                      required
                    />
                  </label>
                </div>

                <p className="text-xs leading-6 text-slate-400">
                  A nova senha precisa manter nivel forte: 8 caracteres, letras
                  maiusculas e minusculas, numero e caractere especial.
                </p>

                {errorMessage && (
                  <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {errorMessage}
                  </p>
                )}

                {successMessage && (
                  <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    {successMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
