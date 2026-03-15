import React from "react";
import { Sparkles, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const cardsData = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Senior Product Designer",
    company: "Spotify",
    location: "San Francisco CA",
    available: true,
    skills: ["Product Design", "Figma", "User Research", "Design Systems", "Prototyping"],
    reasoning:
      "Sarah has led design systems work at Spotify for 4 years. Her background in user research aligns perfectly with your current product-led growth initiative and the open IC4 role.",
    priority: "high",
    action: "Add to shortlist",
    type: "recommend_designer",
    initials: "SC",
  },
  {
    id: 2,
    name: "Marcus Lee",
    role: "Lead UX Designer",
    company: "Airbnb",
    location: "New York NY",
    available: false,
    skills: ["UX Design", "Leadership", "Design Tokens", "Figma"],
    reasoning:
      "Marcus hasn't been contacted in 6 months. Strong leadership profile, ideal time to reconnect before Q2 hiring.",
    priority: "medium",
    action: "Schedule outreach",
    type: "reach_out",
    initials: "ML",
  },
  {
    id: 3,
    name: "Priya Nair",
    role: "Product Designer",
    company: "Meta",
    location: "Austin TX",
    available: true,
    skills: ["Mobile Design", "iOS", "Android", "Motion"],
    reasoning:
      "Priya's mobile-first portfolio directly matches your upcoming iOS redesign project scope.",
    priority: "urgent",
    action: "Add to shortlist",
    type: "recommend_designer",
    initials: "PN",
  },
];

const priorityBorderColors: Record<string, string> = {
  urgent: "border-l-red-400",
  high: "border-l-amber-400",
  medium: "border-l-blue-300",
  low: "border-l-transparent",
};

const priorityBadges: Record<string, { label: string; className: string }> = {
  urgent: { label: "Urgent", className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200" },
  high: { label: "High Priority", className: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200" },
  low: { label: "Low", className: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200" },
};

export default function HorizontalSplit() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 font-sans">
      <div className="flex flex-col gap-4 w-full max-w-[620px]">
        {cardsData.map((card) => (
          <div
            key={card.id}
            className={`group relative bg-background border rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex border-l-4 ${
              priorityBorderColors[card.priority] || "border-l-transparent"
            }`}
            style={{ width: "100%", maxWidth: "580px", margin: "0 auto" }}
          >
            {/* Dismiss button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Left Column: Identity */}
            <div className="w-[110px] shrink-0 border-r border-border/40 p-4 flex flex-col items-center justify-start text-center">
              <Avatar className="h-[60px] w-[60px] mb-3 border border-border/50 shadow-sm">
                <AvatarFallback className="font-serif text-lg bg-primary/10 text-primary font-medium">
                  {card.initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-sm leading-tight text-foreground mb-1">
                {card.name}
              </h3>
              <p className="text-[10px] text-muted-foreground leading-tight px-1">
                {card.location}
              </p>
              {card.available && (
                <Badge
                  variant="outline"
                  className="mt-3 text-[9px] px-1.5 py-0 h-4 bg-green-50 text-green-700 border-green-200 uppercase tracking-wider font-semibold"
                >
                  Available
                </Badge>
              )}
            </div>

            {/* Right Column: Content */}
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="pr-8 mb-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-sm font-medium text-foreground">
                      {card.role}{" "}
                      <span className="text-muted-foreground font-normal">
                        at {card.company}
                      </span>
                    </h4>
                    {card.priority !== "low" && (
                      <Badge
                        variant="secondary"
                        className={`h-5 text-[10px] px-1.5 rounded-sm border ${
                          priorityBadges[card.priority].className
                        }`}
                      >
                        {priorityBadges[card.priority].label}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* AI Reasoning Callout */}
                <div className="bg-muted/40 rounded-lg p-3 mb-4 flex gap-2.5 items-start border border-border/50">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed font-serif">
                    {card.reasoning}
                  </p>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {card.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 text-[10px] px-2 py-0 h-5 font-medium rounded-md border-transparent"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                <Button className="w-full bg-[#C8944B] hover:bg-[#B38341] text-white shadow-sm font-medium transition-colors">
                  {card.action}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
