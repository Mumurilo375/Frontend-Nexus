import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/useAuth";
import api from "../../../services/api";
import { getApiErrorMessage } from "../../../services/http";

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
const disabledInputClass =
  "mt-2 block w-full cursor-not-allowed rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-500";

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

function calculateCpfCheckDigit(baseDigits: string) {
  const factor = baseDigits.length + 1;
  const total = baseDigits.split("").reduce((sum, digit, index) => {
    return sum + Number(digit) * (factor - index);
  }, 0);
  const remainder = (total * 10) % 11;

  return remainder === 10 ? 0 : remainder;
}

function isValidCpf(rawCpf: string): boolean {
  const cpf = rawCpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const baseDigits = cpf.slice(0, 9);
  const firstCheckDigit = calculateCpfCheckDigit(baseDigits);
  const secondCheckDigit = calculateCpfCheckDigit(
    `${baseDigits}${firstCheckDigit}`,
  );

  return cpf === `${baseDigits}${firstCheckDigit}${secondCheckDigit}`;
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
    return "A senha deve ter no mínimo 8 caracteres.";
  }

  if (!/[a-z]/.test(password)) {
    return "A senha deve ter ao menos uma letra minúscula.";
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha deve ter ao menos uma letra maiúscula.";
  }

  if (!/\d/.test(password)) {
    return "A senha deve ter ao menos um número.";
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "A senha deve ter ao menos um caractere especial.";
  }

  return null;
}

function getFriendlyUpdateError(error: unknown): string {
  return getApiErrorMessage(
    error,
    "Não foi possível atualizar seus dados agora. Tente novamente.",
  );
}

function getAvatarValue(value: string | null | undefined) {
  return isRenderableAvatar(value) ? String(value) : "";
}

export default function AccountSettings() {
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
  const profileLabel = fullName || authUser?.username || "Usuário Nexus";

  const clearFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage("");
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser?.id) {
        showError("Não foi possível identificar o usuário autenticado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        clearFeedback();

        const { data } = await api.get<UserProfile>(`/users/${authUser.id}`);
        const resolvedAvatarUrl =
          getAvatarValue(data.avatarUrl) || getAvatarValue(authUser.avatarUrl);

        setFullName(data.fullName ?? "");
        setUsername(data.username ?? "");
        setCpf(formatCpf(data.cpf ?? ""));
        setAvatarUrl(resolvedAvatarUrl);
        setAvatarPreview(resolvedAvatarUrl);
        setEmail(data.email ?? authUser.email ?? "");
      } catch {
        showError("Não foi possível carregar seus dados.");
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

    if (!file) return;

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
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!fullName.trim() || !username.trim() || !cpf.trim()) {
      showError("Preencha os campos obrigatórios: nome, usuário e CPF.");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      showError("O email exibido está inválido.");
      return;
    }

    if (!isValidCpf(cpf)) {
      showError("CPF inválido.");
      return;
    }

    if (trimmedPassword || trimmedConfirmPassword) {
      const passwordStrengthError = getPasswordStrengthError(trimmedPassword);

      if (passwordStrengthError) {
        showError(passwordStrengthError);
        return;
      }

      if (trimmedPassword !== trimmedConfirmPassword) {
        showError("As senhas não conferem.");
        return;
      }
    }

    if (!authUser?.id) {
      showError("Não foi possível identificar o usuário autenticado.");
      return;
    }

    try {
      setIsSubmitting(true);
      clearFeedback();

      const payload: {
        fullName: string;
        username: string;
        cpf: string;
        avatarUrl: string | null;
        password?: string;
      } = {
        fullName: fullName.trim(),
        username: username.trim(),
        cpf: cpf.replace(/\D/g, ""),
        avatarUrl: avatarUrl.trim() || null,
        ...(trimmedPassword ? { password: trimmedPassword } : {}),
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
      showError(getFriendlyUpdateError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-10 pt-28">
      <div className="rounded-4xl border border-slate-800 bg-slate-950/85 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.4)]">
        <div className="border-b border-slate-800 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200/80">
            Minha conta
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Configurações da conta
          </h1>
        
        </div>

        {loading && <p className="mt-6 text-gray-300">Carregando dados...</p>}

        {!loading && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px,1fr]">
            <aside className="rounded-[28px] border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex flex-col  items-center text-center">
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

                <h2 className="mt-4 mb-4 text-xl font-semibold text-white">
                  {profileLabel}
                </h2>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/75 p-5">
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
                      className="mx-auto inline-flex cursor-pointer justify-between rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-blue-500/60 hover:text-white"
                    >
                      Escolher imagem
                    </label>
                    <p className="text-xs text-slate-400">
                      Atualize a imagem usada na navbar e no perfil.
                    </p>
                  </div>
                </div>
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
                  Nome de usuário
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
                    className={disabledInputClass}
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    O email fica bloqueado por regra de segurança.
                  </p>
                </label>
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
                    placeholder="Digite sua nova senha (opcional)"
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
                    placeholder="Repita a senha (opcional)"
                  />
                </label>
              </div>

              <p className="text-xs leading-6 text-slate-400">
                Se quiser alterar a senha, use um padrão forte: 8 caracteres,
                letras maiúsculas e minúsculas, número e caractere especial.
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
                {isSubmitting ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
