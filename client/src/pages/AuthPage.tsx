import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

type AuthFormData = {
  email: string;
  password: string;
};

export default function AuthPage() {
  // Get container class based on whether component is rendered in modal
  const containerClass = window.location.pathname.startsWith('/lists/') 
    ? "w-full" 
    : "container py-4";

  return (
    <div className={containerClass}>
      <Card className="w-full shadow-none border-0 max-w-md mx-auto">
        <CardHeader className="space-y-1 py-3">
          <CardTitle className="text-xl text-center">Tapestry</CardTitle>
          <CardDescription className="text-center text-sm">
            Connect with top design talent
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm() {
  const { login } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AuthFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      const result = await login(data);
      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm() {
  const { register } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AuthFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      const result = await register(data);
      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register
        </Button>
      </form>
    </Form>
  );
}