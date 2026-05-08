import { SignIn } from "@clerk/react";

function getRedirectUrl(): string {
  if (typeof window === "undefined") return "/";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("redirect_url");
  // Only allow same-origin relative paths to avoid open-redirect issues.
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/";
}

export default function AuthPage() {
  const redirectUrl = getRedirectUrl();
  return (
    <div className="flex justify-center py-12">
      <SignIn
        routing="hash"
        forceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
      />
    </div>
  );
}
