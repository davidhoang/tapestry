import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sparkles, X, Briefcase } from "lucide-react";

interface CardData {
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
}

const mockData: CardData[] = [
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
  },
];

const priorityConfig = {
  urgent: { border: "border-red-400", badge: "bg-red-100 text-red-800", label: "Urgent" },
  high: { border: "border-amber-400", badge: "bg-amber-100 text-amber-800", label: "High" },
  medium: { border: "border-blue-300", badge: "bg-blue-100 text-blue-800", label: "Medium" },
  low: { border: "border-transparent", badge: "bg-stone-100 text-stone-800", label: "Low" },
};

function PortraitCard({ data }: { data: CardData }) {
  const pConfig = priorityConfig[data.priority];

  return (
    <Card className={`group relative w-full overflow-hidden bg-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg border border-border/50 border-t-4 ${pConfig.border}`}>
      {/* Dismiss Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-20 h-7 w-7 rounded-full opacity-0 transition-opacity group-hover:opacity-100 text-stone-500 hover:text-stone-900 bg-white/50 hover:bg-white"
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Hero Band */}
      <div className="relative h-[110px] w-full bg-gradient-to-br from-[#C8944B]/15 to-stone-50 border-b border-border/50 px-5 pt-4 pb-0 flex flex-col justify-start">
        <div className="flex justify-between items-start w-full absolute top-4 right-4 z-10">
          <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ml-auto ${pConfig.badge}`}>
            {pConfig.label}
          </Badge>
        </div>

        <div className="absolute -bottom-8 left-5">
          <div className="relative">
            <Avatar className="h-16 w-16 border-4 border-background shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${data.name.replace(' ', '')}`} />
              <AvatarFallback>{data.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {data.available && (
              <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background bg-green-500" title="Available" />
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pt-10 pb-2 flex flex-col">
        <h3 className="font-serif text-2xl font-bold leading-tight text-foreground" style={{ fontFamily: "'Crimson Text', serif" }}>
          {data.name}
        </h3>
        <p className="text-sm font-medium text-[#C8944B] mt-0.5">{data.title}</p>
        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-3">
          <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1" /> {data.company}</span>
          <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {data.location}</span>
        </div>
      </div>

      <CardContent className="p-5 pt-3 space-y-5">
        {/* AI Reasoning Callout */}
        <div className="relative rounded-xl bg-stone-50/80 p-4 border border-stone-200/60 mt-2">
          <div className="absolute -top-3 -left-3">
            <div className="bg-[#C8944B] text-white p-1.5 rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-sm text-stone-700 italic leading-relaxed pl-1 relative z-10">
            "{data.reasoning}"
          </p>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Core Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map(skill => (
              <Badge key={skill} variant="secondary" className="font-normal text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 border-transparent">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full bg-[#C8944B] hover:bg-[#b07f3e] text-white font-medium shadow-sm transition-colors mt-2">
          {data.action}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PortraitHero() {
  return (
    <div className="min-h-screen bg-stone-100/50 py-12 px-4 flex flex-col items-center justify-center font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');
      `}} />
      <div className="w-full max-w-[380px] space-y-4">
        {mockData.map(card => (
          <PortraitCard key={card.id} data={card} />
        ))}
      </div>
    </div>
  );
}
