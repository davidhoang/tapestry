import { SignUp } from "@clerk/react";

export default function RegisterPage() {
  return (
    <div className="flex justify-center py-16">
      <SignUp routing="hash" />
    </div>
  );
}
