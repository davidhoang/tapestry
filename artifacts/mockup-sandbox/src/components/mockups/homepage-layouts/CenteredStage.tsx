import './_group.css';
import { useState, useEffect } from 'react';
import { Database, List, Code, MapPin, Mail, ExternalLink, Menu } from 'lucide-react';

type MockDesigner = {
  name: string;
  title: string;
  company: string;
  photo: string;
  rotation: number;
  offsetY: number;
  location?: string;
  email?: string;
  portfolio?: string;
  bio?: string;
};

const mockDesigners: MockDesigner[] = [
  { name: "Sarah Chen", title: "Principal Designer", company: "Figma", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop", rotation: -8, offsetY: 12, location: "San Francisco, CA", email: "sarah@example.com", portfolio: "sarahchen.design", bio: "Passionate about creating intuitive design systems that scale. Previously at Google and Meta." },
  { name: "Marcus Johnson", title: "Design Director", company: "Airbnb", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop", rotation: -4, offsetY: 0, location: "New York, NY", email: "marcus@example.com", portfolio: "marcusjohnson.co", bio: "Leading design teams to create memorable travel experiences. 10+ years in product design." },
  { name: "Elena Rodriguez", title: "Staff Designer", company: "Stripe", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop", rotation: 0, offsetY: -8, location: "Austin, TX", email: "elena@example.com", portfolio: "elenarodriguez.design", bio: "Focused on financial product design and accessibility. Design systems enthusiast." },
  { name: "James Park", title: "Senior Designer", company: "Linear", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop", rotation: 4, offsetY: 0, location: "Seattle, WA", email: "james@example.com", portfolio: "jamespark.io", bio: "Crafting productivity tools that developers love. Minimalist design advocate." },
  { name: "Aisha Patel", title: "Lead Designer", company: "Notion", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop", rotation: 8, offsetY: 12, location: "Los Angeles, CA", email: "aisha@example.com", portfolio: "aishapatel.design", bio: "Building the future of collaborative workspaces. Design leadership and mentorship." },
];

function DirectoryFeatureCard() {
  const [isHovered, setIsHovered] = useState(false);
  
  const miniDesigners = [
    { name: "A", rotation: -12, y: -8 },
    { name: "B", rotation: -6, y: -4 },
    { name: "C", rotation: 0, y: 0 },
    { name: "D", rotation: 6, y: -4 },
    { name: "E", rotation: 12, y: -8 },
  ];

  return (
    <div 
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative pt-12 pb-10 px-8 flex flex-col items-center text-center h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C8944B] to-[#B8843F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative h-32 mb-8 flex items-center justify-center w-full">
        {miniDesigners.map((designer, index) => (
          <div
            key={designer.name}
            className="absolute w-16 h-20 bg-white rounded-lg shadow-md border border-gray-100 flex flex-col items-center justify-center transition-all duration-500 ease-out"
            style={{ 
              zIndex: 10 - Math.abs(index - 2),
              transform: isHovered 
                ? `translateY(${designer.y - 15}px) rotate(${designer.rotation * 1.5}deg) scale(1.05)` 
                : `translateY(0px) rotate(${designer.rotation * 0.5}deg) scale(0.95)`,
              transitionDelay: \`\${index * 30}ms\`
            }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8944B]/30 to-[#C8944B]/10 mb-1" />
            <div className="w-10 h-1.5 bg-gray-200 rounded" />
            <div className="w-6 h-1 bg-gray-100 rounded mt-1" />
          </div>
        ))}
      </div>
      <h3 className="text-2xl font-['Crimson_Text'] font-semibold text-gray-900 mb-4">Directory</h3>
      <p className="text-gray-600 leading-relaxed">
        Browse our comprehensive database of designers. Filter by skills, experience, and location.
      </p>
    </div>
  );
}

function ListsFeatureCard() {
  const [isHovered, setIsHovered] = useState(false);
  
  const designers = [
    { id: 1, delay: 0 },
    { id: 2, delay: 150 },
    { id: 3, delay: 300 },
  ];

  return (
    <div 
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative pt-12 pb-10 px-8 flex flex-col items-center text-center h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C8944B] to-[#B8843F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative h-32 mb-8 flex items-center justify-center gap-6 w-full">
        {/* Source pile */}
        <div className="relative w-16 h-16">
          {designers.map((d, i) => (
            <div
              key={d.id}
              className="absolute left-0 w-12 h-12 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center transition-all duration-500 ease-in-out"
              style={{
                transform: isHovered 
                  ? \`translate(80px, \${(i * 24) - 20}px) scale(0.8)\` 
                  : \`translate(0px, \${i * 4}px) scale(1)\`,
                opacity: 1,
                zIndex: 3 - i,
                transitionDelay: isHovered ? \`\${d.delay}ms\` : \`\${300 - d.delay}ms\`
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8944B]/40 to-[#C8944B]/20" />
            </div>
          ))}
        </div>
        
        {/* Target list */}
        <div 
          className={\`w-24 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 p-2 transition-colors duration-300 \${
            isHovered ? 'border-[#C8944B] bg-[#C8944B]/5' : 'border-gray-200 bg-gray-50'
          }\`}
        >
          <List className="w-5 h-5 text-gray-400 mb-1" />
          {designers.map((d, i) => (
            <div
              key={\`list-\${d.id}\`}
              className="w-full h-4 bg-white rounded shadow-sm flex items-center gap-1 px-1 transition-all duration-300"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                transitionDelay: \`\${d.delay + 200}ms\`
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#C8944B]/30" />
              <div className="flex-1 h-1 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      <h3 className="text-2xl font-['Crimson_Text'] font-semibold text-gray-900 mb-4">Lists</h3>
      <p className="text-gray-600 leading-relaxed">
        Create curated collections of designers. Share with your team to streamline selection.
      </p>
    </div>
  );
}

function ApiFeatureCard() {
  const [isHovered, setIsHovered] = useState(false);
  const [displayedCode, setDisplayedCode] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  
  const codeSnippet = \`GET /api/designers
?skills=figma\`;
  
  const response = \`[{ "name": "Sarah" }]\`;

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
  }, [isHovered, codeSnippet]);

  return (
    <div 
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative pt-12 pb-10 px-8 flex flex-col items-center text-center h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C8944B] to-[#B8843F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative h-32 mb-8 flex flex-col items-center justify-center w-full">
        <div 
          className="w-full max-w-[200px] bg-gray-900 rounded-xl p-4 font-mono text-xs text-left overflow-hidden transition-all duration-500"
          style={{ 
            transform: isHovered ? 'scale(1.05) translateY(-5px)' : 'scale(1) translateY(0)',
            boxShadow: isHovered ? '0 15px 30px -10px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex gap-1.5 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="text-green-400 h-10 leading-relaxed">
            {displayedCode || <span className="text-gray-500">$ hover to see...</span>}
            {isHovered && displayedCode.length < codeSnippet.length && (
              <span className="inline-block w-1.5 h-3 bg-green-400 ml-0.5 animate-pulse" />
            )}
          </div>
          <div 
            className="text-blue-300 mt-2 text-[10px] transition-all duration-300"
            style={{ 
              opacity: showResponse ? 1 : 0,
              transform: showResponse ? 'translateY(0)' : 'translateY(5px)'
            }}
          >
            → {response}
          </div>
        </div>
      </div>
      <h3 className="text-2xl font-['Crimson_Text'] font-semibold text-gray-900 mb-4">API and MCP</h3>
      <p className="text-gray-600 leading-relaxed">
        Connect Tapestry to your favorite chat assistant or build your own app.
      </p>
    </div>
  );
}

export function CenteredStage() {
  const [selectedDesigner, setSelectedDesigner] = useState<MockDesigner | null>(null);

  // Close modal on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDesigner(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] font-['Inter'] flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-['Crimson_Text'] text-2xl font-semibold italic">Tapestry</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-white/80 hover:text-white transition-colors text-sm font-medium hidden md:block">
              For Recruiters
            </button>
            <button className="text-white/80 hover:text-white transition-colors text-sm font-medium hidden md:block">
              For Designers
            </button>
            <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
              Sign in
            </button>
            <button className="text-white md:hidden">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-[#0a0a0a] min-h-[90vh] flex flex-col justify-center">
        {/* Hero Artwork Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/__mockup/images/visualelectric-1.png" 
            alt="" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-[#0a0a0a]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 max-w-5xl flex flex-col items-center">
          
          {/* Horizontal Card Stage */}
          <div className="relative w-full h-[280px] flex items-center justify-center mb-12 mt-8 perspective-1000">
            <div className="flex items-center justify-center gap-2 md:gap-4 w-full">
              {mockDesigners.map((designer, index) => {
                const isHovered = selectedDesigner?.name === designer.name;
                const anyHovered = selectedDesigner !== null;
                
                return (
                  <div
                    key={designer.name}
                    onClick={() => setSelectedDesigner(isHovered ? null : designer)}
                    className="group relative cursor-pointer transition-all duration-500 ease-out"
                    style={{
                      transform: isHovered 
                        ? \`scale(1.1) translateY(-20px)\` 
                        : anyHovered
                          ? \`scale(0.9) translateY(10px) rotate(\${designer.rotation * 0.5}deg)\`
                          : \`translateY(\${designer.offsetY}px) rotate(\${designer.rotation}deg)\`,
                      zIndex: isHovered ? 50 : 10 + index,
                      opacity: anyHovered && !isHovered ? 0.6 : 1,
                    }}
                  >
                    <div className="bg-white p-3 md:p-4 rounded-2xl shadow-2xl w-[140px] md:w-[180px] border border-gray-100 transition-all duration-300 group-hover:shadow-[0_20px_40px_-15px_rgba(200,148,75,0.3)] group-hover:border-[#C8944B]/30">
                      <div className="aspect-square overflow-hidden rounded-xl mb-3 md:mb-4">
                        <img 
                          src={designer.photo} 
                          alt={designer.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{designer.name}</h3>
                        <p className="text-[#8B5A2B] text-xs truncate mt-0.5">{designer.title}</p>
                      </div>
                    </div>

                    {/* Active state indicator */}
                    <div 
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#C8944B] transition-all duration-300"
                      style={{ opacity: isHovered ? 1 : 0, transform: isHovered ? 'scale(1)' : 'scale(0)' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expanded Details Panel */}
          <div 
            className="w-full max-w-2xl bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 ease-in-out absolute z-20"
            style={{ 
              top: '50%',
              opacity: selectedDesigner ? 1 : 0,
              visibility: selectedDesigner ? 'visible' : 'hidden',
              transform: selectedDesigner ? 'translateY(80px) scale(1)' : 'translateY(100px) scale(0.95)',
              pointerEvents: selectedDesigner ? 'auto' : 'none'
            }}
          >
            {selectedDesigner && (
              <div className="p-6 md:p-8 flex flex-col items-center text-center">
                <button 
                  onClick={() => setSelectedDesigner(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  ✕
                </button>
                <h3 className="text-2xl font-['Crimson_Text'] text-white mb-1">{selectedDesigner.name}</h3>
                <p className="text-[#C8944B] font-medium mb-4">{selectedDesigner.title} at {selectedDesigner.company}</p>
                
                <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
                  {selectedDesigner.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedDesigner.location}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-white/80 max-w-md leading-relaxed mb-8">
                  {selectedDesigner.bio}
                </p>
                
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors text-sm">
                    <Mail className="w-4 h-4" />
                    Reach out
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors border border-white/20 text-sm">
                    <ExternalLink className="w-4 h-4" />
                    View portfolio
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messaging beneath the stage */}
          <div 
            className="text-center max-w-3xl mt-12 transition-all duration-500"
            style={{ 
              opacity: selectedDesigner ? 0.3 : 1,
              transform: selectedDesigner ? 'translateY(20px)' : 'translateY(0)'
            }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-['Crimson_Text'] font-bold text-white leading-[1.1] mb-6 tracking-tight">
              High touch talent management in the intelligence era
            </h1>
            <p className="text-xl text-white/70 leading-relaxed mb-10 max-w-2xl mx-auto font-light">
              Tapestry exists to ensure recruiters can focus on what's most important. The relationship with designers. We use intelligence to automate the boring administrative CRM work, not the one-to-one connection.
            </p>
            
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSfflPlc72SEcit6E8BH7TF7SCrUfBPxEv-ZN-asgo7Aq0joOQ/viewform" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-gradient-to-r from-[#C8944B] to-[#B8843F] text-white rounded-full hover:shadow-[0_0_30px_rgba(200,148,75,0.4)] transition-all duration-300 hover:scale-105"
            >
              Request access
            </a>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#fafaf9] relative z-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-['Crimson_Text'] font-bold text-gray-900 mb-6">
              Classic features mixed with modern
            </h2>
            <div className="w-24 h-1 bg-[#C8944B] mx-auto rounded-full opacity-50"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <DirectoryFeatureCard />
            <ListsFeatureCard />
            <ApiFeatureCard />
          </div>
        </div>
      </section>

      {/* Footer / Spacer */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gray-900 font-['Crimson_Text'] text-2xl font-semibold italic">Tapestry</span>
          </div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Tapestry. All rights reserved.</p>
        </div>
      </footer>

      {/* Replit Badge Mockup */}
      <div className="fixed bottom-5 right-5 z-50 hover:scale-105 transition-transform duration-200 cursor-pointer">
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.5 12a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
          </svg>
          <span className="text-xs font-semibold text-gray-700">Built on Replit</span>
        </div>
      </div>
    </div>
  );
}
