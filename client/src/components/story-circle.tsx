import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";

interface StoryCircleProps {
  username: string;
  imageUrl: string;
  isCurrentUser?: boolean;
  onClick: () => void;
}

export default function StoryCircle({
  username,
  imageUrl,
  isCurrentUser = false,
  onClick
}: StoryCircleProps) {
  return (
    <div className="flex flex-col items-center space-y-1 w-16">
      <div className="relative" onClick={onClick}>
        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-r from-[#FCAF45] via-[#FD1D1D] to-[#833AB4]">
          <img 
            src={imageUrl}
            alt={`${username}'s story`}
            className="w-full h-full object-cover rounded-full border-2 border-white"
          />
        </div>
        {isCurrentUser && (
          <div className="absolute bottom-0 right-0 bg-[hsl(var(--primary))] rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
            <PlusIcon className="text-white h-3 w-3" />
          </div>
        )}
      </div>
      <span className="text-xs truncate w-full text-center">{username}</span>
    </div>
  );
}
