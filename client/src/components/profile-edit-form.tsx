import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Upload, Camera } from "lucide-react";
import { useEffect, useRef } from "react";

interface ProfileEditFormProps {
  user: User;
  onClose: () => void;
}

export default function ProfileEditForm({ user, onClose }: ProfileEditFormProps) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user.fullName || "");
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || "");
  const [bio, setBio] = useState(user.bio || "");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profilePicture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("PUT", `/api/users/${user.id}`, data, true);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.username}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully!",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("username", username);
    formData.append("fullName", fullName);
    
    if (email) {
      formData.append("email", email);
    }
    
    if (bio) {
      formData.append("bio", bio);
    }
    
    if (profilePicture) {
      formData.append("profilePicture", profilePicture);
    }
    
    updateProfileMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Profile picture" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-0 right-0">
            <button 
              type="button" 
              className="bg-blue-500 text-white rounded-full p-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleProfilePictureChange}
            />
          </div>
        </div>
        
        <h3 className="font-semibold text-lg mb-1">{user.username}</h3>
        <p className="text-sm text-gray-500 mb-4">Change profile photo</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input 
            id="username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Username"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input 
            id="fullName" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            placeholder="Full Name"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
            placeholder="Bio"
            className="resize-none h-24"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
        >
          Cancel
        </Button>
        
        <Button 
          type="submit" 
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </form>
  );
}