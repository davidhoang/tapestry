import { useState, useRef } from "react";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Upload, User, Camera } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Navigation from "../components/Navigation";

interface ProfileUpdateData {
  profilePhotoUrl?: string;
}

interface WorkspaceUpdateData {
  name: string;
}

async function updateProfile(data: ProfileUpdateData) {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message);
  }

  return response.json();
}

async function uploadProfilePhoto(file: File) {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch('/api/profile/photo', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message);
  }

  return response.json();
}

export default function ProfilePage() {
  const { user } = useUser();
  const [workspaceName, setWorkspaceName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const photoMutation = useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && username !== user?.username) {
      profileMutation.mutate({ username: username.trim() });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await photoMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getUserInitials = () => {
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your account settings and profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.profilePhotoUrl || undefined} alt="Profile photo" />
                <AvatarFallback className="text-lg">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Username Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <form onSubmit={handleUsernameSubmit} className="flex gap-2 mt-1">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={profileMutation.isPending || !username.trim() || username === user.username}
                >
                  {profileMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </form>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a unique username for your profile
              </p>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Email</Label>
              <Input value={user.email} disabled className="mt-1" />
              <p className="text-sm text-muted-foreground mt-1">
                Your email address cannot be changed
              </p>
            </div>
            <div>
              <Label>Member since</Label>
              <Input 
                value={new Date(user.createdAt).toLocaleDateString()} 
                disabled 
                className="mt-1" 
              />
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}