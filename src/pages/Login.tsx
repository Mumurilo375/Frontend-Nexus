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
    <div className="nexus-page-shell min-h-full px-6 py-12 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="nexus-panel p-7 sm:p-8">
          <div className="mx-auto w-full max-w-sm">
            <img
              alt="Logo Nexus"
              src="/utils/logo.png"
              className="mx-auto h-10 w-auto"
            />
            <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-white">
              Entrar
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              Entre com seu email e senha.
            </p>
          </div>

          <div className="mx-auto mt-8 w-full max-w-sm">
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
                  onChange={() => setErrorMessage("")}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-100"
                >
                  Senha
                </label>
                <input
                  placeholder="*****"
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  onChange={() => setErrorMessage("")}
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
                {isSubmitting ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Nao possui conta?{" "}
              <Link
                to="/cadastro"
                className="font-semibold text-blue-300 transition hover:text-blue-200"
              >
                Criar conta
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
