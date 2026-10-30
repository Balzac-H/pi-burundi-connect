/* Client Pi SDK 2.0 — navigateur uniquement. */
type PaymentDTO = { identifier: string; transaction: { txid: string } | null };
type Callbacks = {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PaymentDTO) => void;
};
type PiSdk = {
  init: (o: { version: string; sandbox: boolean }) => void;
  authenticate: (scopes: string[], onIncomplete: (p: PaymentDTO) => void) => Promise<{ accessToken: string; user: { uid: string; username: string } }>;
  createPayment: (d: { amount: number; memo: string; metadata: Record<string, unknown> }, cb: Callbacks) => void;
};
declare global {
  interface Window { Pi?: PiSdk }
}

export const PI_SANDBOX = String(import.meta.env["VITE_PI_SANDBOX"] ?? "true") !== "false";
let initialise = false;
let scopesPaiement = false;

export function piDisponible(): boolean {
  return typeof window !== "undefined" && !!window.Pi;
}

export function initPi() {
  if (initialise || !piDisponible()) return;
  try {
    window.Pi!.init({ version: "2.0", sandbox: PI_SANDBOX });
    initialise = true;
  } catch (e) {
    console.error("Pi.init", e);
  }
}

export const piPaiementAutorise = () => scopesPaiement;

export async function authentifierPi(onIncomplete: (p: PaymentDTO) => void) {
  initPi();
  if (!piDisponible()) throw new Error("PI_ABSENT");
  const r = await window.Pi!.authenticate(["username", "payments"], onIncomplete);
  scopesPaiement = true;
  return r;
}

export function creerPaiementPi(d: { amount: number; memo: string; metadata: Record<string, unknown> }, cb: Callbacks) {
  if (!piDisponible()) throw new Error("PI_ABSENT");
  window.Pi!.createPayment(d, cb);
}

export type { PaymentDTO };
