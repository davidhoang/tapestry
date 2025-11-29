import { useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthPage() {
  return (
    <div className="w-full min-h-[300px]">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-center text-gray-900">
          Sign in
        </h2>
      </div>
      <LoginForm />
      <div className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        <Link href="/register" className="text-primary underline">
          Sign up here
        </Link>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login({ email, password });
      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        window.dispatchEvent(new CustomEvent("closeAuthModal"));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md bg-white text-gray-900 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md bg-white text-gray-900 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-md font-medium bg-primary text-white text-base flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </button>
      </form>
    </div>
  );
}
