import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
}

const COMMON_SKILLS = [
  "UI Design",
  "UX Design",
  "Web Design",
  "Mobile Design",
  "Product Design",
  "Branding",
  "Typography",
  "Illustration",
  "Motion Design",
  "Design Systems",
  "Figma",
  "Sketch",
  "Adobe XD",
];

export default function SkillsInput({ value, onChange }: SkillsInputProps) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()]);
      }
      setInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter((skill) => skill !== skillToRemove));
  };

  const addSkill = (skill: string) => {
    if (!value.includes(skill)) {
      onChange([...value, skill]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {value.map((skill, index) => (
          <Badge key={index} variant="secondary">
            {skill}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 hover:bg-transparent"
              onClick={() => removeSkill(skill)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <Input
        placeholder="Type a skill and press enter..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex flex-wrap gap-2">
        {COMMON_SKILLS.filter(skill => !value.includes(skill)).map((skill) => (
          <Button
            key={skill}
            variant="outline"
            size="sm"
            onClick={() => addSkill(skill)}
          >
            + {skill}
          </Button>
        ))}
      </div>
    </div>
  );
}
