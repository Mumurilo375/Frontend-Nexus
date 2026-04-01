import {
  CheckCircle2,
  Copy,
  CreditCard,
  LockKeyhole,
  Mail,
  QrCode,
  WalletMinimal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/globals/Footer";
import NavBar from "../components/globals/NavBar";
import Back from "../components/login/Back";
import api from "../services/api";
import { getApiErrorMessage } from "../services/http";

type CartItem = {
  id: number;
  listing?: {
    price: number | string;
    game?: { title?: string };
    platform?: { name?: string };
  };
};

type CartResponse = { items: CartItem[] };

type OrderResponse = {
  id: number;
  orderNumber: string;
  totalAmount: number | string;
  status: string;
};

type CheckoutCreateResponse = {
  order: OrderResponse;
};

type PaymentMethod = "card" | "paypal" | "pix";
type CardField = "number" | "name" | "expiry" | "cvv" | null;

type PaymentOptionProps = {
  icon: typeof CreditCard;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toMoney(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  return digitsOnly(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function sanitizeCardName(value: string) {
  return value
    .replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 40);
}

function isValidFutureExpiry(value: string) {
  const digits = digitsOnly(value);
  if (digits.length !== 4) return false;

  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return year > currentYear || (year === currentYear && month >= currentMonth);
}

function getCardBrand(value: string) {
  const digits = digitsOnly(value);

  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^(5067|5090|650|6516|6550|6363)/.test(digits)) return "Elo";

  return "Cartao";
}

function buildPixCode(total: number, itemCount: number) {
  const amount = total.toFixed(2);
  const reference = String(itemCount).padStart(2, "0");

  return [
    "000201",
    "26400014BR.GOV.BCB.PIX0118nexus-faculdade",
    "52040000",
    "5303986",
    `540${String(amount.length).padStart(2, "0")}${amount}`,
    "5802BR",
    "5917NEXUS GAME STORE",
    "6009SAO PAULO",
    `62100506PED${reference}`,
    "6304ABCD",
  ].join("");
}

function createPixQrDataUrl(value: string) {
  const size = 29;
  const cell = 8;
  const quietZone = 4;
  const total = (size + quietZone * 2) * cell;
  const squares: string[] = [];

  const drawSquare = (x: number, y: number, fill = "#111827") => {
    squares.push(
      `<rect x="${(x + quietZone) * cell}" y="${(y + quietZone) * cell}" width="${cell}" height="${cell}" rx="1" fill="${fill}" />`,
    );
  };

  const drawFinder = (x: number, y: number) => {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const isOuter = row === 0 || row === 6 || col === 0 || col === 6;
        const isInner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        if (isOuter || isInner) drawSquare(x + col, y + row);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const isFinderArea =
        (row < 7 && col < 7) ||
        (row < 7 && col >= size - 7) ||
        (row >= size - 7 && col < 7);

      if (isFinderArea) continue;

      const charCode = value.charCodeAt((row * size + col) % value.length);
      if ((charCode + row + col) % 2 === 0) drawSquare(col, row);
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}">
      <rect width="${total}" height="${total}" rx="20" fill="#ffffff" />
      ${squares.join("")}
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function PaymentOption({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: PaymentOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-blue-500/70 bg-slate-900 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]"
          : "border-gray-800 bg-gray-900 hover:border-gray-600"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`rounded-xl p-3 ${
            active
              ? "bg-blue-600/20 text-blue-200"
              : "bg-gray-800 text-gray-300"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-300">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalPassword, setPaypalPassword] = useState("");
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [focusedCardField, setFocusedCardField] = useState<CardField>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.listing?.price ?? 0), 0),
    [items],
  );
  const cardBrand = useMemo(() => getCardBrand(cardNumber), [cardNumber]);
  const formattedCardNumber = useMemo(() => formatCardNumber(cardNumber), [cardNumber]);
  const formattedExpiry = useMemo(() => formatExpiry(cardExpiry), [cardExpiry]);
  const pixCode = useMemo(() => buildPixCode(subtotal, items.length), [items.length, subtotal]);
  const pixQrSrc = useMemo(() => createPixQrDataUrl(pixCode), [pixCode]);
  const canSubmit =
    !placingOrder && (paymentMethod !== "pix" || pixConfirmed === true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get<CartResponse>("/cart");
        setItems(data.items ?? []);
      } catch (requestError) {
        setItems([]);
        setError(
          getApiErrorMessage(
            requestError,
            "Nao foi possivel carregar o checkout.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (copyStatus === "idle") return;

    const timeoutId = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const selectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setError("");
    if (method !== "pix") setPixConfirmed(false);
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === "card") {
      if (cardName.trim().length < 3) return "Informe o nome impresso no cartao.";
      if (digitsOnly(cardNumber).length !== 16) {
        return "O numero do cartao deve ter 16 digitos.";
      }
      if (!isValidFutureExpiry(cardExpiry)) {
        return "Informe uma validade valida e que ainda nao tenha expirado.";
      }
      if (digitsOnly(cardCvv).length !== 3) {
        return "O CVV deve ter exatamente 3 digitos.";
      }
      return "";
    }

    if (paymentMethod === "paypal") {
      if (!EMAIL_REGEX.test(paypalEmail.trim().toLowerCase())) {
        return "Informe um email valido para o PayPal.";
      }
      if (paypalPassword.trim().length < 6) {
        return "Informe a senha da conta PayPal com pelo menos 6 caracteres.";
      }
      return "";
    }

    if (!pixConfirmed) {
      return "Confirme a leitura do QR Code para concluir o pagamento.";
    }

    return "";
  };

  const createOrder = async () => {
    const paymentError = validatePaymentDetails();
    if (paymentError) {
      setError(paymentError);
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");
      const { data } = await api.post<CheckoutCreateResponse>("/checkout", {
        paymentMethod,
      });
      setOrder(data.order);
      setItems([]);
      window.dispatchEvent(new Event("nexus:counts-updated"));
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Nao foi possivel finalizar o pedido.",
        ),
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div>
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-5xl px-6 pb-10 pt-28">
        <h1 className="text-3xl font-bold">Resumo do pedido</h1>
        <p className="mt-2 text-sm text-gray-300">
          Escolha a forma de pagamento e conclua a compra para liberar as keys
          na hora.
        </p>

        {loading && <p className="mt-4 text-gray-300">Carregando resumo...</p>}

        {!loading && order && (
          <section className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-950/20 p-6">
            <h2 className="text-2xl font-semibold">Pedido confirmado</h2>
            <p className="mt-2 text-gray-200">Numero: {order.orderNumber}</p>
            <p className="text-gray-200">
              Total: {toMoney(Number(order.totalAmount ?? 0))}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <p className="basis-full text-sm text-blue-100">
                Compra concluida. Suas keys ja foram liberadas na sua
                biblioteca.
              </p>
              <Link
                to="/meus-pedidos"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold"
              >
                Ver meus pedidos
              </Link>
              <Link
                to="/loja"
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm"
              >
                Continuar comprando
              </Link>
            </div>
          </section>
        )}
        {!loading && !order && (
          <section className="mt-6 rounded-2xl border border-gray-800 bg-gray-950/80 p-5">
            {items.length === 0 ? (
              <>
                <p className="text-gray-300">Seu carrinho esta vazio.</p>
                <Link
                  to="/loja"
                  className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm"
                >
                  Ir para loja
                </Link>
              </>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                    <h2 className="text-xl font-semibold">Itens do pedido</h2>
                    <ul className="mt-4 space-y-3">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded-xl bg-gray-800/80 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium">
                              {item.listing?.game?.title || "Jogo"}
                            </p>
                            <p className="text-sm text-gray-300">
                              {item.listing?.platform?.name || "-"}
                            </p>
                          </div>
                          <p className="font-medium">
                            {toMoney(Number(item.listing?.price ?? 0))}
                          </p>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 rounded-xl border border-gray-800 bg-black/20 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Subtotal</span>
                        <span className="text-lg font-semibold text-white">
                          {toMoney(subtotal)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        A confirmacao libera as keys imediatamente na sua
                        biblioteca.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <PaymentOption
                      icon={CreditCard}
                      title="Cartao"
                      description="Pagamento com preenchimento guiado."
                      active={paymentMethod === "card"}
                      onClick={() => selectPaymentMethod("card")}
                    />
                    <PaymentOption
                      icon={Mail}
                      title="PayPal"
                      description="Confirme os dados da sua conta."
                      active={paymentMethod === "paypal"}
                      onClick={() => selectPaymentMethod("paypal")}
                    />
                    <PaymentOption
                      icon={QrCode}
                      title="PIX"
                      description="Leia o QR Code ou copie o codigo."
                      active={paymentMethod === "pix"}
                      onClick={() => selectPaymentMethod("pix")}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
                  {paymentMethod === "card" && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-xl font-semibold">
                          Pagar com cartao
                        </h2>
                      </div>

                      <div className="rounded-[28px] border border-gray-800 bg-gradient-to-br from-[#090b11] via-[#101827] to-[#111827] p-1">
                        <div className="relative h-56 overflow-hidden rounded-[24px] bg-black/20 [perspective:1200px]">
                          <div
                            className="relative h-full w-full transition-transform duration-500"
                            style={{
                              transform:
                                focusedCardField === "cvv"
                                  ? "rotateY(180deg)"
                                  : "rotateY(0deg)",
                              transformStyle: "preserve-3d",
                            }}
                          >
                            <div
                              className="absolute inset-0 flex h-full flex-col justify-between rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_40%),linear-gradient(135deg,#090b11_0%,#0f172a_55%,#111827_100%)] p-6"
                              style={{ backfaceVisibility: "hidden" }}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                    Nexus Secure
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-slate-100">
                                    {cardBrand}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-white/85" />
                                  <div className="h-3 w-3 rounded-full bg-white/45" />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="h-10 w-14 rounded-lg border border-white/15 bg-gradient-to-br from-slate-300 to-slate-500" />
                                <p className="text-2xl tracking-[0.28em] text-slate-50 sm:text-3xl">
                                  {formattedCardNumber || "0000 0000 0000 0000"}
                                </p>
                              </div>

                              <div className="flex items-end justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                                    Nome
                                  </p>
                                  <p className="truncate text-sm font-medium uppercase text-slate-100">
                                    {cardName.trim() || "Seu nome"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                                    Validade
                                  </p>
                                  <p className="text-sm font-medium text-slate-100">
                                    {formattedExpiry || "MM/AA"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div
                              className="absolute inset-0 rounded-[24px] bg-[linear-gradient(135deg,#090b11_0%,#111827_55%,#1f2937_100%)] p-6"
                              style={{
                                backfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                              }}
                            >
                              <div className="mt-4 h-12 rounded-md bg-black/70" />
                              <div className="mt-6 rounded-md bg-white/90 px-4 py-3 text-right">
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                                  CVV
                                </p>
                                <p className="text-lg font-semibold tracking-[0.35em] text-slate-900">
                                  {digitsOnly(cardCvv).padEnd(3, "•")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <label className="text-sm text-gray-200">
                          Numero do cartao
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            maxLength={19}
                            value={formattedCardNumber}
                            onFocus={() => setFocusedCardField("number")}
                            onBlur={() => setFocusedCardField(null)}
                            onChange={(event) => {
                              setCardNumber(digitsOnly(event.target.value).slice(0, 16));
                              setError("");
                            }}
                            placeholder="0000 0000 0000 0000"
                            className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                          />
                        </label>

                        <label className="text-sm text-gray-200">
                          Nome impresso
                          <input
                            type="text"
                            autoComplete="cc-name"
                            value={cardName}
                            onFocus={() => setFocusedCardField("name")}
                            onBlur={() => setFocusedCardField(null)}
                            onChange={(event) => {
                              setCardName(sanitizeCardName(event.target.value));
                              setError("");
                            }}
                            placeholder="Nome como esta no cartao"
                            className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                          />
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="text-sm text-gray-200">
                            Validade
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              maxLength={5}
                              value={formattedExpiry}
                              onFocus={() => setFocusedCardField("expiry")}
                              onBlur={() => setFocusedCardField(null)}
                              onChange={(event) => {
                                setCardExpiry(digitsOnly(event.target.value).slice(0, 4));
                                setError("");
                              }}
                              placeholder="MM/AA"
                              className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            />
                          </label>

                          <label className="text-sm text-gray-200">
                            CVV
                            <input
                              type="password"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              maxLength={3}
                              value={digitsOnly(cardCvv)}
                              onFocus={() => setFocusedCardField("cvv")}
                              onBlur={() => setFocusedCardField(null)}
                              onChange={(event) => {
                                setCardCvv(digitsOnly(event.target.value).slice(0, 3));
                                setError("");
                              }}
                              placeholder="000"
                              className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  {paymentMethod === "paypal" && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-gray-800 bg-[#0d1118] p-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-blue-600/15 p-3 text-blue-200">
                            <WalletMinimal className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-white">
                              Entrar com PayPal
                            </h2>
                            <p className="text-sm text-gray-300">
                              Confirme os dados da conta para continuar.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <label className="text-sm text-gray-200">
                          Email da conta
                          <input
                            type="email"
                            value={paypalEmail}
                            onChange={(event) => {
                              setPaypalEmail(event.target.value);
                              setError("");
                            }}
                            placeholder="email@paypal.com"
                            className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                          />
                        </label>

                        <label className="text-sm text-gray-200">
                          Senha
                          <div className="relative mt-2">
                            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                              type="password"
                              value={paypalPassword}
                              onChange={(event) => {
                                setPaypalPassword(event.target.value.slice(0, 40));
                                setError("");
                              }}
                              placeholder="Sua senha do PayPal"
                              className="w-full rounded-xl border border-gray-700 bg-gray-800 py-3 pl-11 pr-4 text-white outline-none transition focus:border-blue-500"
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                  {paymentMethod === "pix" && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-xl font-semibold">Pagar com PIX</h2>
                        <p className="mt-1 text-sm text-gray-300">
                          Leia o QR Code ou copie o codigo abaixo.
                        </p>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[0.92fr,1.08fr]">
                        <div className="rounded-2xl border border-gray-800 bg-[#0d1118] p-5">
                          <div className="mx-auto flex max-w-60 flex-col items-center gap-4">
                            <div className="rounded-[28px] bg-white p-4 shadow-xl shadow-black/20">
                              <img
                                src={pixQrSrc}
                                alt="QR Code PIX"
                                className="h-52 w-52 rounded-2xl object-cover"
                              />
                            </div>
                            <p className="text-center text-sm text-gray-300">
                              Aponte a camera do app do banco para este QR Code.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5">
                          <p className="text-sm font-medium text-gray-200">
                            Codigo copia e cola
                          </p>
                          <div className="mt-3 rounded-xl border border-gray-800 bg-black/40 p-4">
                            <p className="break-all font-mono text-xs text-blue-200">
                              {pixCode}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                void handleCopyPixCode();
                              }}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                            >
                              <Copy className="h-4 w-4" />
                              Copiar codigo
                            </button>

                            {copyStatus === "copied" && (
                              <span className="inline-flex items-center gap-2 text-sm text-blue-200">
                                <CheckCircle2 className="h-4 w-4" />
                                Codigo copiado com sucesso
                              </span>
                            )}

                            {copyStatus === "error" && (
                              <span className="text-sm text-rose-300">
                                Nao foi possivel copiar automaticamente.
                              </span>
                            )}
                          </div>

                          <label className="mt-5 flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3 text-sm text-gray-200">
                            <input
                              type="checkbox"
                              checked={pixConfirmed}
                              onChange={(event) => {
                                setPixConfirmed(event.target.checked);
                                setError("");
                              }}
                              className="mt-1"
                            />
                            <span>
                              Ja conferi o QR Code e quero concluir a compra.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      void createOrder();
                    }}
                    disabled={!canSubmit}
                    className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {placingOrder ? "Finalizando..." : "Finalizar pedido"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {!order && <Back />}
      </main>
      <Footer />
    </div>
  );
}
