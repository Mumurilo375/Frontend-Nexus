import { isAxiosError } from "axios";
import { type FormEvent, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import Back from "../components/login/Back";
import { useAuth } from "../contexts/useAuth";
import { type AuthUser } from "../services/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="/utils/logo.png"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
          Entre na sua conta
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm/6 font-medium text-gray-100"
            >
              Email
            </label>
            <div className="mt-2">
              <input
                ref={emailRef}
                placeholder="email@gmail.com"
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6  "
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm/6 font-medium text-gray-100"
              >
                Senha
              </label>
              <div className="text-sm">
                <span className="font-semibold text-gray-400">Recuperacao em breve</span>
              </div>
            </div>
            <div className="mt-2">
              <input
                placeholder="*****"
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              {isSubmitting ? "Entrando..." : "Logar"}
            </button>
          </div>

          {errorMessage && (
            <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {errorMessage}
            </p>
          )}
        </form>

        <p className="mt-10 text-center text-sm/6 text-gray-400">
          Nao possui conta?{" "}
          <Link
            to="/cadastro"
            className="font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Registre-se
          </Link>
        </p>
      </div>
      <Back />
    </div>
  );
}

export default Login;
