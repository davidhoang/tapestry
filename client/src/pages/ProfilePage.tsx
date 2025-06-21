import { useState, useRef, useEffect } from "react";
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
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's workspace
  const { data: workspaces } = useQuery({
    queryKey: ["/api/workspaces"],
    queryFn: async () => {
      const response = await fetch("/api/workspaces");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  const userWorkspace = workspaces?.[0];

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profilePhoto) {
      toast({
        title: "Info",
        description: "No changes to save",
      });
      return;
    }

    try {
      // Handle profile photo upload
      const result = await uploadPhotoMutation.mutateAsync(profilePhoto);
      
      // Update profile with new photo
      await updateProfileMutation.mutateAsync({
        profilePhotoUrl: result.profilePhotoUrl,
      });

      // Reset the selected photo
      setProfilePhoto(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    } catch (error) {
      // Individual mutations already handle their own errors
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error", 
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setProfilePhoto(file);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (userWorkspace?.name) {
      return userWorkspace.name.substring(0, 2).toUpperCase();
    }
    if (user.email) {
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
      <div className="container mx-auto px-4 py-8 pt-24 max-w-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Settings Card */}
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
                <AvatarImage 
                  src={profilePhoto ? URL.createObjectURL(profilePhoto) : user.profilePhotoUrl || undefined} 
                  alt="Profile photo" 
                />
                <AvatarFallback className="text-lg">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhotoMutation.isPending}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhotoMutation.isPending}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploadPhotoMutation.isPending ? 'Uploading...' : 'Upload photo'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>



              {/* Email Section (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Your email address cannot be changed
                </p>
              </div>

              {/* Member Since Section (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="memberSince">Member since</Label>
                <Input
                  id="memberSince"
                  type="text"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                  disabled
                  className="bg-muted"
                />
              </div>

            </CardContent>
          </Card>

          {/* Workspace Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Information</CardTitle>
              <CardDescription>
                Your workspace details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input
                  value={userWorkspace?.name || "Loading..."}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Your workspace URL: /{userWorkspace?.slug || 'loading'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Need to change your workspace name? Please contact support.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button (only shows when photo is selected) */}
          {profilePhoto && (
            <Button 
              type="submit" 
              className="w-full" 
              disabled={updateProfileMutation.isPending || uploadPhotoMutation.isPending}
            >
              {(updateProfileMutation.isPending || uploadPhotoMutation.isPending) && (
                <Upload className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Profile Photo
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}