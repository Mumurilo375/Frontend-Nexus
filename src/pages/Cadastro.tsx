import { isAxiosError } from "axios";
import { UserCircleIcon } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Back from "../components/login/Back";
import api from "../services/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass =
  "mt-2 block w-full rounded-2xl border border-slate-700 bg-slate-900/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500/70";

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function isValidCpf(rawCpf: string): boolean {
  const cpf = rawCpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  return true;
}

function getFriendlyRegisterError(error: unknown): string {
  const message = isAxiosError<{ message?: string }>(error)
    ? String(error.response?.data?.message ?? error.message ?? "")
    : "";

  if (message.includes("Email is already in use")) {
    return "Este email ja esta em uso.";
  }

  if (message.includes("Username is already in use")) {
    return "Este nome de usuario ja esta em uso.";
  }

  if (message.includes("CPF is already in use")) {
    return "Este CPF ja esta cadastrado.";
  }

  if (message.includes("Password must")) {
    return "A senha deve ter no minimo 8 caracteres, com maiuscula, minuscula, numero e caractere especial.";
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
    message || "Nao foi possivel concluir o cadastro agora. Tente novamente."
  );
}

function Cadastro() {
  const photoRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoName, setSelectedPhotoName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    const cleanConfirmPassword = confirmPassword;
    const cleanCpf = cpf.trim();
    const cleanUsername = username.trim();

    if (!cleanFullName || !cleanEmail || !cleanPassword || !cleanCpf) {
      setErrorMessage(
        "Preencha os campos obrigatorios: nome, email, senha e CPF.",
      );
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage("Digite um email valido.");
      return;
    }

    if (!isValidCpf(cleanCpf)) {
      setErrorMessage("CPF invalido.");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      setErrorMessage("As senhas nao conferem.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await api.post("/users", {
        fullName: cleanFullName,
        email: cleanEmail,
        password: cleanPassword,
        cpf: cleanCpf.replace(/\D/g, ""),
        username: cleanUsername,
        avatarUrl: photoRef.current?.files?.[0]?.name ?? null,
      });

      void navigate("/login");
    } catch (error: unknown) {
      setErrorMessage(getFriendlyRegisterError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="nexus-page-shell min-h-full px-6 py-12 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="nexus-panel p-7 sm:p-8">
          <div className="mx-auto w-full max-w-2xl">
            <img
              alt="Logo Nexus"
              src="/utils/logo.png"
              className="mx-auto h-10 w-auto"
            />
            <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-white">
              Criar conta
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              Preencha os dados para continuar.
            </p>
          </div>

          <div className="mt-8 mx-auto w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-100">
                  Nome de usuario
                  <input
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="nome de usuario"
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-100">
                  Nome completo
                  <input
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="Digite seu nome completo"
                    id="nomecompleto"
                    name="nomecompleto"
                    type="text"
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-100">
                  CPF
                  <input
                    value={cpf}
                    onChange={(event) => {
                      setCpf(formatCpf(event.target.value));
                      setErrorMessage("");
                    }}
                    placeholder="000.000.000-00"
                    id="cpf"
                    name="cpf"
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={14}
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-100">
                  Email
                  <input
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="email@gmail.com"
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-100">
                  Senha
                  <input
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="*****"
                    id="password"
                    name="new-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-100">
                  Confirmar senha
                  <input
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="*****"
                    id="confirm-password"
                    name="new-password-confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="rounded-[28px] border border-slate-800 bg-slate-900/45 p-5">
                <label
                  htmlFor="file-upload"
                  className="block text-sm font-medium text-white"
                >
                  Foto de perfil
                </label>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-slate-500">
                    <UserCircleIcon aria-hidden="true" className="size-9" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="file-upload"
                      className="inline-flex cursor-pointer rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-500/60 hover:text-white"
                    >
                      Escolher foto
                    </label>
                    <p className="mt-2 truncate text-xs text-slate-400">
                      {selectedPhotoName || "Nenhum arquivo selecionado"}
                    </p>
                  </div>
                  <input
                    ref={photoRef}
                    id="file-upload"
                    type="file"
                    name="file-upload"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      setSelectedPhotoName(event.target.files?.[0]?.name ?? "")
                    }
                  />
                </div>
              </div>

              {errorMessage && (
                <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Criando conta..." : "Criar conta"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Ja possui uma conta?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-300 transition hover:text-blue-200"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Back />
    </div>
  );
}

export default Cadastro;
