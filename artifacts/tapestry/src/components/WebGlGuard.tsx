import { useEffect, useState, type ReactNode } from "react";

let cachedSupport: boolean | null = null;

function detectWebGl(): boolean {
  if (cachedSupport !== null) return cachedSupport;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    cachedSupport = !!ctx;
  } catch {
    cachedSupport = false;
  }
  return cachedSupport;
}

export function WebGlGuard({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(detectWebGl());
  }, []);
  if (!supported) return null;
  return <>{children}</>;
}
