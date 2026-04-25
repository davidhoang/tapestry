import { SignIn } from "@clerk/react";

export default function AuthPage() {
  return (
    <div className="flex justify-center">
      <SignIn routing="hash" />
    </div>
  );
}
