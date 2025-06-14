import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useUser } from "../hooks/use-user";
import Navigation from "../components/Navigation";

export default function HomePage() {
  const { user } = useUser();
  return (
    <>
      {/* Full-width hero with navigation overlay */}
      <section className="hero relative min-h-screen w-screen ml-[calc(50%-50vw)] flex flex-col overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-design.png')",
            filter: "brightness(0.7) contrast(1.1)"
          }}
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        
        {/* Navigation overlay */}
        <div className="relative z-20">
          <Navigation />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center text-center space-y-8 px-4 max-w-4xl mx-auto">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
              Design Talent Match
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Connect with exceptional design talent through intelligent matching
            </p>
            
            <p className="text-sm text-white/70 text-center">
              A <a href="http://www.proofofconcept.pub" target="_blank" className="underline hover:text-white transition-colors">Proof of Concept</a> experiment by David Hoang
            </p>
            
            <div className="flex justify-center">
              <a 
                href="https://replit.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-black/20 backdrop-blur-sm rounded-full text-white/70 hover:text-white hover:bg-black/30 transition-all text-sm"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.5 8.5h-3.25c-.41 0-.75.34-.75.75v5.5c0 .41.34.75.75.75H17.5c.41 0 .75-.34.75-.75v-5.5c0-.41-.34-.75-.75-.75zm-7 0H7.25c-.41 0-.75.34-.75.75v5.5c0 .41.34.75.75.75H10.5c.41 0 .75-.34.75-.75v-5.5c0-.41-.34-.75-.75-.75z"/>
                </svg>
                Made with Replit
              </a>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6">
                {user ? (
                  <Link href="/directory">Browse Directory</Link>
                ) : (
                  <Link href="/auth">Browse Directory</Link>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>


    </>
  );
}
