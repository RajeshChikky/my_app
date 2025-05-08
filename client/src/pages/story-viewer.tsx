import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { X, MoreHorizontal, Music, SmilePlus, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Story, User } from "@shared/schema";

export default function StoryViewer() {
  const { userId } = useParams<{ userId: string }>();
  const [_, navigate] = useLocation();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<number[]>([100, 50, 0]); // Progress for each story
  
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });
  
  const { data: stories } = useQuery<Story[]>({
    queryKey: [`/api/users/${userId}/stories`],
    enabled: !!userId,
  });
  
  // Close the story viewer
  const handleClose = () => {
    navigate("/");
  };
  
  // Navigate to previous story
  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      
      // Reset progress
      const newProgress = [...progress];
      newProgress[currentStoryIndex] = 0;
      newProgress[currentStoryIndex - 1] = 0;
      setProgress(newProgress);
    }
  };
  
  // Navigate to next story
  const handleNextStory = () => {
    if (stories && currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      
      // Reset progress
      const newProgress = [...progress];
      newProgress[currentStoryIndex] = 100;
      newProgress[currentStoryIndex + 1] = 0;
      setProgress(newProgress);
    } else {
      // No more stories, close the viewer
      handleClose();
    }
  };
  
  // Toggle pause/play
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  // Progress the story
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      const newProgress = [...progress];
      if (newProgress[currentStoryIndex] < 100) {
        newProgress[currentStoryIndex] += 1;
        setProgress(newProgress);
      } else {
        handleNextStory();
      }
    }, 50); // Update every 50ms
    
    return () => clearInterval(interval);
  }, [currentStoryIndex, progress, isPaused]);
  
  // Use sample story content for now
  const storyContent = "https://images.unsplash.com/photo-1474552226712-ac0f0961a954";
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Story Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
            <img 
              src={user?.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
              alt="Profile picture" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm text-white font-semibold">{user?.username || "username"}</p>
            <p className="text-xs text-white opacity-70">2h</p>
          </div>
        </div>
        <div className="flex space-x-4">
          <button className="text-white" onClick={togglePause}>
            <MoreHorizontal className="h-5 w-5" />
          </button>
          <button className="text-white" onClick={handleClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Story Progress Bar */}
      <div className="absolute top-0 left-0 right-0 flex px-2 pt-1 z-10">
        {progress.map((prog, index) => (
          <div 
            key={index} 
            className={cn(
              "h-0.5 bg-white bg-opacity-50 flex-1 rounded", 
              index < progress.length - 1 && "mr-1"
            )}
          >
            <div 
              className="h-full bg-white rounded" 
              style={{ width: `${index < currentStoryIndex ? 100 : (index === currentStoryIndex ? prog : 0)}%` }}
            ></div>
          </div>
        ))}
      </div>
      
      {/* Story Content */}
      <div className="h-full flex items-center justify-center">
        <img 
          src={storyContent}
          alt="Story content" 
          className="h-full w-auto object-contain"
        />
      </div>
      
      {/* Story Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center">
        <div className="flex-1">
          <Input 
            type="text" 
            placeholder="Send message" 
            className="w-full bg-transparent border border-white border-opacity-20 rounded-full px-4 py-2 text-white placeholder-white placeholder-opacity-70 focus:outline-none"
          />
        </div>
        <div className="ml-2">
          <button className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Story Navigation - invisible buttons for navigation */}
      <div className="absolute inset-0 flex" onClick={togglePause}>
        <div className="w-1/2" onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}></div>
        <div className="w-1/2" onClick={(e) => { e.stopPropagation(); handleNextStory(); }}></div>
      </div>
      
      {/* Story Controls */}
      <div className="absolute left-0 inset-y-0 w-12 flex flex-col justify-center items-center space-y-6 opacity-70">
        <button className="text-white">
          <Music className="h-5 w-5" />
        </button>
        <button className="text-white">
          <SmilePlus className="h-5 w-5" />
        </button>
        <button className="text-white">
          <Scissors className="h-5 w-5" />
        </button>
      </div>
      
      {/* Story Type Selection */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-6 z-10">
        <button className="text-white uppercase text-xs font-semibold opacity-70">
          Story
        </button>
        <button className="text-white uppercase text-xs font-semibold">
          Reels
        </button>
        <button className="text-white uppercase text-xs font-semibold opacity-70">
          Live
        </button>
      </div>
      
      {/* Camera Button */}
      <div className="absolute bottom-20 right-6 z-10">
        <Button className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[hsl(var(--instagram-text))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
