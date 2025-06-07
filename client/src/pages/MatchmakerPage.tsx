import { useState } from "react";
import { useDesigners } from "@/hooks/use-designer";
import DesignerCard from "@/components/DesignerCard";
import SkillsInput from "@/components/SkillsInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SelectDesigner } from "@db/schema";

const EXPERIENCE_LEVELS = [
  "Junior",
  "Mid-Level",
  "Senior",
  "Lead",
  "Principal",
];

export default function MatchmakerPage() {
  const { data: designers, isLoading } = useDesigners();
  const [requirements, setRequirements] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [matchedDesigners, setMatchedDesigners] = useState<SelectDesigner[]>();

  const handleMatch = async () => {
    setIsMatching(true);
    try {
      // Simulate AI matching with a simple filter
      // In a real app, this would call an AI service
      const matches = designers?.filter(designer => {
        const levelMatch = !selectedLevel || designer.level === selectedLevel;
        const skillsMatch = selectedSkills.length === 0 || 
                           selectedSkills.every(skill => designer.skills.includes(skill));
        return levelMatch && skillsMatch;
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMatchedDesigners(matches);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Design Talent Match AI</h1>
        <p className="text-muted-foreground">
          Let our AI find the perfect designer match based on your requirements.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Requirements</label>
          <Textarea
            placeholder="Describe your project and requirements..."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Experience Level</label>
          <Select
            value={selectedLevel}
            onValueChange={setSelectedLevel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map(level => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Required Skills</label>
          <SkillsInput
            value={selectedSkills}
            onChange={setSelectedSkills}
          />
        </div>

        <Button
          onClick={handleMatch}
          disabled={isLoading || isMatching || (!requirements && !selectedLevel && selectedSkills.length === 0)}
          className="w-full"
        >
          {isMatching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Find Matches
        </Button>
      </div>

      {matchedDesigners && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Matched Designers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedDesigners.map((designer) => (
              <DesignerCard key={designer.id} designer={designer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
