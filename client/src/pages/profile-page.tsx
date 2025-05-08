import { useAuth } from "@/hooks/use-auth";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Post, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ChevronLeft, Bell, MoreHorizontal, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/navbar";
import ProfileEditForm from "@/components/profile-edit-form";
import { useState } from "react";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'tagged'>('posts');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  const { data: user, isLoading: loadingUser } = useQuery<User>({
    queryKey: [`/api/users/${username}`],
  });
  
  const { data: posts, isLoading: loadingPosts } = useQuery<Post[]>({
    queryKey: [`/api/users/${username}/posts`],
    enabled: !!user,
  });
  
  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/users/${username}/follow`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
    },
  });
  
  const handleBack = () => {
    navigate("/");
  };
  
  const handleMessageClick = () => {
    navigate(`/messages/${username}`);
  };
  
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold mb-2">User not found</h1>
        <p className="text-gray-500 mb-4">The user you're looking for doesn't exist or is not available.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }
  
  return (
    <div className="pb-16 bg-white min-h-screen">
      {/* Profile Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-[hsl(var(--instagram-border))] z-10">
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex items-center">
            <button onClick={handleBack} className="mr-4">
              <ChevronLeft className="text-[hsl(var(--instagram-text))] text-xl" />
            </button>
            <h1 className="text-lg font-semibold">{user.username}</h1>
          </div>
          <div className="flex space-x-4">
            <button className="text-[hsl(var(--instagram-text))]">
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-[hsl(var(--instagram-text))]">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="mt-14 px-4">
        <div className="flex items-center mb-4">
          <div className="mr-6">
            <div className="w-20 h-20 rounded-full overflow-hidden">
              <img 
                src={user.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                alt={`${user.username}'s profile picture`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">{user.username}</h2>
              {currentUser?.id !== user.id && (
                <Button 
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/90] text-white py-1 px-4 rounded text-sm font-semibold"
                >
                  {followMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Follow
                </Button>
              )}
            </div>
            
            <div className="flex space-x-6">
              <div className="flex flex-col items-center">
                <span className="font-semibold">574</span>
                <span className="text-sm">Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold">874K</span>
                <span className="text-sm">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold">441</span>
                <span className="text-sm">Following</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="font-semibold">{user.fullName || username}</h2>
          <p className="text-sm">Digital Creator</p>
          {user.bio && (
            <div className="whitespace-pre-line text-sm">{user.bio}</div>
          )}
          {user.email && (
            <p className="text-sm">✉ {user.email}</p>
          )}
          <p className="text-sm">Followed by analog and autonommy</p>
        </div>
        
        <div className="flex space-x-2 mb-4">
          {currentUser?.id === user.id ? (
            <Button 
              onClick={() => setIsEditProfileOpen(true)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-[hsl(var(--instagram-text))] py-1.5 rounded font-semibold text-sm"
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleMessageClick}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-[hsl(var(--instagram-text))] py-1.5 rounded font-semibold text-sm"
              >
                Message
              </Button>
              <Button className="flex-1 bg-gray-100 hover:bg-gray-200 text-[hsl(var(--instagram-text))] py-1.5 rounded font-semibold text-sm">
                Email
              </Button>
            </>
          )}
          <Button className="bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Edit Profile Dialog */}
        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            {user && (
              <ProfileEditForm user={user} onClose={() => setIsEditProfileOpen(false)} />
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Profile Tabs */}
      <div className="flex border-t border-[hsl(var(--instagram-border))]">
        <button 
          className={`flex-1 py-2 text-center ${activeTab === 'posts' ? 'border-b-2 border-[hsl(var(--instagram-text))]' : 'text-[hsl(var(--instagram-text-secondary))]'}`}
          onClick={() => setActiveTab('posts')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button 
          className={`flex-1 py-2 text-center ${activeTab === 'reels' ? 'border-b-2 border-[hsl(var(--instagram-text))]' : 'text-[hsl(var(--instagram-text-secondary))]'}`}
          onClick={() => setActiveTab('reels')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button 
          className={`flex-1 py-2 text-center ${activeTab === 'tagged' ? 'border-b-2 border-[hsl(var(--instagram-text))]' : 'text-[hsl(var(--instagram-text-secondary))]'}`}
          onClick={() => setActiveTab('tagged')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </button>
      </div>
      
      {/* Profile Grid */}
      <div className="grid grid-cols-3 gap-1">
        {loadingPosts ? (
          <div className="col-span-3 flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        ) : (
          <>
            {/* Sample content for layout */}
            <div className="aspect-square relative">
              <img 
                src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe"
                alt="Profile post" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg> 97k
              </div>
            </div>
            
            <div className="aspect-square relative">
              <img 
                src="https://images.unsplash.com/photo-1597248881519-db089d3744a5"
                alt="Profile post" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg> 23k
              </div>
            </div>
            
            <div className="aspect-square relative">
              <img 
                src="https://images.unsplash.com/photo-1499028344343-cd173ffc68a9"
                alt="Profile post" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg> 43k
              </div>
            </div>
            
            <div className="aspect-square relative">
              <img 
                src="https://images.unsplash.com/photo-1474552226712-ac0f0961a954"
                alt="Profile post" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg> 87k
              </div>
            </div>
            
            <div className="aspect-square relative">
              <img 
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470"
                alt="Profile post" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg> 67k
              </div>
            </div>
            
            <div className="aspect-square relative">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
                alt="Profile post" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg> 62k
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <Navbar />
    </div>
  );
}
