import './_group.css';
import { useState, useEffect } from 'react';
import { Database, List, Code, MapPin, Mail, ExternalLink, Menu, X } from 'lucide-react';

type MockDesigner = {
  name: string;
  title: string;
  company: string;
  photo: string;
  location: string;
  email: string;
  portfolio: string;
  bio: string;
  top: string;
  left: string;
  rotation: number;
  scale: number;
  zIndex: number;
  delay: string;
};

const mockDesigners: MockDesigner[] = [
  { 
    name: "Sarah Chen", title: "Principal Designer", company: "Figma", 
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop", 
    location: "San Francisco, CA", email: "sarah@example.com", portfolio: "sarahchen.design", 
    bio: "Passionate about creating intuitive design systems that scale. Previously at Google and Meta.",
    top: "15%", left: "65%", rotation: 6, scale: 1.1, zIndex: 10, delay: "0s"
  },
  { 
    name: "Marcus Johnson", title: "Design Director", company: "Airbnb", 
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop", 
    location: "New York, NY", email: "marcus@example.com", portfolio: "marcusjohnson.co", 
    bio: "Leading design teams to create memorable travel experiences. 10+ years in product design.",
    top: "60%", left: "55%", rotation: -8, scale: 0.9, zIndex: 5, delay: "0.2s"
  },
  { 
    name: "Elena Rodriguez", title: "Staff Designer", company: "Stripe", 
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop", 
    location: "Austin, TX", email: "elena@example.com", portfolio: "elenarodriguez.design", 
    bio: "Focused on financial product design and accessibility. Design systems enthusiast.",
    top: "35%", left: "80%", rotation: 12, scale: 1, zIndex: 8, delay: "0.4s"
  },
  { 
    name: "James Park", title: "Senior Designer", company: "Linear", 
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop", 
    location: "Seattle, WA", email: "james@example.com", portfolio: "jamespark.io", 
    bio: "Crafting productivity tools that developers love. Minimalist design advocate.",
    top: "75%", left: "75%", rotation: -4, scale: 1.05, zIndex: 12, delay: "0.6s"
  },
  { 
    name: "Aisha Patel", title: "Lead Designer", company: "Notion", 
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop", 
    location: "Los Angeles, CA", email: "aisha@example.com", portfolio: "aishapatel.design", 
    bio: "Building the future of collaborative workspaces. Design leadership and mentorship.",
    top: "10%", left: "45%", rotation: -12, scale: 0.85, zIndex: 3, delay: "0.8s"
  }
];

function CodeTypingEffect({ isVisible }: { isVisible: boolean }) {
  const [code, setCode] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const fullCode = "GET /api/designers\n?skills=figma";
  
  useEffect(() => {
    if (!isVisible) {
      setCode("");
      setShowResponse(false);
      return;
    }
    
    let current = 0;
    const interval = setInterval(() => {
      if (current < fullCode.length) {
        setCode(fullCode.slice(0, current + 1));
        current++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowResponse(true), 400);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div className="w-full max-w-md mx-auto bg-[#1a1b26] rounded-xl overflow-hidden shadow-2xl transition-all duration-700 transform hover:scale-105">
      <div className="flex px-4 py-3 bg-[#1f2335] items-center gap-2 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-[#f7768e]" />
        <div className="w-3 h-3 rounded-full bg-[#e0af68]" />
        <div className="w-3 h-3 rounded-full bg-[#9ece6a]" />
        <div className="ml-2 text-xs text-white/40 font-mono">bash</div>
      </div>
      <div className="p-6 font-mono text-sm leading-relaxed">
        <div className="text-[#9ece6a] min-h-[48px]">
          {code}
          {code.length < fullCode.length && (
            <span className="inline-block w-2 h-4 bg-[#9ece6a] ml-1 animate-pulse align-middle" />
          )}
        </div>
        
        <div className={`mt-4 transition-all duration-500 overflow-hidden ${showResponse ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="text-[#7aa2f7]">
            → [{'{'} "name": "Sarah Chen", "match": "98%" {'}'}]
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImmersiveScroll() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activePanel, setActivePanel] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      const panels = document.querySelectorAll('.feature-panel');
      let currentActive = 0;
      panels.forEach((panel, index) => {
        const rect = panel.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          currentActive = index;
        }
      });
      setActivePanel(currentActive);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] font-['Inter'] selection:bg-[#C8944B] selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded bg-[#C8944B] text-white flex items-center justify-center font-bold text-xl group-hover:rotate-12 transition-transform duration-300">T</div>
            <span className={`font-['Crimson_Text'] text-2xl font-semibold tracking-wide ${isScrolled ? 'text-white' : 'text-white'}`}>Tapestry</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="text-white/80 hover:text-white font-medium text-sm transition-colors hidden md:block">
              Sign in
            </button>
            <button className="md:hidden text-white">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-[#0a0a0a] overflow-hidden pt-20">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/__mockup/images/visualelectric-1.png" 
            alt="Hero abstract" 
            className="w-full h-full object-cover opacity-[0.25] mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10 w-full h-full">
          <div className="flex flex-col md:flex-row h-full w-full">
            
            {/* Left Content */}
            <div className="w-full md:w-5/12 flex flex-col justify-center py-20 relative z-20">
              <div className="animate-[fade-in-up_1s_ease-out_forwards] opacity-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs uppercase tracking-widest font-semibold mb-8">
                  <span className="w-2 h-2 rounded-full bg-[#C8944B] animate-pulse"></span>
                  Intelligent Platform
                </div>
                
                <h1 className="font-['Crimson_Text'] text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] mb-8">
                  High touch talent management in the intelligence era
                </h1>
                
                <p className="text-lg md:text-xl text-white/60 leading-relaxed mb-10 max-w-xl font-light">
                  Tapestry exists to ensure recruiters can focus on what's most important. The relationship with designers. We use intelligence to automate the boring administrative CRM work, not the one-to-one connection.
                </p>
                
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfflPlc72SEcit6E8BH7TF7SCrUfBPxEv-ZN-asgo7Aq0joOQ/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-[#C8944B] hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(200,148,75,0.5)] group"
                >
                  Request access
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Scatter Layout */}
            <div className="w-full md:w-7/12 relative min-h-[500px] md:min-h-0 hidden md:block perspective-[1000px]">
              {mockDesigners.map((designer, idx) => (
                <div 
                  key={idx}
                  className="absolute animate-[float_6s_ease-in-out_infinite_alternate] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-105 hover:!z-50 cursor-pointer group"
                  style={{
                    top: designer.top,
                    left: designer.left,
                    transform: `rotate(${designer.rotation}deg) scale(${designer.scale}) translateZ(0)`,
                    zIndex: designer.zIndex,
                    animationDelay: designer.delay,
                  }}
                >
                  <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-[280px] overflow-hidden group-hover:border-white/30 transition-colors">
                    <div className="flex items-center gap-4 relative z-10">
                      <img src={designer.photo} alt={designer.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#C8944B]" />
                      <div>
                        <h3 className="font-semibold text-white text-lg">{designer.name}</h3>
                        <p className="text-[#C8944B] text-sm font-medium">{designer.title}</p>
                      </div>
                    </div>
                    
                    {/* Hover Content */}
                    <div className="max-h-0 opacity-0 group-hover:max-h-[200px] group-hover:opacity-100 transition-all duration-500 ease-in-out mt-0 group-hover:mt-4 pt-0 group-hover:pt-4 border-t border-transparent group-hover:border-white/10">
                      <p className="text-white/70 text-sm mb-3 line-clamp-2">{designer.bio}</p>
                      <div className="flex items-center gap-2 text-white/50 text-xs mb-3">
                        <MapPin size={12} /> {designer.location}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                          <Mail size={14} />
                        </span>
                        <span className="p-2 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                          <ExternalLink size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Features Section - Alternating Panels */}
      <section className="bg-white relative z-10">
        
        {/* Section Header */}
        <div className="py-24 text-center px-6">
          <h2 className="font-['Crimson_Text'] text-4xl md:text-5xl text-black font-semibold mb-4">
            Classic features mixed with modern
          </h2>
          <div className="w-24 h-1 bg-[#C8944B] mx-auto rounded-full"></div>
        </div>

        {/* Panel 1: Directory */}
        <div className="feature-panel py-32 bg-[#FBF8F3] overflow-hidden">
          <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            <div className="w-full md:w-1/2 transition-all duration-1000 transform translate-x-0 opacity-100">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-8 text-[#C8944B]">
                <Database size={32} />
              </div>
              <h3 className="font-['Crimson_Text'] text-4xl md:text-5xl font-semibold text-[#111827] mb-6">Directory</h3>
              <p className="text-lg text-gray-600 leading-relaxed font-light mb-8 max-w-lg">
                Browse our comprehensive database of designers. Filter by skills, experience, and location with incredible speed and precision. The intelligence layer does the heavy lifting so you don't have to.
              </p>
            </div>
            <div className="w-full md:w-1/2 relative min-h-[400px]">
              {/* Stack visual */}
              <div className="relative w-full max-w-md mx-auto aspect-square group">
                <div className="absolute inset-0 bg-[#C8944B]/10 rounded-full blur-3xl group-hover:bg-[#C8944B]/20 transition-all duration-700"></div>
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="absolute bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm left-1/2 -translate-x-1/2 border border-gray-100 transition-all duration-500 ease-out"
                    style={{
                      top: `${(i - 1) * 20}px`,
                      transform: `translateX(-50%) scale(${1 - (3 - i) * 0.05}) translateY(${activePanel === 0 ? '0' : '40px'})`,
                      opacity: activePanel === 0 ? (i / 3) + 0.2 : 0,
                      zIndex: i
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Lists */}
        <div className="feature-panel py-32 bg-white overflow-hidden border-y border-gray-100">
          <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row-reverse items-center gap-16 lg:gap-24">
            <div className="w-full md:w-1/2 transition-all duration-1000 transform translate-x-0 opacity-100">
              <div className="w-16 h-16 bg-[#FBF8F3] rounded-2xl flex items-center justify-center shadow-sm mb-8 text-[#C8944B]">
                <List size={32} />
              </div>
              <h3 className="font-['Crimson_Text'] text-4xl md:text-5xl font-semibold text-[#111827] mb-6">Lists</h3>
              <p className="text-lg text-gray-600 leading-relaxed font-light mb-8 max-w-lg">
                Create curated collections of designers. Share with your team to streamline selection. Drag and drop to organize, comment inline, and make decisions faster together.
              </p>
            </div>
            <div className="w-full md:w-1/2">
              {/* Drag to list visual */}
              <div className="bg-[#fafaf9] rounded-3xl p-8 border border-gray-200 shadow-inner relative max-w-lg mx-auto overflow-hidden group">
                <div className="flex justify-between items-stretch gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="h-6 w-24 bg-gray-200 rounded"></div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 transition-transform duration-500 ${activePanel === 1 ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`} style={{ transitionDelay: \`\${i * 150}ms\` }}>
                        <div className="w-8 h-8 rounded-full bg-[#C8944B]/20"></div>
                        <div className="h-2 w-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                  <div className={`w-32 rounded-2xl border-2 border-dashed border-[#C8944B]/30 bg-[#C8944B]/5 flex flex-col items-center justify-center p-4 transition-all duration-700 ${activePanel === 1 ? 'scale-100' : 'scale-90'}`}>
                    <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center mb-4">
                      <List className="text-[#C8944B]" size={20} />
                    </div>
                    <div className="text-xs font-semibold text-[#C8944B] uppercase tracking-wider text-center">Drop to list</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: API / MCP */}
        <div className="feature-panel py-32 bg-[#111827] text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,148,75,0.1),transparent_50%)]"></div>
          <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-16 lg:gap-24 relative z-10">
            <div className="w-full md:w-1/2 transition-all duration-1000 transform translate-x-0 opacity-100">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/5 mb-8 text-[#C8944B]">
                <Code size={32} />
              </div>
              <h3 className="font-['Crimson_Text'] text-4xl md:text-5xl font-semibold mb-6">API and MCP</h3>
              <p className="text-lg text-white/60 leading-relaxed font-light mb-8 max-w-lg">
                Connect Tapestry to your favorite chat assistant or build your own app. Our robust API and Context Protocol integrations give you programmatic access to the world's best design talent.
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <CodeTypingEffect isVisible={activePanel === 2} />
            </div>
          </div>
        </div>

      </section>

      {/* Built on Replit badge */}
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

      {/* Inline styles for animations */}
      <style dangerouslySetInnerHTML={{__html: \`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      \`}} />
    </div>
  );
}
