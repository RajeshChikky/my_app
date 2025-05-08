import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import PostCard from "@/components/post-card";
import StoryCircle from "@/components/story-circle";
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { 
  Loader2, Upload, X, ImagePlus, Camera, Send, Video, MusicIcon, 
  Scissors, RotateCcw, ZoomIn, Check, Crop, Film
} from "lucide-react";
import ReelsViewer from "@/components/reels-viewer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Cropper from 'react-easy-crop';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [postTimestamp, setPostTimestamp] = useState<Date | null>(null);
  
  // For image cropping
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropMode, setIsCropMode] = useState(false);
  
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });
  
  const { data: stories, isLoading: loadingStories } = useQuery({
    queryKey: ["/api/stories"],
  });
  
  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/posts", formData, true);
      return await response.json();
    },
    onSuccess: (data) => {
      // Set the post timestamp
      setPostTimestamp(new Date());
      
      // Reset the state
      setSelectedImage(null);
      setPreviewUrl(null);
      setCaption('');
      setIsUploadDialogOpen(false);
      setIsCropMode(false);
      
      // Invalidate the posts query to refetch the posts
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
      toast({
        title: "Post created",
        description: "Your post has been published successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Determine media type
      if (file.type.startsWith('image/')) {
        setMediaType('image');
      } else if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else if (file.type.startsWith('audio/')) {
        setMediaType('audio');
      }
      
      setSelectedImage(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
      setIsUploadDialogOpen(true);
    }
  };
  
  const handleUploadClick = () => {
    setIsPermissionDialogOpen(true);
  };
  
  const handlePermissionConfirm = () => {
    setIsPermissionDialogOpen(false);
    // Trigger file input click
    fileInputRef.current?.click();
  };
  
  // Crop related functions
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);
  
  // Function to create a cropped image
  const createCroppedImage = async () => {
    if (!previewUrl || !croppedAreaPixels) return null;
    
    // Create an image element
    const image = new Image();
    image.src = previewUrl;
    
    // Wait for image to load
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    
    // Create canvas and context
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Set canvas dimensions to cropped area
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    
    // Draw the cropped image on the canvas
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );
    
    // Convert canvas to blob
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped-image.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        }
      }, 'image/jpeg');
    });
  };
  
  const handleCreatePost = async () => {
    let fileToUpload = selectedImage;
    
    // If in crop mode, create a cropped image
    if (mediaType === 'image' && isCropMode && croppedAreaPixels) {
      try {
        const croppedFile = await createCroppedImage();
        if (croppedFile) {
          fileToUpload = croppedFile;
        }
      } catch (error) {
        console.error("Error cropping image:", error);
        toast({
          title: "Cropping failed",
          description: "There was an error cropping your image",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (!fileToUpload) return;
    
    const formData = new FormData();
    formData.append(mediaType, fileToUpload);
    formData.append('caption', caption);
    formData.append('mediaType', mediaType);
    
    createPostMutation.mutate(formData);
  };
  
  // Always render content even if user is not authenticated
  const mockUser = user || {
    id: 2,
    username: "RAJESH_CHIKKY",
    fullName: "RAJESH",
    profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
  };
  
  const handleMessageClick = () => {
    navigate("/messages/lil_lapislazuli");
  };
  
  // State to toggle between feed and reels
  const [showReels, setShowReels] = useState(false);
  
  const toggleReels = () => {
    setShowReels(!showReels);
  };
  
  // Add toggleReelsView function to window to make it globally accessible
  useEffect(() => {
    window.toggleReelsView = toggleReels;
    
    // Clean up on component unmount
    return () => {
      delete window.toggleReelsView;
    };
  }, [showReels]);

  return (
    <div className="pb-16 bg-[hsl(var(--instagram-bg))] min-h-screen">
      {showReels ? (
        // Show ReelsViewer when showReels is true
        <ReelsViewer />
      ) : (
        <>
          {/* Hidden file input - accept image, video, and audio files */}
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*,audio/*"
            onChange={handleFileInputChange}
          />
      
      {/* Permission Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new post</DialogTitle>
            <DialogDescription>
              Instagram Clone needs access to your device to upload photos, videos, or audio to your feed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center gap-8 my-6">
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center h-16 w-16 bg-blue-50 rounded-full mb-2">
                <Camera className="h-8 w-8 text-blue-500" />
              </div>
              <span className="text-sm">Photo</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center h-16 w-16 bg-purple-50 rounded-full mb-2">
                <Video className="h-8 w-8 text-purple-500" />
              </div>
              <span className="text-sm">Video</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center h-16 w-16 bg-green-50 rounded-full mb-2">
                <MusicIcon className="h-8 w-8 text-green-500" />
              </div>
              <span className="text-sm">Audio</span>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePermissionConfirm}>
              Select from Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Media Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-[350px] sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create new post</DialogTitle>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-gray-500">
                {mediaType === 'image' ? 'Photo' : mediaType === 'video' ? 'Video' : 'Audio'} • {postTimestamp ? 'Posted' : 'New post'}
              </span>
              {postTimestamp && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {Math.floor((new Date().getTime() - postTimestamp.getTime()) / 1000)}s ago
                </span>
              )}
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="edit" disabled={!previewUrl || mediaType !== 'image'}>
                Edit & Crop
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="flex flex-col gap-4">
              {previewUrl && (
                <div className="relative w-full h-60 sm:h-80 bg-black/5 rounded-md overflow-hidden">
                  {mediaType === 'image' && (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                  )}
                  {mediaType === 'video' && (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                  {mediaType === 'audio' && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <MusicIcon className="w-24 h-24 text-gray-400 mb-4" />
                      <audio src={previewUrl} controls className="w-full max-w-md" />
                    </div>
                  )}
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                      setIsUploadDialogOpen(false);
                      setIsCropMode(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {mediaType === 'image' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-2 right-2"
                      onClick={() => setIsCropMode(true)}
                    >
                      <Crop className="h-4 w-4 mr-2" />
                      Crop
                    </Button>
                  )}
                </div>
              )}
              
              <Textarea
                placeholder="Write a caption..."
                className="resize-none h-20"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </TabsContent>
            
            <TabsContent value="edit" className="flex flex-col gap-4">
              {previewUrl && mediaType === 'image' && (
                <div className="relative w-full h-80 bg-black">
                  <div className="relative h-full">
                    <Cropper
                      image={previewUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    >
                      <ZoomIn className="h-4 w-4 mr-1" />
                      -
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    >
                      <ZoomIn className="h-4 w-4 mr-1" />
                      +
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsCropMode(false)}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={() => {
                    setIsCropMode(false);
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Apply Crop
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button 
              onClick={handleCreatePost} 
              disabled={!selectedImage || (createPostMutation.isPending || false)}
              className="w-full"
            >
              {createPostMutation.isPending || false ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Top Navigation */}
      <Navbar onMessageClick={handleMessageClick} />
      
      {/* Upload button */}
      <div className="fixed bottom-16 right-4 z-10">
        <Button 
          onClick={handleUploadClick} 
          className="rounded-full h-14 w-14 shadow-lg" 
          size="icon"
        >
          <ImagePlus className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Stories Section */}
      <div className="mt-14 px-2 overflow-x-auto">
        <div className="flex space-x-4 p-2">
          {/* Your Story */}
          <StoryCircle
            username="Your story"
            isCurrentUser={true}
            imageUrl={mockUser.profilePicture || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
            onClick={() => {}}
          />
          
          {/* Mock Stories - These would come from the API in a real app */}
          <StoryCircle
            username="emily_j"
            imageUrl="https://images.unsplash.com/photo-1438761681033-6461ffad8d80"
            onClick={() => {}}
          />
          <StoryCircle
            username="david_m"
            imageUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
            onClick={() => {}}
          />
          <StoryCircle
            username="sophia_r"
            imageUrl="https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb"
            onClick={() => {}}
          />
          <StoryCircle
            username="michael_k"
            imageUrl="https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
            onClick={() => {}}
          />
          <StoryCircle
            username="olivia_t"
            imageUrl="https://images.unsplash.com/photo-1580489944761-15a19d654956"
            onClick={() => {}}
          />
        </div>
      </div>
      
      {/* Feed Posts */}
      <div className="mt-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="p-4 text-center">
            <p className="text-gray-500">No posts yet. Follow some users to see their posts here!</p>
          </div>
        )}
        
        {/* Sample Posts for Layout */}
        <PostCard 
          post={{
            id: 9999,
            userId: 1,
            caption: "Coffee catch-ups with the best team ☕️ #worklife #friends",
            imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
            location: "New York, NY",
            likes: 2456,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          }}
          user={{
            id: 1,
            username: "jessica_smith",
            password: "",
            profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
            fullName: "Jessica Smith",
            bio: null,
            email: null,
            isVerified: null
          }}
        />
        
        <PostCard 
          post={{
            id: 9998,
            userId: 2,
            caption: "Paradise found 🌴 Day 3 in Bali and I never want to leave! #travel #bali #beach",
            imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206",
            location: "Bali, Indonesia",
            likes: 3892,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
          }}
          user={{
            id: 2,
            username: "travel_mike",
            password: "",
            profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
            fullName: "Mike Johnson",
            bio: null,
            email: null,
            isVerified: null
          }}
        />
        
        <PostCard 
          post={{
            id: 9997,
            userId: 3,
            caption: "Morning yoga is my meditation 🧘‍♀️ #wellness #yoga #morningroutine",
            imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
            location: "Los Angeles, CA",
            likes: 1755,
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
          }}
          user={{
            id: 3,
            username: "fitness_rachel",
            password: "",
            profilePicture: "https://images.unsplash.com/photo-1519699047748-de8e457a634e",
            fullName: "Rachel Williams",
            bio: null,
            email: null,
            isVerified: null
          }}
        />
      </div>
        </>
      )}
      
      {/* Reels Toggle Button */}
      <div className="fixed bottom-16 left-4 z-10">
        <Button 
          onClick={toggleReels} 
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-pink-500 to-orange-400 text-white" 
          size="icon"
          title={showReels ? "Show Feed" : "Show Reels"}
        >
          <Film className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
