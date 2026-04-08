import { isAxiosError } from "axios";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};

function normalizeErrorText(value: string): string {
  return value.trim();
}

export function translateErrorMessage(
  message: string,
  fallback: string,
): string {
  const normalizedMessage = normalizeErrorText(message);

  if (!normalizedMessage) {
    return fallback;
  }

  if (normalizedMessage.includes("Network Error")) {
    return "Não foi possível conectar com o servidor.";
  }

  if (normalizedMessage.includes("Unexpected server error")) {
    return "Erro interno do servidor. Tente novamente em instantes.";
  }

  if (normalizedMessage.includes("Unexpected request error")) {
    return "Erro inesperado na requisição.";
  }

  if (normalizedMessage.includes("Payload too large")) {
    return "O envio de dados é muito grande.";
  }

  if (normalizedMessage.includes("Invalid email or password")) {
    return "Email ou senha incorretos.";
  }

  if (normalizedMessage.includes("Email is already in use")) {
    return "Este email já está em uso.";
  }

  if (normalizedMessage.includes("Email cannot be changed")) {
    return "O email não pode ser alterado.";
  }

  if (normalizedMessage.includes("Username is already in use")) {
    return "Este nome de usuário já está em uso.";
  }

  if (normalizedMessage.includes("CPF is already in use")) {
    return "Este CPF já está cadastrado.";
  }

  if (
    normalizedMessage.includes("Invalid CPF") ||
    normalizedMessage.includes("CPF must have 11 digits")
  ) {
    return "CPF inválido. Verifique os dados informados.";
  }

  if (normalizedMessage.includes("avatarUrl is too large")) {
    return "A imagem de perfil é muito grande. Escolha uma imagem menor.";
  }

  if (normalizedMessage.includes("Password must")) {
    return "A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.";
  }

  if (normalizedMessage.includes("User not authenticated")) {
    return "Usuário não autenticado.";
  }

  if (normalizedMessage.includes("User not found")) {
    return "Usuário não encontrado.";
  }

  if (normalizedMessage.includes("You can only manage your own account")) {
    return "Você só pode gerenciar sua própria conta.";
  }

  if (normalizedMessage.includes("You can only view your own account")) {
    return "Você só pode visualizar sua própria conta.";
  }

  if (normalizedMessage.includes("Route") && normalizedMessage.includes("not found")) {
    return "Rota não encontrada.";
  }

  return normalizedMessage;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    const rawMessage = String(error.response?.data?.message ?? error.message ?? "");
    return translateErrorMessage(rawMessage, fallback);
  }

  if (error instanceof Error) {
    return translateErrorMessage(error.message, fallback);
  }

  return fallback;
}
