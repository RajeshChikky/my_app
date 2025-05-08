import { formatDistanceToNow } from "date-fns";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  content: string;
  isCurrentUser: boolean;
  timestamp: Date | string;
  userImage: string;
  isVideo?: boolean;
}

export default function MessageBubble({
  content,
  isCurrentUser,
  timestamp,
  userImage,
  isVideo = false
}: MessageBubbleProps) {
  const getFormattedTime = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  return (
    <div className={cn(
      "flex items-end space-x-2",
      isCurrentUser && "flex-row-reverse space-x-reverse"
    )}>
      {!isCurrentUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <img 
            src={userImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={cn(
        "py-2 px-4 rounded-xl max-w-[70%]",
        isCurrentUser 
          ? "bg-[hsl(var(--primary))] text-white rounded-br-sm" 
          : "bg-gray-200 text-[hsl(var(--instagram-text))] rounded-bl-sm"
      )}>
        {isVideo ? (
          <div className="flex items-center">
            <PlayCircle className="mr-2 h-4 w-4" />
            <p className="text-sm">{content}</p>
          </div>
        ) : (
          <p className="text-sm">{content}</p>
        )}
      </div>
    </div>
  );
}
