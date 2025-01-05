import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="py-16 text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Find the Perfect Designer
        </h1>
        <p className="text-lg text-muted-foreground max-w-prose mx-auto">
          Connect with top design talent through our AI-powered matchmaking platform.
          Create curated lists and share with your team.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/directory">Browse Directory</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/matchmaker">Try AI Matchmaker</Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="rounded-lg border bg-card p-8 space-y-4">
          <h3 className="text-xl font-semibold">AI-Powered Matching</h3>
          <p className="text-muted-foreground">
            Our intelligent system matches you with designers based on your specific needs and preferences.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 space-y-4">
          <h3 className="text-xl font-semibold">Curated Lists</h3>
          <p className="text-muted-foreground">
            Create and share custom lists of designers with your team or clients.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 space-y-4">
          <h3 className="text-xl font-semibold">Verified Profiles</h3>
          <p className="text-muted-foreground">
            Access a community of verified design professionals with detailed profiles.
          </p>
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Join Our Community</h2>
            <p className="text-muted-foreground">
              Whether you're a designer looking to showcase your work or a company seeking 
              design talent, our platform connects you with the right people.
            </p>
            <Button asChild>
              <Link href="/directory">Get Started</Link>
            </Button>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40"
              alt="Design collaboration"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
