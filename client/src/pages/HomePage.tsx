import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useUser } from "../hooks/use-user";
import Navigation from "../components/Navigation";
import { Database, List, Code, MapPin, Mail, ExternalLink } from "lucide-react";
import { HalftoneDots } from "@paper-design/shaders-react";
import { motion, AnimatePresence } from "framer-motion";
import heroCollage from "../assets/hero-collage.png";

type MockDesigner = {
  name: string;
  title: string;
  company: string;
  photo: string;
  rotation: number;
  spreadX: number;
  spreadY: number;
  location?: string;
  email?: string;
  portfolio?: string;
  bio?: string;
};

function DirectoryFeatureCard() {
  const [isHovered, setIsHovered] = useState(false);
  
  const miniDesigners = [
    { name: "A", rotation: -8, y: -20 },
    { name: "B", rotation: -4, y: -10 },
    { name: "C", rotation: 0, y: 0 },
    { name: "D", rotation: 4, y: 10 },
    { name: "E", rotation: 8, y: 20 },
  ];

  return (
    <Card 
      className="border-2 hover:border-primary/50 transition-colors overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-8 text-center">
        <div className="relative h-32 mb-6 flex items-center justify-center">
          {miniDesigners.map((designer, index) => (
            <motion.div
              key={designer.name}
              className="absolute w-16 h-20 bg-white rounded-lg shadow-md border border-gray-100 flex flex-col items-center justify-center"
              animate={{
                rotate: isHovered ? designer.rotation : designer.rotation * 0.5,
                y: isHovered ? designer.y : 0,
                scale: isHovered ? 1 : 0.95,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: index * 0.03,
              }}
              style={{ zIndex: 10 - Math.abs(index - 2) }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 mb-1" />
              <div className="w-10 h-1.5 bg-gray-200 rounded" />
              <div className="w-6 h-1 bg-gray-100 rounded mt-1" />
            </motion.div>
          ))}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Directory</h3>
        <p className="text-gray-600 leading-relaxed text-sm">
          Browse our comprehensive database of designers. Filter by skills, experience, and location.
        </p>
      </CardContent>
    </Card>
  );
}

function ListsFeatureCard() {
  const [isHovered, setIsHovered] = useState(false);
  
  const designers = [
    { id: 1, delay: 0 },
    { id: 2, delay: 0.15 },
    { id: 3, delay: 0.3 },
  ];

  return (
    <Card 
      className="border-2 hover:border-primary/50 transition-colors overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-8 text-center">
        <div className="relative h-32 mb-6 flex items-center justify-center gap-4">
          {/* Source pile */}
          <div className="relative w-16">
            {designers.map((d, i) => (
              <motion.div
                key={d.id}
                className="absolute left-0 w-12 h-12 bg-white rounded-full shadow-md border-2 border-gray-100 flex items-center justify-center"
                animate={{
                  x: isHovered ? 80 : 0,
                  y: isHovered ? (i * 28) - 28 : (i * 4) - 4,
                  scale: isHovered ? 0.9 : 1,
                  opacity: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: isHovered ? d.delay : (0.3 - d.delay),
                }}
                style={{ zIndex: 3 - i }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/20" />
              </motion.div>
            ))}
          </div>
          
          {/* Target list */}
          <div 
            className={`w-20 h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 p-2 transition-colors duration-200 ${
              isHovered ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <List className="w-4 h-4 text-gray-400 mb-1" />
            <AnimatePresence>
              {isHovered && designers.map((d, i) => (
                <motion.div
                  key={`list-${d.id}`}
                  className="w-full h-5 bg-white rounded shadow-sm flex items-center gap-1 px-1"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: d.delay + 0.2, duration: 0.2 }}
                >
                  <div className="w-3 h-3 rounded-full bg-primary/30" />
                  <div className="flex-1 h-1.5 bg-gray-200 rounded" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Lists</h3>
        <p className="text-gray-600 leading-relaxed text-sm">
          Create curated collections of designers. Share with your team to streamline selection.
        </p>
      </CardContent>
    </Card>
  );
}

function ApiFeatureCard() {
  const [isHovered, setIsHovered] = useState(false);
  const [displayedCode, setDisplayedCode] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  
  const codeSnippet = `GET /api/designers
?skills=figma`;
  
  const response = `[{ "name": "Sarah" }]`;

  useEffect(() => {
    if (isHovered) {
      setDisplayedCode("");
      setShowResponse(false);
      let index = 0;
      const interval = setInterval(() => {
        if (index < codeSnippet.length) {
          setDisplayedCode(codeSnippet.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowResponse(true), 200);
        }
      }, 40);
      return () => clearInterval(interval);
    } else {
      setDisplayedCode("");
      setShowResponse(false);
    }
  }, [isHovered]);

  return (
    <Card 
      className="border-2 hover:border-primary/50 transition-colors overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-8 text-center">
        <div className="relative h-32 mb-6 flex flex-col items-center justify-center">
          <motion.div 
            className="w-full bg-gray-900 rounded-lg p-3 font-mono text-xs text-left overflow-hidden"
            animate={{ 
              scale: isHovered ? 1.02 : 1,
              boxShadow: isHovered ? '0 10px 25px -5px rgba(0,0,0,0.2)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex gap-1 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="text-green-400 h-8">
              {displayedCode || <span className="text-gray-500">$ hover to see...</span>}
              {isHovered && displayedCode.length < codeSnippet.length && (
                <motion.span
                  className="inline-block w-1.5 h-3 bg-green-400 ml-0.5"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </div>
            <AnimatePresence>
              {showResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-blue-300 mt-1 text-[10px]"
                >
                  → {response}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">API and MCP</h3>
        <p className="text-gray-600 leading-relaxed text-sm">
          Connect Tapestry to your favorite chat assistant or build your own app.
        </p>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user } = useUser();
  const [isCardStackHovered, setIsCardStackHovered] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState<MockDesigner | null>(null);
  const cardStackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDesigner) {
        setSelectedDesigner(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (selectedDesigner && cardStackRef.current && !cardStackRef.current.contains(e.target as Node)) {
        setSelectedDesigner(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedDesigner]);
  
  const mockDesigners: MockDesigner[] = [
    { name: "Sarah Chen", title: "Principal Designer", company: "Figma", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop", rotation: -6, spreadX: 0, spreadY: -80, location: "San Francisco, CA", email: "sarah@example.com", portfolio: "sarahchen.design", bio: "Passionate about creating intuitive design systems that scale. Previously at Google and Meta." },
    { name: "Marcus Johnson", title: "Design Director", company: "Airbnb", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop", rotation: -3, spreadX: 0, spreadY: -40, location: "New York, NY", email: "marcus@example.com", portfolio: "marcusjohnson.co", bio: "Leading design teams to create memorable travel experiences. 10+ years in product design." },
    { name: "Elena Rodriguez", title: "Staff Designer", company: "Stripe", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop", rotation: 0, spreadX: 0, spreadY: 0, location: "Austin, TX", email: "elena@example.com", portfolio: "elenarodriguez.design", bio: "Focused on financial product design and accessibility. Design systems enthusiast." },
    { name: "James Park", title: "Senior Designer", company: "Linear", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop", rotation: 3, spreadX: 0, spreadY: 40, location: "Seattle, WA", email: "james@example.com", portfolio: "jamespark.io", bio: "Crafting productivity tools that developers love. Minimalist design advocate." },
    { name: "Aisha Patel", title: "Lead Designer", company: "Notion", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop", rotation: 6, spreadX: 0, spreadY: 80, location: "Los Angeles, CA", email: "aisha@example.com", portfolio: "aishapatel.design", bio: "Building the future of collaborative workspaces. Design leadership and mentorship." },
  ];

  return (
    <>
      {/* Navigation */}
      <Navigation />

      {/* Designer Cards Stack Section - Main Hero */}
      <section className="py-16 overflow-hidden relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroCollage})`,
            filter: "brightness(0.85)"
          }}
        />
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
        
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Stacked Cards */}
            <div 
              ref={cardStackRef}
              className="relative w-full md:w-1/2 h-[400px] flex items-center justify-center"
              onMouseEnter={() => !selectedDesigner && setIsCardStackHovered(true)}
              onMouseLeave={() => !selectedDesigner && setIsCardStackHovered(false)}
            >
              {/* List Background - appears behind cards */}
              <div className={`absolute inset-4 bg-white rounded-2xl shadow-inner border-2 border-gray-200 overflow-hidden transition-opacity duration-500 ${isCardStackHovered && !selectedDesigner ? 'opacity-100' : 'opacity-30'}`}>
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-sm font-medium text-gray-600">My Designer List</span>
                </div>
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-2 w-16 bg-gray-100 rounded mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Stack */}
              <AnimatePresence>
                {mockDesigners.map((designer, index) => {
                  const isSelected = selectedDesigner?.name === designer.name;
                  const isAnySelected = selectedDesigner !== null;
                  
                  return (
                    <motion.div
                      key={designer.name}
                      layoutId={`card-${designer.name}`}
                      onClick={() => setSelectedDesigner(isSelected ? null : designer)}
                      className="absolute bg-white rounded-xl shadow-lg cursor-pointer"
                      initial={false}
                      animate={{
                        rotate: isSelected ? 0 : designer.rotation,
                        y: isSelected ? 0 : isCardStackHovered ? designer.spreadY : 0,
                        scale: isSelected ? 1.15 : isAnySelected && !isSelected ? 0.9 : 1,
                        opacity: isAnySelected && !isSelected ? 0 : 1,
                        width: isSelected ? 288 : 256,
                        padding: isSelected ? 24 : 20,
                      }}
                      whileHover={!isSelected && !isAnySelected ? { scale: 1.05 } : {}}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        opacity: { duration: 0.2 }
                      }}
                      style={{
                        zIndex: isSelected ? 50 : 10 + index,
                        boxShadow: isSelected 
                          ? '0 25px 50px -12px rgb(0 0 0 / 0.25)' 
                          : isCardStackHovered 
                            ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' 
                            : '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      }}
                    >
                      <motion.div 
                        className="flex gap-4"
                        animate={{
                          flexDirection: isSelected ? 'column' : 'row',
                          alignItems: 'center',
                          textAlign: isSelected ? 'center' : 'left',
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.img
                          src={designer.photo}
                          alt={designer.name}
                          className="rounded-full object-cover"
                          animate={{
                            width: isSelected ? 80 : 56,
                            height: isSelected ? 80 : 56,
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          style={{
                            boxShadow: isSelected ? '0 0 0 4px rgba(var(--primary), 0.1)' : 'none'
                          }}
                        />
                        <div>
                          <motion.h3 
                            className="font-semibold text-gray-900"
                            animate={{ fontSize: isSelected ? '18px' : '14px' }}
                          >
                            {designer.name}
                          </motion.h3>
                          <p className={`text-gray-600 ${isSelected ? 'text-sm' : 'text-xs'}`}>{designer.title}</p>
                          <p className={`text-gray-500 ${isSelected ? 'text-sm' : 'text-xs'}`}>{designer.company}</p>
                        </div>
                      </motion.div>
                      
                      {/* Expanded details */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="overflow-hidden mt-4"
                          >
                            {designer.location && (
                              <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">{designer.location}</span>
                              </div>
                            )}
                            {designer.bio && (
                              <p className="text-sm text-gray-600 leading-relaxed mb-4 text-center">
                                {designer.bio}
                              </p>
                            )}
                            <div className="flex gap-2 justify-center">
                              <Button variant="outline" size="sm" className="gap-1 text-xs">
                                <Mail className="w-3 h-3" />
                                Email
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1 text-xs">
                                <ExternalLink className="w-3 h-3" />
                                Portfolio
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* CTA Content */}
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                High touch talent management in the intelligence era
              </h2>
              <p className="text-lg text-white/90 leading-relaxed mb-8">
                Tapestry exists to ensure recruiters can focus on what's most important. The relationship with designers. We use intelligence to automate the boring administrative CRM work, not the one-to-one connection.
              </p>
              <Button asChild className="bg-white hover:bg-white/90 text-gray-900 px-8 py-3 text-lg">
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
              Classic features mixed with modern
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Directory Feature - Mini Card Stack */}
            <DirectoryFeatureCard />

            {/* Lists Feature - Drag to List Animation */}
            <ListsFeatureCard />

            {/* API and MCP Feature - Code Typing Animation */}
            <ApiFeatureCard />
          </div>
        </div>
      </section>

      {/* Tapestry Hero Section */}
      <section className="hero relative h-[50vh] w-screen ml-[calc(50%-50vw)] flex flex-col overflow-hidden">
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