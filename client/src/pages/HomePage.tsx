import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="hero py-32 text-center space-y-6 relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c')] 
          bg-cover bg-center bg-no-repeat opacity-20"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          DH Talent Collective
        </h1>
        <p className="text-lg text-muted-foreground max-w-prose mx-auto">
          Connect with top design talent through our curated talent platform. 
          Create personalized lists and share with your team.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            {typeof isAuthenticated !== "undefined" ? (
              <Link href="/directory">Browse Directory</Link>
            ) : (
              <Link href="/auth">Browse Directory</Link>
            )}
          </Button>
        </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="rounded-lg border bg-card p-8 space-y-4">
          <h3 className="text-xl font-semibold">AI-powered matching</h3>
          <p className="text-muted-foreground">
            Our intelligent system matches you with designers based on your
            specific needs and preferences.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 space-y-4">
          <h3 className="text-xl font-semibold">Curated Lists</h3>
          <p className="text-muted-foreground">
            Designer lists are curated by experienced hiring managers.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 space-y-4">
          <h3 className="text-xl font-semibold">Detailed profiles</h3>
          <p className="text-muted-foreground">
            Access a community of verified design professionals with detailed
            profiles.
          </p>
        </div>
      </section>
    </div>
  );
}
