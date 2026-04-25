import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, setTokenProvider } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import App from './App';
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

// Wires Clerk's getToken into the query client so every API request
// automatically includes the Authorization: Bearer <token> header.
function ClerkTokenSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenProvider(() => getToken());
  }, [getToken]);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <ClerkTokenSync />
        <App />
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
);
