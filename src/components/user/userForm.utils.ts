export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PasswordCheck = {
  label: string;
  isMet: boolean;
};

type PasswordStrength = {
  checks: PasswordCheck[];
  missingChecks: string[];
  percent: number;
  isStrong: boolean;
  strengthLabel: string;
  strengthTextClass: string;
  strengthBarClass: string;
};

type UserFormDataValues = {
  fullName: string;
  username: string;
  cpf: string;
  email?: string;
  password?: string;
  avatarFile?: File | null;
};

function getPasswordChecks(value: string): PasswordCheck[] {
  return [
    { label: "Ter pelo menos 8 caracteres", isMet: value.length >= 8 },
    { label: "Conter letra maiúscula", isMet: /[A-Z]/.test(value) },
    { label: "Conter letra minúscula", isMet: /[a-z]/.test(value) },
    { label: "Conter número", isMet: /\d/.test(value) },
    { label: "Conter caractere especial", isMet: /[^a-zA-Z0-9]/.test(value) },
  ];
}

function calculateCpfCheckDigit(baseDigits: string) {
  const factor = baseDigits.length + 1;
  const total = baseDigits.split("").reduce((sum, digit, index) => {
    return sum + Number(digit) * (factor - index);
  }, 0);
  const remainder = (total * 10) % 11;

  return remainder === 10 ? 0 : remainder;
}

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatCpf(value: string) {
  return normalizeCpf(value)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function isValidCpf(rawCpf: string) {
  const digitsOnly = normalizeCpf(rawCpf);

  if (digitsOnly.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitsOnly)) return false;

  const baseDigits = digitsOnly.slice(0, 9);
  const firstCheckDigit = calculateCpfCheckDigit(baseDigits);
  const secondCheckDigit = calculateCpfCheckDigit(`${baseDigits}${firstCheckDigit}`);

  return digitsOnly === `${baseDigits}${firstCheckDigit}${secondCheckDigit}`;
}

export function getPasswordStrength(value: string): PasswordStrength {
  const checks = getPasswordChecks(value);
  const missingChecks = checks.filter((check) => !check.isMet).map((check) => check.label);
  const metCount = checks.length - missingChecks.length;
  const percent = value ? Math.round((metCount / checks.length) * 100) : 0;
  const isStrong = metCount === checks.length;

  if (!value) {
    return {
      checks,
      missingChecks,
      percent: 0,
      isStrong: false,
      strengthLabel: "Pendente",
      strengthTextClass: "text-slate-300",
      strengthBarClass: "bg-slate-600",
    };
  }

  if (isStrong) {
    return {
      checks,
      missingChecks: [],
      percent,
      isStrong: true,
      strengthLabel: "Forte",
      strengthTextClass: "text-emerald-300",
      strengthBarClass: "bg-emerald-500",
    };
  }

  if (metCount >= 3) {
    return {
      checks,
      missingChecks,
      percent,
      isStrong: false,
      strengthLabel: "Média",
      strengthTextClass: "text-amber-300",
      strengthBarClass: "bg-amber-500",
    };
  }

  return {
    checks,
    missingChecks,
    percent,
    isStrong: false,
    strengthLabel: "Fraca",
    strengthTextClass: "text-rose-300",
    strengthBarClass: "bg-rose-500",
  };
}

export function getPasswordError(value: string) {
  const strength = getPasswordStrength(value);

  return strength.isStrong
    ? null
    : strength.missingChecks[0]
      ? `A senha ainda não atende o critério: ${strength.missingChecks[0]}.`
      : "A senha informada é inválida.";
}

export function buildUserFormData(values: UserFormDataValues) {
  const formData = new FormData();

  formData.append("fullName", values.fullName);
  formData.append("username", values.username);
  formData.append("cpf", normalizeCpf(values.cpf));

  if (values.email) {
    formData.append("email", values.email.trim().toLowerCase());
  }

  if (values.password) {
    formData.append("password", values.password);
  }

  if (values.avatarFile) {
    formData.append("avatarFile", values.avatarFile);
  }

  return formData;
}

export function readImagePreview(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}
