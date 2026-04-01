import { isAxiosError } from "axios";
import { type FormEvent, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import Back from "../components/login/Back";
import { useAuth } from "../contexts/useAuth";
import { type AuthUser } from "../services/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass =
  "mt-2 block w-full rounded-2xl border border-slate-700 bg-slate-900/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500/70";

type LoginResponse = {
  token: string;
  user: AuthUser;
};

function getFriendlyLoginError(error: unknown): string {
  const message = isAxiosError<{ message?: string }>(error)
    ? String(error.response?.data?.message ?? error.message ?? "")
    : "";

  if (message.includes("Invalid email or password")) {
    return "Email ou senha incorretos.";
  }

  if (message.includes("Network Error")) {
    return "Nao foi possivel conectar com o servidor.";
  }

  return message || "Nao foi possivel fazer login agora. Tente novamente.";
}

function Login() {
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = (emailRef.current?.value ?? "").trim().toLowerCase();
    const password = passwordRef.current?.value ?? "";

    if (!EMAIL_REGEX.test(email)) {
      setErrorMessage("Digite um email valido.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      login(data.token, data.user);
      const from = (location.state as { from?: string } | null)?.from;
      if (from) {
        void navigate(from);
      } else if (window.history.length > 1) {
        void navigate(-1);
      } else {
        void navigate("/");
      }
    } catch (error: unknown) {
      setErrorMessage(getFriendlyLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_38%),linear-gradient(180deg,#020617_0%,#030712_100%)] px-6 py-12 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
        <section className="hidden rounded-[32px] border border-slate-800 bg-slate-950/70 p-8 shadow-[0_26px_75px_rgba(2,6,23,0.45)] lg:block">
          <img alt="Logo Nexus" src="/utils/logo.png" className="h-11 w-auto" />
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80">
            Acesso rapido
          </p>
          <h1 className="mt-4 text-4xl font-bold text-white">
            Entre para acessar sua biblioteca Nexus.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
            Continue de onde parou, acompanhe pedidos, revele suas keys e
            gerencie sua conta em um painel mais limpo e direto.
          </p>
          <div className="mt-8 grid gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-300">
              Biblioteca, favoritos e checkout ficam reunidos na mesma conta.
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-300">
              Seu progresso e sincronizado automaticamente apos o login.
            </div>
          </div>
        </section>

        <div className="rounded-[32px] border border-slate-800 bg-slate-950/85 p-7 shadow-[0_26px_75px_rgba(2,6,23,0.45)] sm:p-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <img
              alt="Logo Nexus"
              src="/utils/logo.png"
              className="mx-auto h-10 w-auto"
            />
            <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-white">
              Entre na sua conta
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              Acesse seus jogos, pedidos e configuracoes da conta.
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-100"
                >
                  Email
                </label>
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
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-100"
                  >
                    Senha
                  </label>
                  <span className="text-xs font-medium text-slate-500">
                    Recuperacao em breve
                  </span>
                </div>
                <input
                  placeholder="*****"
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
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
                {isSubmitting ? "Entrando..." : "Logar"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Nao possui conta?{" "}
              <Link
                to="/cadastro"
                className="font-semibold text-blue-300 transition hover:text-blue-200"
              >
                Registre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Back />
    </div>
  );
}

export default Login;
