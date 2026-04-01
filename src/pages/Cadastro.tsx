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
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);
  const cpfRef = useRef<HTMLInputElement | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoName, setSelectedPhotoName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullName = (nameRef.current?.value ?? "").trim();
    const email = (emailRef.current?.value ?? "").trim().toLowerCase();
    const password = passwordRef.current?.value ?? "";
    const confirmPassword = confirmPasswordRef.current?.value ?? "";
    const cpf = (cpfRef.current?.value ?? "").trim();
    const username = (usernameRef.current?.value ?? "").trim();

    if (!fullName || !email || !password || !cpf) {
      setErrorMessage(
        "Preencha os campos obrigatorios: nome, email, senha e CPF.",
      );
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setErrorMessage("Digite um email valido.");
      return;
    }

    if (!isValidCpf(cpf)) {
      setErrorMessage("CPF invalido.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas nao conferem.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await api.post("/users", {
        fullName,
        email,
        password,
        cpf,
        username,
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
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_38%),linear-gradient(180deg,#020617_0%,#030712_100%)] px-6 py-12 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.92fr,1.08fr] lg:items-start">
        <section className="hidden rounded-[32px] border border-slate-800 bg-slate-950/70 p-8 shadow-[0_26px_75px_rgba(2,6,23,0.45)] lg:block">
          <img alt="Logo Nexus" src="/utils/logo.png" className="h-11 w-auto" />
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80">
            Bem-vindo
          </p>
          <h1 className="mt-4 text-4xl font-bold text-white">
            Crie sua conta e monte sua biblioteca digital.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
            O cadastro libera favoritos, carrinho, checkout e a area onde as
            keys compradas ficam disponiveis depois do pedido.
          </p>
          <div className="mt-8 rounded-[28px] border border-slate-800 bg-slate-900/65 p-5">
            <p className="text-sm font-medium text-slate-100">
              O cadastro desta demo pede:
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
              <li>Nome completo, email, senha forte e CPF valido.</li>
              <li>Nome de usuario para aparecer no perfil.</li>
              <li>Uma foto opcional para personalizar a conta.</li>
            </ul>
          </div>
        </section>

        <div className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-7 shadow-[0_26px_75px_rgba(2,6,23,0.45)] sm:p-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
            <img
              alt="Logo Nexus"
              src="/utils/logo.png"
              className="mx-auto h-10 w-auto"
            />
            <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-white">
              Criar conta
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              Preencha os dados para entrar no ecossistema Nexus.
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              autoComplete="off"
            >
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

              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-100">
                  Nome de usuario
                  <input
                    ref={usernameRef}
                    placeholder="nome de usuario"
                    id="username"
                    name="new-username"
                    type="text"
                    required
                    autoComplete="off"
                    className={inputClass}
                  />
                </label>

                <label className="text-sm font-medium text-slate-100">
                  Nome completo
                  <input
                    ref={nameRef}
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
                    ref={cpfRef}
                    placeholder="000.000.000-00"
                    id="cpf"
                    name="cpf"
                    type="text"
                    required
                    autoComplete="off"
                    maxLength={14}
                    className={inputClass}
                    onChange={(event) => {
                      event.target.value = formatCpf(event.target.value);
                    }}
                  />
                </label>

                <label className="text-sm font-medium text-slate-100">
                  Email
                  <input
                    ref={emailRef}
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
                    ref={passwordRef}
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
                    ref={confirmPasswordRef}
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
                Logar
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
