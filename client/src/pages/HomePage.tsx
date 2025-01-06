import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="py-16 text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Curated talent matching for designers
        </h1>
        <p className="text-lg text-muted-foreground max-w-prose mx-auto">
          Connect with top design talent through our AI-powered matchmaking
          platform. Create curated lists and share with your team.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            {typeof isAuthenticated !== "undefined" ? (
              <Link href="/directory">Browse Directory</Link>
            ) : (
              <Link href="/auth">Browse Directory</Link>
            )}
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/matchmaker">Try AI Matchmaker</Link>
          </Button>
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
