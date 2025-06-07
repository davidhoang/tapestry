import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useUser } from "../hooks/use-user";

export default function HomePage() {
  const { user } = useUser();
  return (
    <div className="space-y-16">
      <section className="hero py-32 text-center space-y-6 relative">
        <div className="absolute inset-0 bg-[url('/images/img-hero.png')] 
          bg-cover bg-center bg-no-repeat opacity-30"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Design Talent Match
        </h1>
        <p className="text-lg text-muted-foreground max-w-prose mx-auto">
          This project is a <a href="http://www.proofofconcept.pub" target="_blank">Proof of Concept</a> experiment by David Hoang.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            {user ? (
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
