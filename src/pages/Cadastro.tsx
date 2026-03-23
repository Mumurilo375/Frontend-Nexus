import { UserCircleIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Back from "../components/login/Back";
import { saveAuth } from "../services/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function getFriendlyRegisterError(error: any): string {
  const message = String(error?.response?.data?.message ?? "");

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      saveAuth(data.token, data.user);
      navigate("/");
    } catch (error: any) {
      setErrorMessage(getFriendlyRegisterError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="../../public/utils/logo.png"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-3xl font-bold tracking-tight text-white">
          Criar conta
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm ">
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="">
            <div className="col-span-full">
              <label
                htmlFor="photo"
                className="block text-sm/6 font-medium text-white"
              >
                Foto
              </label>
              <div className="mt-2 flex items-center gap-x-3">
                <UserCircleIcon
                  aria-hidden="true"
                  className="size-12 text-gray-500"
                />
                <label
                  htmlFor="file-upload"
                  className="block w-full cursor-pointer rounded-md bg-white/5 px-3 py-1.5 text-base text-gray-300 outline-1 -outline-offset-1 outline-white/10 transition hover:bg-white/10 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-500 sm:text-sm/6"
                >
                  Escolher foto
                </label>
                <input
                  ref={photoRef}
                  id="file-upload"
                  type="file"
                  name="file-upload"
                  accept="image/*"
                  className="sr-only"
                />
              </div>
            </div>
            <label
              htmlFor="username"
              className="block text-sm/6 font-medium text-gray-100 mt-5"
            >
              Nome de usuário
            </label>
            <div className="mt-2">
              <input
                ref={usernameRef}
                placeholder="nome de usuário"
                id="username"
                name="new-username"
                type="text"
                required
                autoComplete="off"
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6  "
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="nome"
              className="block text-sm/6 font-medium text-gray-100"
            >
              Nome completo
            </label>
            <div className="mt-2">
              <input
                ref={nameRef}
                placeholder="Digite seu nome completo"
                id="nomecompleto"
                name="nomecompleto"
                type="text"
                required
                autoComplete="nomecompleto"
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6  "
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="cpf"
              className="block text-sm/6 font-medium text-gray-100"
            >
              CPF
            </label>
            <div className="mt-2">
              <input
                ref={cpfRef}
                placeholder="000.000.000-00"
                id="CPF"
                name="CPF"
                type="text"
                required
                autoComplete="CPF"
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6  "
              />
            </div>
          </div>

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
            </div>
            <div className="mt-2">
              <input
                ref={passwordRef}
                placeholder="*****"
                id="password"
                name="new-password"
                type="password"
                required
                autoComplete="new-password"
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="confirm-password"
                className="block text-sm/6 font-medium text-gray-100"
              >
                Confirmar senha
              </label>
            </div>
            <div className="mt-2">
              <input
                ref={confirmPasswordRef}
                placeholder="*****"
                id="confirm-password"
                name="new-password-confirm"
                type="password"
                required
                autoComplete="new-password"
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
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </button>
          </div>

          {errorMessage && (
            <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {errorMessage}
            </p>
          )}
        </form>

        <p className="mt-10 text-center text-sm/6 text-gray-400">
          Ja possui uma conta?{" "}
          <a
            href="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Logar
          </a>
        </p>
      </div>
      <Back />
    </div>
  );
}

export default Cadastro;
