import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Post, User } from "@shared/schema";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface PostCardProps {
  post: Post;
  user?: User;
}

export default function PostCard({ post, user: propUser }: PostCardProps) {
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // If user is not passed as prop, fetch it
  const { data: fetchedUser, isLoading: loadingUser } = useQuery<User>({
    queryKey: [`/api/users/${post.userId}`],
    enabled: !propUser,
  });
  
  const user = propUser || fetchedUser;
  
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/like`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setLiked(data.liked);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });
  
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      const res = await apiRequest("POST", `/api/users/${user.username}/follow`, {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setIsFollowing(data.following);
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.username}`] });
      }
    },
  });
  
  const handleLike = () => {
    if (likeMutation.isPending) return;
    
    setLiked(!liked);
    if (!liked) {
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 1000);
    }
    likeMutation.mutate();
  };
  
  const handleSave = () => {
    setSaved(!saved);
  };
  
  const handleProfileClick = () => {
    if (user) {
      navigate(`/profile/${user.username}`);
    }
  };
  
  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 1000);
      likeMutation.mutate();
    }
  };
  
  const getTimeAgo = (date: Date | string | null | undefined) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  if (loadingUser || !user) {
    return (
      <div className="border-b border-[hsl(var(--instagram-border))] mb-4 pb-4 bg-white animate-pulse">
        <div className="h-14 bg-gray-200 rounded-t"></div>
        <div className="h-96 bg-gray-300"></div>
        <div className="h-24 bg-gray-200 rounded-b"></div>
      </div>
    );
  }
  
  return (
    <div className="border-b border-[hsl(var(--instagram-border))] mb-4 pb-4 bg-white">
      {/* Post Header */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer" onClick={handleProfileClick}>
            <img 
              src={user.profilePicture || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
              alt={`${user.username}'s profile picture`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="cursor-pointer" onClick={handleProfileClick}>
            <p className="text-sm font-semibold">{user.username}</p>
            {post.location && (
              <p className="text-xs text-[hsl(var(--instagram-text-secondary))]">{post.location}</p>
            )}
          </div>
          {currentUser?.id !== user.id && (
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "ml-2 py-0 h-6 text-xs",
                isFollowing 
                  ? "bg-gray-100 text-[hsl(var(--instagram-text))] border-gray-200" 
                  : "bg-[hsl(var(--primary))] text-white border-transparent hover:bg-[hsl(var(--primary))/90]"
              )}
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
            >
              {followMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                isFollowing ? "Following" : "Follow"
              )}
            </Button>
          )}
        </div>
        <button className="text-[hsl(var(--instagram-text))]">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      {/* Post Image */}
      <div className="relative" onDoubleClick={handleDoubleTap}>
        <img 
          src={post.imageUrl}
          alt="Post" 
          className="w-full h-auto"
          onError={(e) => {
            // Fallback to a placeholder image if the original fails to load
            e.currentTarget.src = "https://via.placeholder.com/600x600?text=Image+Not+Available";
            // Log error for debugging
            console.error(`Failed to load image: ${post.imageUrl}`);
          }}
        />
        
        {/* Like animation on double tap */}
        {likeAnimation && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart className={cn(
              "h-24 w-24 text-white opacity-80 transition-all duration-500 scale-0",
              likeAnimation && "scale-100 animate-like"
            )} fill="white" />
          </div>
        )}
      </div>
      
      {/* Post Actions */}
      <div className="p-2">
        <div className="flex justify-between mb-2">
          <div className="flex space-x-4">
            <button 
              className={cn(
                "text-[hsl(var(--instagram-text))]",
                liked && "text-[hsl(var(--instagram-red))]"
              )} 
              onClick={handleLike}
            >
              <Heart className={cn("h-6 w-6", liked && "fill-current")} />
            </button>
            <button className="text-[hsl(var(--instagram-text))]">
              <MessageCircle className="h-6 w-6" />
            </button>
            <button className="text-[hsl(var(--instagram-text))]">
              <Send className="h-6 w-6" />
            </button>
          </div>
          <button 
            className={cn(
              "text-[hsl(var(--instagram-text))]",
              saved && "text-[hsl(var(--instagram-text))]"
            )}
            onClick={handleSave}
          >
            <Bookmark className={cn("h-6 w-6", saved && "fill-current")} />
          </button>
        </div>
        
        {/* Post Info */}
        <div>
          <p className="text-sm font-semibold">{post.likes} likes</p>
          <p className="text-sm">
            <span className="font-semibold">{user.username}</span>{" "}
            {post.caption}
          </p>
          <button className="text-xs text-[hsl(var(--instagram-text-secondary))] mt-1">View all comments</button>
          <p className="text-xs text-[hsl(var(--instagram-text-secondary))] mt-1 uppercase">
            {getTimeAgo(post.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
