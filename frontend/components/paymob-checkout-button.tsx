"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Paymob?: (publicKey: string) => {
      checkoutButton: (clientSecret: string) => {
        mount: (selector: string) => void;
      };
    };
  }
}

type PaymobCheckoutButtonProps = {
  publicKey: string;
  clientSecret: string;
};

const PAYMOB_SCRIPT_ID = "paymob-js-sdk";
const PAYMOB_SCRIPT_SRC = "https://ksa.paymob.com/v1/pay.js";

function loadPaymobScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Paymob checkout can only load in the browser."));
      return;
    }

    if (window.Paymob) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(PAYMOB_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Paymob checkout SDK.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = PAYMOB_SCRIPT_ID;
    script.src = PAYMOB_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paymob checkout SDK."));
    document.body.appendChild(script);
  });
}

export function PaymobCheckoutButton({ publicKey, clientSecret }: PaymobCheckoutButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mountCheckoutButton() {
      try {
        setState("loading");
        setError(null);
        await loadPaymobScript();

        if (cancelled) return;
        if (!window.Paymob) {
          throw new Error("Paymob checkout SDK did not expose the expected API.");
        }
        if (!containerRef.current) {
          throw new Error("Paymob mount container is missing.");
        }

        const mountId = `paymob-checkout-${clientSecret.replace(/[^a-zA-Z0-9_-]/g, "")}`;
        containerRef.current.innerHTML = `<div id="${mountId}"></div>`;
        window.Paymob(publicKey).checkoutButton(clientSecret).mount(`#${mountId}`);
        setState("ready");
      } catch (mountError) {
        if (cancelled) return;
        setState("error");
        setError(mountError instanceof Error ? mountError.message : "Unable to prepare Paymob checkout.");
      }
    }

    void mountCheckoutButton();

    return () => {
      cancelled = true;
    };
  }, [clientSecret, publicKey]);

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="min-h-12" />
      {state === "loading" ? <p className="text-sm text-slate-500">Preparing secure Paymob checkout…</p> : null}
      {state === "ready" ? (
        <p className="text-sm text-slate-500">Use the Paymob button above to complete the payment securely.</p>
      ) : null}
      {state === "error" ? <p className="text-sm text-rose-600">{error ?? "Unable to prepare checkout."}</p> : null}
    </div>
  );
}
