import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
}

export default function SkillsInput({ value, onChange }: SkillsInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all unique skills when component mounts
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('/api/skills');
        if (!response.ok) {
          throw new Error('Failed to fetch skills');
        }
        const data = await response.json();
        const skillsArray = Array.isArray(data) ? data : [];
        setAllSkills(skillsArray);
      } catch (error) {
        console.error('Error fetching skills:', error);
        setAllSkills([]);
      }
    };
    
    fetchSkills();
  }, []);

  // Update suggestions based on input
  useEffect(() => {
    if (!input.trim() || !Array.isArray(allSkills)) {
      setSuggestions([]);
      return;
    }

    const inputLower = input.toLowerCase();
    const filtered = allSkills
      .filter(skill => 
        skill.toLowerCase().includes(inputLower) && 
        !value.includes(skill)
      )
      .slice(0, 5); // Limit to 5 suggestions for one row
    setSuggestions(filtered);
  }, [input, value, allSkills]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (!value.includes(trimmedInput)) {
        onChange([...value, trimmedInput]);
        // If it's a new skill, add it to allSkills
        if (!allSkills.includes(trimmedInput)) {
          setAllSkills(prev => [...prev, trimmedInput]);
        }
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      // Remove the last tag when backspace is pressed on empty input
      onChange(value.slice(0, -1));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter((skill) => skill !== skillToRemove));
  };

  const addSkill = (skill: string) => {
    if (!value.includes(skill)) {
      onChange([...value, skill]);
      setInput("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-2">
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
      <div className="space-y-2">
        <Input
          ref={inputRef}
          placeholder="Type a skill and press enter..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {suggestions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {suggestions.map((skill) => (
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
        )}
      </div>
    </div>
  );
}