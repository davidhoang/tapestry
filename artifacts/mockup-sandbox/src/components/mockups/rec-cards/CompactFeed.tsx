import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecCardData {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  available: boolean;
  skills: string[];
  reasoning: string;
  priority: "urgent" | "high" | "medium" | "low";
  action: string;
  type: string;
  avatarUrl?: string;
}

const mockData: RecCardData[] = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "Senior Product Designer",
    company: "Spotify",
    location: "San Francisco CA",
    available: true,
    skills: ["Product Design", "Figma", "User Research", "Design Systems", "Prototyping"],
    reasoning: "Sarah has led design systems work at Spotify for 4 years. Her background in user research aligns perfectly with your current product-led growth initiative and the open IC4 role.",
    priority: "high",
    action: "Add to shortlist",
    type: "recommend_designer",
    avatarUrl: "/images/card-covers/img-cover-1.png",
  },
  {
    id: "2",
    name: "Marcus Lee",
    title: "Lead UX Designer",
    company: "Airbnb",
    location: "New York NY",
    available: false,
    skills: ["UX Design", "Leadership", "Design Tokens", "Figma"],
    reasoning: "Marcus hasn't been contacted in 6 months. Strong leadership profile, ideal time to reconnect before Q2 hiring.",
    priority: "medium",
    action: "Schedule outreach",
    type: "reach_out",
    avatarUrl: "/images/card-covers/img-cover-2.png",
  },
  {
    id: "3",
    name: "Priya Nair",
    title: "Product Designer",
    company: "Meta",
    location: "Austin TX",
    available: true,
    skills: ["Mobile Design", "iOS", "Android", "Motion"],
    reasoning: "Priya's mobile-first portfolio directly matches your upcoming iOS redesign project scope.",
    priority: "urgent",
    action: "Add to shortlist",
    type: "recommend_designer",
    avatarUrl: "/images/card-covers/img-cover-3.png",
  }
];

const priorityConfig = {
  urgent: { border: "border-l-red-400", dot: "bg-red-400" },
  high: { border: "border-l-amber-400", dot: "bg-amber-400" },
  medium: { border: "border-l-blue-300", dot: "bg-blue-300" },
  low: { border: "border-l-transparent", dot: "bg-transparent" },
};

const CompactFeedCard = ({ card }: { card: RecCardData }) => {
  const [expanded, setExpanded] = useState(false);
  const isTruncated = card.reasoning.length > 60;
  
  return (
    <div className={cn(
      "group relative flex flex-col p-4 bg-background border rounded-md shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
      "border-l-[3px]",
      priorityConfig[card.priority].border
    )}>
      
      {/* Absolute Dismiss Button - top right on hover */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-[28px] w-[28px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:bg-muted"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </Button>

      {/* Main Row */}
      <div className="flex gap-4 items-start">
        {/* Avatar Left */}
        <Avatar className="h-[40px] w-[40px] shrink-0 border">
          <AvatarImage src={card.avatarUrl} alt={card.name} className="object-cover" />
          <AvatarFallback className="font-serif bg-[#F5F0E6] text-[#C8944B]">{card.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        {/* Middle Section: Name, Title, Location (tight stack) */}
        <div className="flex-1 min-w-0 flex flex-col justify-start leading-tight">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-base text-foreground truncate inline">{card.name}</h3>
            {card.available && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                Available
              </span>
            )}
          </div>
          <div className="text-[13px] text-muted-foreground truncate mt-1">
            {card.title} at {card.company}
          </div>
          <div className="text-[12px] text-muted-foreground truncate mt-0.5">
            {card.location}
          </div>
        </div>

        {/* Far Right Column: Priority Dot + Accept/Dismiss Buttons */}
        <div className="flex flex-col items-center gap-2 shrink-0 self-start mr-8 group-hover:mr-0 transition-all duration-200">
          <div 
            className={cn("w-2 h-2 rounded-full", priorityConfig[card.priority].dot)} 
            title={`Priority: ${card.priority}`} 
          />
          <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon" 
              className="h-[28px] w-[28px] rounded bg-[#C8944B] hover:bg-[#B38340] text-white shadow-sm"
              title={card.action}
            >
              <Check className="w-4 h-4" />
            </Button>
            {/* Kept an explicit dismiss here to match stacked accept/dismiss requirement, though absolute one is also added per instructions */}
          </div>
        </div>
      </div>

      {/* Skills Row */}
      <div className="mt-3">
        <div className="flex flex-wrap gap-1.5">
          {card.skills.map(skill => (
            <Badge key={skill} variant="secondary" className="px-1.5 py-0.5 text-[11px] bg-muted/60 hover:bg-muted text-muted-foreground font-normal rounded-sm">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="mt-3 text-[13px] text-muted-foreground">
        <span className="font-medium text-[#C8944B]">AI Match: </span>
        {expanded ? card.reasoning : (isTruncated ? `${card.reasoning.substring(0, 60)}...` : card.reasoning)}
        {isTruncated && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="inline-flex items-center ml-1 text-[#C8944B] hover:opacity-80 font-medium transition-opacity focus:outline-none"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default function CompactFeed() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center font-sans">
      <div className="w-full max-w-2xl flex flex-col gap-4 py-8">
        <div className="mb-4">
          <h2 className="text-2xl font-serif font-bold text-foreground">Compact Review Feed</h2>
          <p className="text-sm text-muted-foreground mt-1">Review your prioritized matches efficiently.</p>
        </div>
        
        <div className="flex flex-col gap-4">
          {mockData.map(card => (
            <CompactFeedCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
