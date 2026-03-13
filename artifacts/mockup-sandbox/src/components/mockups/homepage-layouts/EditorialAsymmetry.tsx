import './_group.css';
import { useState, useEffect } from 'react';
import { Database, List, Code, MapPin, Mail, ExternalLink, Menu } from 'lucide-react';

export function EditorialAsymmetry() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [displayedCode, setDisplayedCode] = useState("");
  const [isApiHovered, setIsApiHovered] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const mockDesigners = [
    { name: "Sarah Chen", title: "Principal Designer", company: "Figma", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop", location: "San Francisco, CA", bio: "Passionate about creating intuitive design systems that scale. Previously at Google and Meta." },
    { name: "Marcus Johnson", title: "Design Director", company: "Airbnb", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop", location: "New York, NY", bio: "Leading design teams to create memorable travel experiences. 10+ years in product design." },
    { name: "Elena Rodriguez", title: "Staff Designer", company: "Stripe", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop", location: "Austin, TX", bio: "Focused on financial product design and accessibility. Design systems enthusiast." },
    { name: "James Park", title: "Senior Designer", company: "Linear", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop", location: "Seattle, WA", bio: "Crafting productivity tools that developers love. Minimalist design advocate." },
    { name: "Aisha Patel", title: "Lead Designer", company: "Notion", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop", location: "Los Angeles, CA", bio: "Building the future of collaborative workspaces. Design leadership and mentorship." },
  ];

  const codeSnippet = `GET /api/designers\n?skills=figma`;
  const response = `[{ "name": "Sarah" }]`;

  useEffect(() => {
    if (isApiHovered) {
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
  }, [isApiHovered, codeSnippet]);

  return (
    <div className="min-h-screen bg-[#FBF8F3] font-['Inter'] text-slate-900 selection:bg-[#C8944B] selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#C8944B] to-[#8B5A2B] flex items-center justify-center text-white font-serif font-bold italic text-xl">
              T
            </div>
            <span className="font-serif text-2xl font-semibold italic text-white tracking-wide">
              Tapestry
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Sign in
            </button>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSfflPlc72SEcit6E8BH7TF7SCrUfBPxEv-ZN-asgo7Aq0joOQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#C8944B] hover:bg-[#B8843F] text-white px-5 py-2.5 rounded-sm transition-all text-sm font-medium shadow-lg shadow-[#C8944B]/20"
            >
              Request access
            </a>
          </div>

          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        {/* Mobile menu */}
        <div className={`md:hidden absolute top-20 left-0 w-full bg-[#0a0a0a] border-b border-white/10 transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-48' : 'max-h-0'}`}>
          <div className="px-6 py-4 flex flex-col gap-4">
            <button className="text-white/80 hover:text-white text-left transition-colors text-sm font-medium py-2">
              Sign in
            </button>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSfflPlc72SEcit6E8BH7TF7SCrUfBPxEv-ZN-asgo7Aq0joOQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#C8944B] text-white px-5 py-3 rounded-sm text-center transition-all text-sm font-medium"
            >
              Request access
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#0a0a0a] min-h-screen pt-32 pb-20 relative overflow-hidden flex items-center">
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#C8944B]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-[#8B5A2B]/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            
            {/* LEFT: Text Content (~60%) */}
            <div className="w-full lg:w-[55%] xl:w-[60%] text-left">
              <div className="inline-block mb-6 px-3 py-1 rounded-full border border-[#C8944B]/30 bg-[#C8944B]/10 text-[#C8944B] text-xs font-semibold tracking-wider uppercase">
                Now in Private Beta
              </div>
              <h1 className="font-['Crimson_Text'] text-5xl md:text-6xl lg:text-7xl xl:text-[84px] leading-[1.05] tracking-tight text-white mb-8 font-medium">
                High touch talent management in the <span className="italic text-[#C8944B]">intelligence era</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl font-light">
                Tapestry exists to ensure recruiters can focus on what's most important. The relationship with designers. We use intelligence to automate the boring administrative CRM work, not the one-to-one connection.
              </p>
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSfflPlc72SEcit6E8BH7TF7SCrUfBPxEv-ZN-asgo7Aq0joOQ/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-[#0a0a0a] px-8 py-4 rounded-sm transition-all text-base font-semibold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] hover:-translate-y-0.5"
              >
                Request access
              </a>
            </div>

            {/* RIGHT: Cascading Cards (~40%) */}
            <div className="w-full lg:w-[45%] xl:w-[40%] relative min-h-[600px] flex justify-center lg:justify-end mt-12 lg:mt-0">
              
              {/* Decorative Artwork */}
              <div className="absolute -right-12 top-20 w-64 h-64 opacity-40 mix-blend-screen rotate-[15deg] pointer-events-none z-0 filter contrast-125">
                <img 
                  src="/__mockup/images/visualelectric-1.png" 
                  alt="" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              {/* Waterfall Cards container */}
              <div className="relative w-full max-w-[340px] pt-12">
                {mockDesigners.map((designer, index) => {
                  const isHovered = hoveredCardIndex === index;
                  const isAnyHovered = hoveredCardIndex !== null;
                  
                  // Calculate cascading positions
                  const baseTop = index * 85;
                  const baseLeft = index * -15; // Shift left as they go down to create the diagonal
                  const zIndex = 10 - index; // Top cards have higher z-index
                  
                  return (
                    <div
                      key={designer.name}
                      onMouseEnter={() => setHoveredCardIndex(index)}
                      onMouseLeave={() => setHoveredCardIndex(null)}
                      className="absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer"
                      style={{
                        top: `${baseTop}px`,
                        left: `calc(50% + ${baseLeft}px)`,
                        transform: `translateX(-50%) ${
                          isHovered 
                            ? 'scale(1.05) translateY(-10px)' 
                            : isAnyHovered 
                              ? index < hoveredCardIndex 
                                ? 'translateY(-20px) scale(0.98) opacity-60' 
                                : 'translateY(40px) scale(0.98) opacity-60'
                              : 'scale(1)'
                        }`,
                        zIndex: isHovered ? 20 : zIndex,
                      }}
                    >
                      <div className={`bg-white p-5 rounded-xl border border-black/5 flex flex-col gap-4 w-[300px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 ${isHovered ? 'shadow-[0_30px_60px_-15px_rgba(200,148,75,0.3)] border-[#C8944B]/30' : ''}`}>
                        <div className="flex items-center gap-4">
                          <img
                            src={designer.photo}
                            alt={designer.name}
                            className="w-14 h-14 rounded-full object-cover shadow-inner"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base">{designer.name}</h3>
                            <p className="text-gray-500 text-xs mt-0.5">{designer.title} at {designer.company}</p>
                          </div>
                        </div>
                        
                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isHovered ? 'max-h-[150px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-2">
                              <MapPin className="w-3 h-3" />
                              {designer.location}
                            </div>
                            <p className="text-sm text-gray-600 leading-snug">
                              {designer.bio}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-[#FBF8F3] relative z-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="font-['Crimson_Text'] text-4xl md:text-5xl text-[#0a0a0a] mb-4">
              Classic features mixed with modern
            </h2>
            <div className="w-20 h-1 bg-[#C8944B]"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Directory Feature */}
            <div className="group bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#C8944B]/30 transition-all duration-500 flex flex-col">
              <div className="h-48 bg-slate-50 rounded-xl mb-8 flex items-center justify-center relative overflow-hidden border border-gray-100">
                <div className="relative w-full h-full flex items-center justify-center">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-24 h-32 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col items-center justify-center transition-all duration-500 group-hover:shadow-lg"
                      style={{
                        transform: `rotate(${(i - 2) * 8}deg) translateY(${Math.abs(i - 2) * 4}px)`,
                        zIndex: 10 - Math.abs(i - 2),
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8944B]/20 to-[#C8944B]/5 mb-3" />
                      <div className="w-14 h-2 bg-gray-200 rounded-full mb-1.5" />
                      <div className="w-8 h-1.5 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                  
                  {/* Hover state animation */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/90 backdrop-blur-[2px] transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 z-20">
                    <Database className="w-8 h-8 text-[#C8944B] mb-2" />
                    <span className="text-sm font-medium text-gray-900">Search 10,000+ profiles</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-serif text-gray-900 mb-3">Directory</h3>
              <p className="text-gray-600 leading-relaxed text-sm flex-grow">
                Browse our comprehensive database of designers. Filter by skills, experience, and location.
              </p>
            </div>

            {/* Lists Feature */}
            <div className="group bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#C8944B]/30 transition-all duration-500 flex flex-col">
              <div className="h-48 bg-slate-50 rounded-xl mb-8 flex items-center justify-center gap-8 relative overflow-hidden border border-gray-100">
                <div className="relative w-16 h-16">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute left-0 w-16 h-16 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-all duration-700"
                      style={{
                        transform: `translate(${i * 4}px, ${i * -4}px)`,
                        zIndex: 3 - i,
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
                
                <div className="w-8 h-px bg-gray-300 relative">
                  <div className="absolute top-1/2 left-0 w-full h-full border-t-2 border-dashed border-[#C8944B] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-[#C8944B] rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <div className="w-24 h-32 bg-white rounded-lg border-2 border-dashed border-gray-300 group-hover:border-[#C8944B] group-hover:bg-[#C8944B]/5 transition-colors duration-300 flex flex-col items-center p-3 gap-2">
                  <List className="w-5 h-5 text-gray-400 group-hover:text-[#C8944B] transition-colors" />
                  <div className="w-full space-y-2 mt-2">
                    <div className="w-full h-2 bg-gray-100 rounded group-hover:bg-[#C8944B]/20 transition-colors" />
                    <div className="w-3/4 h-2 bg-gray-100 rounded group-hover:bg-[#C8944B]/20 transition-colors delay-75" />
                    <div className="w-5/6 h-2 bg-gray-100 rounded group-hover:bg-[#C8944B]/20 transition-colors delay-150" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-serif text-gray-900 mb-3">Lists</h3>
              <p className="text-gray-600 leading-relaxed text-sm flex-grow">
                Create curated collections of designers. Share with your team to streamline selection.
              </p>
            </div>
          </div>

          {/* Full-width API Feature */}
          <div 
            className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#C8944B]/30 transition-all duration-500 overflow-hidden flex flex-col md:flex-row"
            onMouseEnter={() => setIsApiHovered(true)}
            onMouseLeave={() => setIsApiHovered(false)}
          >
            <div className="md:w-1/2 bg-[#0a0a0a] p-8 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C8944B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-full max-w-sm bg-[#111] rounded-lg border border-white/10 p-4 font-mono text-xs text-left shadow-2xl relative z-10">
                <div className="flex gap-1.5 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="text-green-400/90 h-10 whitespace-pre">
                  {displayedCode || <span className="text-gray-500">$ hover to execute...</span>}
                  {isApiHovered && displayedCode.length < codeSnippet.length && (
                    <span className="inline-block w-1.5 h-3 bg-green-400/80 ml-0.5 animate-pulse" />
                  )}
                </div>
                <div className={`text-blue-300/90 mt-2 transition-all duration-300 ${showResponse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  → {response}
                </div>
              </div>
            </div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <div className="w-12 h-12 bg-[#C8944B]/10 text-[#C8944B] rounded-xl flex items-center justify-center mb-6">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif text-gray-900 mb-4">API and MCP</h3>
              <p className="text-gray-600 leading-relaxed text-base mb-6">
                Connect Tapestry to your favorite chat assistant or build your own app. Our robust API lets you integrate designer data directly into your existing workflows.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-[#C8944B]">
                View documentation
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Built on Replit badge (preserved from original) */}
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
    </div>
  );
}
