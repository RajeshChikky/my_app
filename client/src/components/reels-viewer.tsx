import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Heart, Share, MessageCircle, Bookmark, ChevronUp, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface Reel {
  id: number;
  userId: number;
  videoUrl: string;
  thumbnail: string;
  caption: string;
  likes: number;
  views: number;
  filter?: string;
  audioTrack?: string;
  createdAt: Date;
  user?: User;
}

export default function ReelsViewer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [users, setUsers] = useState<Record<number, User>>({});
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { user: currentUser } = useAuth();

  const { data: reels = [], isLoading, error } = useQuery<Reel[]>({
    queryKey: ["/api/reels"],
    refetchOnWindowFocus: false,
  });

  // Load users for reels
  useEffect(() => {
    if (reels.length > 0) {
      // Create user info map from the user data embedded in reels
      const userMap: Record<number, User> = {};
      
      // Process users from reels data
      reels.forEach(reel => {
        if (reel.user && reel.userId) {
          userMap[reel.userId] = {
            id: reel.userId,
            username: reel.user.username,
            password: "", // We don't need or store password in the frontend
            fullName: reel.user.fullName,
            bio: null,
            profilePicture: reel.user.profilePicture,
            email: null,
            isVerified: false
          };
        }
      });
      
      // Add current user if it exists
      if (currentUser) {
        userMap[currentUser.id] = currentUser;
      }
      
      setUsers(userMap);
    }
  }, [reels, currentUser]);

  useEffect(() => {
    // Pause all videos first
    videoRefs.current.forEach(video => {
      if (video) {
        video.pause();
      }
    });

    // Play the current video
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.currentTime = 0;
      const playPromise = currentVideo.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented, add a click event to start on user interaction
          const handleClick = () => {
            currentVideo.play();
            document.removeEventListener('click', handleClick);
          };
          document.addEventListener('click', handleClick, { once: true });
        });
      }
    }
  }, [currentIndex]);

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Threshold to prevent accidental scrolling
    const threshold = 50;
    
    if (e.deltaY > threshold) {
      handleScroll('down');
    } else if (e.deltaY < -threshold) {
      handleScroll('up');
    }
  };
  
  // Add touch support for mobile devices
  useEffect(() => {
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      const threshold = 50;
      
      if (diff > threshold) {
        // Swipe up - go to next reel
        handleScroll('down');
      } else if (diff < -threshold) {
        // Swipe down - go to previous reel
        handleScroll('up');
      }
    };
    
    // Add event listeners for touch events
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex]);

  const toggleMute = () => {
    setMuted(!muted);
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = !muted;
      }
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const reelDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - reelDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };

  if (!reels.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white">Loading reels...</div>
      </div>
    );
  }

  const currentReel = reels[currentIndex];
  const user = currentReel ? users[currentReel.userId] : undefined;

  return (
    <div 
      className="h-screen w-full bg-black overflow-hidden relative"
      onWheel={handleWheel}
    >
      {/* Videos */}
      <div className="h-full w-full">
        {reels.map((reel, index) => (
          <div 
            key={`reel-${reel.userId}-${index}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <video
              ref={el => videoRefs.current[index] = el}
              src={reel.videoUrl}
              className="h-full w-full object-cover"
              muted={muted}
              loop
              playsInline
              poster={reel.thumbnail}
            />
            
            {/* Overlay for gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-70"></div>
            
            {/* Caption and user info */}
            <div className="absolute bottom-20 left-4 right-24 text-white z-20">
              <div className="flex items-center mb-3">
                <img 
                  src={user?.profilePicture || "https://i.pravatar.cc/150?img=12"} 
                  alt={user?.username || "User"}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <div className="ml-2">
                  <p className="font-bold">{user?.username || "user"}</p>
                  <p className="text-xs text-gray-300">{formatDate(new Date(currentReel.createdAt))}</p>
                </div>
              </div>
              <p className="text-sm mb-2">{currentReel.caption}</p>
              
              {/* Filter and Audio information */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {currentReel.filter && (
                  <div className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    Filter: {currentReel.filter}
                  </div>
                )}
                {currentReel.audioTrack && (
                  <div className="bg-white/20 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <span className="mr-1">♫</span> {currentReel.audioTrack}
                  </div>
                )}
              </div>
            </div>
            
            {/* Interaction buttons */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 text-white z-20">
              <div className="flex flex-col items-center">
                <Button variant="ghost" size="icon" className="rounded-full bg-black/20 text-white hover:bg-black/30">
                  <Heart className="h-7 w-7" />
                </Button>
                <span className="text-sm mt-1">{formatNumber(currentReel.likes)}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <Button variant="ghost" size="icon" className="rounded-full bg-black/20 text-white hover:bg-black/30">
                  <MessageCircle className="h-7 w-7" />
                </Button>
                <span className="text-sm mt-1">Comment</span>
              </div>
              
              <div className="flex flex-col items-center">
                <Button variant="ghost" size="icon" className="rounded-full bg-black/20 text-white hover:bg-black/30">
                  <Share className="h-7 w-7" />
                </Button>
                <span className="text-sm mt-1">Share</span>
              </div>
              
              <div className="flex flex-col items-center">
                <Button variant="ghost" size="icon" className="rounded-full bg-black/20 text-white hover:bg-black/30">
                  <Bookmark className="h-7 w-7" />
                </Button>
                <span className="text-sm mt-1">Save</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-white bg-black/20 hover:bg-black/30 z-30"
          onClick={() => handleScroll('up')}
        >
          <ChevronUp className="h-8 w-8" />
        </Button>
      )}
      
      {currentIndex < reels.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-white bg-black/20 hover:bg-black/30 z-30"
          onClick={() => handleScroll('down')}
        >
          <ChevronDown className="h-8 w-8" />
        </Button>
      )}
      
      {/* Sound toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6 text-white bg-black/20 hover:bg-black/30 z-30"
        onClick={toggleMute}
      >
        {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </Button>
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 z-30">
        <div className="h-full bg-white" style={{ width: `${((currentIndex + 1) / reels.length) * 100}%` }}></div>
      </div>
    </div>
  );
}