import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useUser } from "../hooks/use-user";
import Navigation from "../components/Navigation";
import { Database, List, Zap } from "lucide-react";
import { HalftoneDots } from "@paper-design/shaders-react";

export default function HomePage() {
  const { user } = useUser();
  return (
    <>
      {/* Full-width hero with navigation overlay */}
      <section className="hero relative h-[70vh] w-screen ml-[calc(50%-50vw)] flex flex-col overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-design.png')",
            filter: "brightness(0.7) contrast(1.1)"
          }}
        />

        {/* Halftone Dots Shader Background - kept for future use
        <div className="absolute inset-0 opacity-20">
          <HalftoneDots
            width="100%"
            height="100%"
            image="/hero-design.png"
            colorBack="#f2f1e8"
            colorFront="#2b2b2b"
            originalColors={false}
            type="gooey"
            grid="hex"
            inverted={false}
            size={0.67}
            radius={1.25}
            contrast={0.4}
            grainMixer={0.2}
            grainOverlay={0.2}
            grainSize={0.5}
            scale={1}
            fit="cover"
          />
        </div>
        */}

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
              Tapestry
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              The intelligent way to stay in touch.
            </p>

            <p className="text-base text-white/70 text-center">
              A <a href="http://www.proofofconcept.pub" target="_blank" className="underline hover:text-white transition-colors">Proof of Concept</a> experiment by David Hoang
            </p>


          </div>
        </div>
      </section>

      {/* Designer Cards Stack Section */}
      <section className="py-16 bg-warmNeutral overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Stacked Cards */}
            <div className="relative w-full md:w-1/2 h-[400px] flex items-center justify-center">
              {/* Card Stack */}
              {[
                { name: "Sarah Chen", title: "Principal Designer", company: "Figma", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop", rotation: -8, offset: { x: -20, y: 20 } },
                { name: "Marcus Johnson", title: "Design Director", company: "Airbnb", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop", rotation: -4, offset: { x: -10, y: 10 } },
                { name: "Elena Rodriguez", title: "Staff Designer", company: "Stripe", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop", rotation: 0, offset: { x: 0, y: 0 } },
                { name: "James Park", title: "Senior Designer", company: "Linear", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop", rotation: 4, offset: { x: 10, y: -10 } },
                { name: "Aisha Patel", title: "Lead Designer", company: "Notion", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop", rotation: 8, offset: { x: 20, y: -20 } },
              ].map((designer, index) => (
                <div
                  key={designer.name}
                  className="absolute bg-white rounded-xl shadow-lg p-5 w-64 transition-all duration-300 hover:shadow-xl hover:scale-105"
                  style={{
                    transform: `rotate(${designer.rotation}deg) translate(${designer.offset.x}px, ${designer.offset.y}px)`,
                    zIndex: index + 1,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={designer.photo}
                      alt={designer.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{designer.name}</h3>
                      <p className="text-sm text-gray-600">{designer.title}</p>
                      <p className="text-sm text-gray-500">{designer.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Content */}
            <div className="w-full md:w-1/2 text-center md:text-left">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Tapestry is an intelligent platform that revolutionizes how you discover and connect with design talent. 
                Our comprehensive database and AI-powered matching system helps you find the perfect designer for any project.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg">
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSfflPlc72SEcit6E8BH7TF7SCrUfBPxEv-ZN-asgo7Aq0joOQ/viewform" target="_blank" rel="noopener noreferrer">
                  Request access
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Three powerful tools for intelligent curation
            </h2>
            <p className="text-lg text-gray-600">
              Three powerful tools for high touch recruiting
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Directory Feature */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Database className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Directory</h3>
                <p className="text-gray-600 leading-relaxed">
                  Browse our comprehensive database of designers. Filter by skills, experience, location, 
                  and availability to discover talent that matches your specific requirements.
                </p>
              </CardContent>
            </Card>

            {/* Lists Feature */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <List className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Lists</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create and manage curated collections of designers for different projects or needs. 
                  Share lists with your team or stakeholders to streamline the selection process.
                </p>
              </CardContent>
            </Card>

            {/* Matchmaker Feature */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Matchmaker</h3>
                <p className="text-gray-600 leading-relaxed">
                  Describe your project or role requirements and let our AI analyze your needs to 
                  recommend the most suitable designers from our database.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Built on Replit badge - only show when logged out */}
      {!user && (
        <a 
          href="https://replit.com/refer/dh-design" 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-50 hover:scale-105 transition-transform duration-200"
        >
          <img 
            src="/built-on-replit-badge.png" 
            alt="Built on Replit" 
            className="w-[99px] h-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
          />
        </a>
      )}
    </>
  );
}