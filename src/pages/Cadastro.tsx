import { UserCircleIcon } from "lucide-react";
import { useRef } from "react";
import api from "../services/api";

function Cadastro() {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const cpfRef = useRef<HTMLInputElement | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
try{
    await api.post("/users", {
      fullName: nameRef.current?.value ?? "",
      email: emailRef.current?.value ?? "",
      password: passwordRef.current?.value ?? "",
      cpf: cpfRef.current?.value ?? "",
      username: usernameRef.current?.value ?? "",
      avatarUrl: photoRef.current?.files?.[0]?.name ?? null,
    })
  alert("Usuário criado com sucesso!");}
    catch(error){
      alert("Erro ao criar usuário: " + error);
    }
  
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="../../public/logo.png"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-3xl font-bold tracking-tight text-white">
          Criar conta
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm ">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                name="username"
                type="text"
                required
                autoComplete="username"
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
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Criar conta
            </button>
          </div>
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
    </div>
  );
}}
export default Cadastro;
