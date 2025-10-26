import { forwardRef, useImperativeHandle } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SkillsInput from "@/components/SkillsInput";
import { useState } from "react";

interface ProfileIssue {
  type: string;
  field?: string;
  severity: string;
  description: string;
  impact: string;
}

interface Designer {
  id: number;
  name: string;
  title?: string;
  company?: string;
  description?: string;
  website?: string;
  linkedIn?: string;
  location?: string;
  photoUrl?: string;
  skills?: string[];
}

interface ProfileQuickEditProps {
  designer: Designer;
  issues: ProfileIssue[];
  onSuccess?: () => void;
}

export interface ProfileQuickEditHandle {
  save: () => Promise<void>;
  isPending: boolean;
}

const ProfileQuickEdit = forwardRef<ProfileQuickEditHandle, ProfileQuickEditProps>(
  ({ designer, issues, onSuccess }, ref) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    const [formData, setFormData] = useState({
      description: designer.description || "",
      website: designer.website || "",
      linkedIn: designer.linkedIn || "",
      location: designer.location || "",
      skills: designer.skills || [],
    });

    const updateMutation = useMutation({
      mutationFn: async (data: typeof formData) => {
        const response = await fetch(`/api/designers/${designer.id}/quick-update`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update profile');
        }
        
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/designers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/inbox/recommendations'] });
        toast({
          title: "Profile updated",
          description: "Changes saved successfully",
        });
        onSuccess?.();
      },
      onError: () => {
        toast({
          title: "Update failed",
          description: "Could not save changes",
          variant: "destructive",
        });
      },
    });

    useImperativeHandle(ref, () => ({
      save: async () => {
        await updateMutation.mutateAsync(formData);
      },
      isPending: updateMutation.isPending,
    }));

    const missingFields = issues.filter(i => i.type === 'missing_field');
    const otherIssues = issues.filter(i => i.type !== 'missing_field');

    return (
      <div className="space-y-4">
        {issues.some(i => i.field === 'description') && (
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              Description
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe design experience and expertise..."
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        {issues.some(i => i.field === 'website') && (
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              Portfolio Website
              <Badge variant="secondary" className="text-xs">Recommended</Badge>
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://yourportfolio.com"
            />
          </div>
        )}

        {issues.some(i => i.field === 'linkedIn') && (
          <div className="space-y-2">
            <Label htmlFor="linkedIn" className="flex items-center gap-2">
              LinkedIn Profile
              <Badge variant="secondary" className="text-xs">Recommended</Badge>
            </Label>
            <Input
              id="linkedIn"
              type="url"
              value={formData.linkedIn}
              onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
        )}

        {issues.some(i => i.field === 'location') && (
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              Location
              <Badge variant="secondary" className="text-xs">Recommended</Badge>
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="San Francisco, CA"
            />
          </div>
        )}

        {issues.some(i => i.type === 'incomplete_skills') && (
          <div className="space-y-2">
            <Label htmlFor="skills" className="flex items-center gap-2">
              Skills
              <Badge variant="secondary" className="text-xs">Add more</Badge>
            </Label>
            <SkillsInput
              value={formData.skills}
              onChange={(skills) => setFormData({ ...formData, skills })}
            />
          </div>
        )}

        {otherIssues.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Additional Improvements</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  {otherIssues.map((issue, index) => (
                    <li key={index}>• {issue.description}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ProfileQuickEdit.displayName = "ProfileQuickEdit";

export default ProfileQuickEdit;
