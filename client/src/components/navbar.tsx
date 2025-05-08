import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Home, Search, PlusSquare, Film, Heart, SendHorizontal, X, Loader2, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { InstagramLogo } from "./instagram-logo";
import type { User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface NavbarProps {
  onMessageClick?: () => void;
}

export default function Navbar({ onMessageClick }: NavbarProps = {}) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Set up WebSocket connection for real-time search
  useEffect(() => {
    if (showSearch && !wsRef.current) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;
      
      socket.onopen = () => {
        console.log("WebSocket connection established");
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'search_results') {
            setSearchResults(data.users);
            setIsSearching(false);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [showSearch]);
  
  // Handle search query changes
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        setIsSearching(true);
        wsRef.current.send(JSON.stringify({ type: 'search', query: searchQuery }));
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);
  
  if (!user) return null;
  
  const isHome = location === "/";
  
  const handleProfileClick = () => {
    navigate(`/profile/${user.username}`);
  };
  
  const handleHomeClick = () => {
    navigate("/");
  };
  
  const handleReelsClick = () => {
    console.log("Navigating to reels page");
    navigate("/reels");
  };
  
  const handleExploreUsersClick = () => {
    navigate("/explore-users");
  };
  
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showNewPost) setShowNewPost(false);
  };
  
  const toggleNewPost = () => {
    setShowNewPost(!showNewPost);
    // Reset state when toggling
    setSelectedFile(null);
    setImagePreview(null);
    setShowPermissionDialog(false);
    if (showSearch) setShowSearch(false);
  };
  
  const handleFileSelect = () => {
    // First show permission dialog
    setShowPermissionDialog(true);
  };
  
  const handlePermissionGranted = () => {
    // Hide permission dialog
    setShowPermissionDialog(false);
    
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Set selected file
    setSelectedFile(file);
    
    // Create preview for image
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
  };
  
  const handlePost = async () => {
    if (!selectedFile || isPosting) return;
    
    setIsPosting(true);
    
    try {
      // Create a FormData object to send the image
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('caption', caption);
      
      // Send request to server
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      // Clear form and close dialog on success
      setSelectedFile(null);
      setImagePreview(null);
      setCaption('');
      setShowNewPost(false);
      
      // Refresh posts on the home page
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };
  
  // Search overlay
  const renderSearchOverlay = () => {
    if (!showSearch) return null;
    
    return (
      <div className="fixed inset-0 bg-white z-20 pt-14">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <button onClick={toggleSearch} className="mr-2">
              <X className="h-6 w-6" />
            </button>
            <Input 
              type="text" 
              placeholder="Search" 
              className="flex-1 border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="py-4">
            {isSearching ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : searchQuery.length > 0 ? (
              <>
                <h3 className="font-semibold mb-2">Search Results</h3>
                <div className="space-y-4">
                  {searchResults.length > 0 ? (
                    searchResults.map((searchUser) => (
                      <div 
                        key={searchUser.id} 
                        className="flex items-center justify-between"
                        onClick={() => {
                          navigate(`/profile/${searchUser.username}`);
                          setShowSearch(false);
                        }}
                      >
                        <div className="flex items-center cursor-pointer">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                            <img 
                              src={searchUser.profilePicture || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                              alt={`${searchUser.username}'s profile`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{searchUser.username}</p>
                            <p className="text-xs text-gray-500">{searchUser.fullName}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No users found</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="font-semibold mb-2">Recent Searches</h3>
                <p className="text-gray-500 text-center py-4">Search for users to see results</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // New Post overlay
  const renderNewPostOverlay = () => {
    if (!showNewPost) return null;
    
    return (
      <div className="fixed inset-0 bg-white z-20 pt-14">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <button onClick={toggleNewPost}>
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold">New Post</h2>
            <button 
              className={`${selectedFile ? 'text-[hsl(var(--primary))]' : 'text-gray-300'} font-semibold`}
              disabled={!selectedFile || isPosting}
              onClick={handlePost}
            >
              {isPosting ? 'Posting...' : 'Share'}
            </button>
          </div>
          
          {imagePreview ? (
            <div className="flex flex-col space-y-4">
              <div className="relative w-full aspect-square rounded-md overflow-hidden border border-gray-200">
                <img 
                  src={imagePreview} 
                  alt="Image preview" 
                  className="w-full h-full object-contain"
                />
                <button 
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex flex-col space-y-4">
                <textarea 
                  placeholder="Write a caption..." 
                  className="w-full p-3 border border-gray-300 rounded-md resize-none h-32"
                  value={caption}
                  onChange={handleCaptionChange}
                ></textarea>
                
                <button 
                  className="w-full bg-[hsl(var(--primary))] text-white py-3 px-4 rounded-md font-semibold flex items-center justify-center"
                  onClick={handlePost}
                  disabled={isPosting}
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-gray-300 rounded-md">
              <PlusSquare className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">Upload a photo or video</p>
              <button 
                className="bg-[hsl(var(--primary))] text-white py-2 px-4 rounded-md font-semibold"
                onClick={handleFileSelect}
              >
                Select from device
              </button>
              
              {/* Hidden file input */}
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </div>
          )}
          
          {/* Permission Dialog */}
          {showPermissionDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
              <div className="bg-white p-6 rounded-lg max-w-sm w-full">
                <h3 className="text-lg font-bold mb-2">Permission Required</h3>
                <p className="text-gray-600 mb-6">
                  Instagram needs permission to access your photos and videos to upload content. Please allow access to continue.
                </p>
                <div className="flex justify-end space-x-3">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-md font-medium"
                    onClick={() => setShowPermissionDialog(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-md font-medium"
                    onClick={handlePermissionGranted}
                  >
                    Allow Access
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Top navigation for home page
  if (isHome) {
    return (
      <>
        {/* Search Overlay */}
        {renderSearchOverlay()}
        
        {/* New Post Overlay */}
        {renderNewPostOverlay()}
        
        {/* Top Navigation */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-[hsl(var(--instagram-border))] z-10">
          <div className="flex justify-between items-center px-4 py-2">
            <div className="flex items-center space-x-2">
              <InstagramLogo className="w-8 h-8" />
              <h1 className="text-2xl font-semibold">Instagram Clone</h1>
            </div>
            <div className="flex space-x-4">
              <button 
                className="text-[hsl(var(--instagram-text))]" 
                onClick={handleExploreUsersClick}
                title="Explore all users"
              >
                <Users className="h-6 w-6" />
              </button>
              <button className="text-[hsl(var(--instagram-text))]">
                <Heart className="h-6 w-6" />
              </button>
              <button className="text-[hsl(var(--instagram-text))]" onClick={onMessageClick}>
                <SendHorizontal className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[hsl(var(--instagram-border))] flex justify-around py-2 z-10">
          <button className="p-2 text-[hsl(var(--instagram-text))]" onClick={handleHomeClick}>
            <Home className="h-6 w-6" />
          </button>
          <button 
            className="p-2 text-[hsl(var(--instagram-text))]" 
            onClick={toggleSearch}
          >
            <Search className="h-6 w-6" />
          </button>
          <button 
            className="p-2 text-[hsl(var(--instagram-text))]"
            onClick={toggleNewPost}
          >
            <PlusSquare className="h-6 w-6" />
          </button>
          <button 
            className="p-2 text-[hsl(var(--instagram-text))]"
            onClick={handleReelsClick}
          >
            <Film className="h-6 w-6" />
          </button>
          <button className="p-2 text-[hsl(var(--instagram-text))]" onClick={handleProfileClick}>
            <div className="w-7 h-7 rounded-full overflow-hidden">
              <img 
                src={user.profilePicture || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                alt="Your profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </div>
      </>
    );
  }
  
  // Other pages
  return (
    <>
      {/* Search Overlay */}
      {renderSearchOverlay()}
      
      {/* New Post Overlay */}
      {renderNewPostOverlay()}
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[hsl(var(--instagram-border))] flex items-center px-2 py-2 z-10">
        <div className="flex-1 flex justify-between items-center">
          <button className="p-2 text-[hsl(var(--instagram-text))]" onClick={handleHomeClick}>
            <Home className="h-6 w-6" />
          </button>
          <button 
            className="p-2 text-[hsl(var(--instagram-text))]"
            onClick={toggleSearch}
          >
            <Search className="h-6 w-6" />
          </button>
          <button 
            className="p-2 text-[hsl(var(--instagram-text))]"
            onClick={toggleNewPost}
          >
            <PlusSquare className="h-6 w-6" />
          </button>
        </div>
        
        {/* Record Reel Button (Center, Prominent) */}
        <div className="flex-1 flex justify-center">
          <button 
            className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-full flex items-center justify-center shadow-md"
            onClick={handleReelsClick}
          >
            <Film className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Record Reel</span>
          </button>
        </div>
        
        <div className="flex-1 flex justify-end items-center">
          <button 
            className="p-2 text-[hsl(var(--instagram-text))]" 
            onClick={handleExploreUsersClick}
          >
            <Users className="h-6 w-6" />
          </button>
          <button className="p-2 text-[hsl(var(--instagram-text))]" onClick={handleProfileClick}>
            <div className="w-7 h-7 rounded-full overflow-hidden">
              <img 
                src={user.profilePicture || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                alt="Your profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
