import { useAuth } from "@/hooks/use-auth";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ChevronLeft, Video, PenSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import MessageBubble from "@/components/message-bubble";

export default function MessagesPage() {
  const { username } = useParams<{ username: string }>();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const [messageText, setMessageText] = useState("");
  
  const { data: user, isLoading: loadingUser } = useQuery<User>({
    queryKey: [`/api/users/${username}`],
  });
  
  const { data: messages, isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${user?.id}`],
    enabled: !!user && !!currentUser,
    refetchInterval: 3000, // Poll for new messages every 3 seconds
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) return;
      const res = await apiRequest("POST", "/api/messages", {
        receiverId: user.id,
        content
      });
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
    },
  });
  
  const handleSendMessage = () => {
    if (messageText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageText);
    }
  };
  
  const handleBack = () => {
    navigate("/");
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
        <p className="text-gray-500 mb-4">The conversation you're looking for doesn't exist or is not available.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Messages Header */}
      <div className="bg-white border-b border-[hsl(var(--instagram-border))] z-10">
        <div className="flex justify-between items-center px-4 py-2">
          <div className="flex items-center">
            <button onClick={handleBack} className="mr-4">
              <ChevronLeft className="text-[hsl(var(--instagram-text))] text-xl" />
            </button>
            <div className="flex items-center">
              <div className="flex items-center">
                <img 
                  src={user.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                  alt={`${user.username}'s profile`}
                  className="w-8 h-8 rounded-full mr-2"
                />
                <h1 className="text-lg font-semibold mr-1">{user.username}</h1>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="flex space-x-4">
            <button className="text-[hsl(var(--instagram-text))]">
              <Video className="h-5 w-5" />
            </button>
            <button className="text-[hsl(var(--instagram-text))]">
              <PenSquare className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-white">
        {loadingMessages ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {/* Timestamp */}
            <div className="flex justify-center mb-4">
              <span className="text-xs text-[hsl(var(--instagram-text-secondary))]">Today, 12:34 PM</span>
            </div>
            
            {/* Show actual messages if available, otherwise show sample conversation */}
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  isCurrentUser={message.senderId === currentUser?.id}
                  timestamp={message.createdAt}
                  userImage={message.senderId === currentUser?.id 
                    ? currentUser.profilePicture || ""
                    : user.profilePicture || ""}
                />
              ))
            ) : (
              // Sample conversation for UI demonstration
              <>
                <MessageBubble
                  content="lmao"
                  isCurrentUser={false}
                  timestamp={new Date()}
                  userImage={user.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                />
                
                <MessageBubble
                  content="hahahah omg"
                  isCurrentUser={true}
                  timestamp={new Date()}
                  userImage={currentUser?.profilePicture || ""}
                />
                
                <MessageBubble
                  content="My friend Sarah will love this"
                  isCurrentUser={true}
                  timestamp={new Date()}
                  userImage={currentUser?.profilePicture || ""}
                />
                
                <MessageBubble
                  content="So good lmao"
                  isCurrentUser={false}
                  timestamp={new Date()}
                  userImage={user.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                />
                
                <MessageBubble
                  content="When are we hanging out? Going to be hot on Saturday 🔥"
                  isCurrentUser={false}
                  timestamp={new Date()}
                  userImage={user.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                />
                
                <MessageBubble
                  content="I'm super down for Saturday!"
                  isCurrentUser={true}
                  timestamp={new Date()}
                  userImage={currentUser?.profilePicture || ""}
                />
                
                <MessageBubble
                  content="Meet at the park? 1pm?"
                  isCurrentUser={true}
                  timestamp={new Date()}
                  userImage={currentUser?.profilePicture || ""}
                />
                
                <MessageBubble
                  content="Perfect seeya then"
                  isCurrentUser={false}
                  timestamp={new Date()}
                  userImage={user.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                />
                
                <MessageBubble
                  content="Video"
                  isCurrentUser={false}
                  timestamp={new Date()}
                  userImage={user.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"}
                  isVideo={true}
                />
                
                <MessageBubble
                  content="Good stuff today"
                  isCurrentUser={true}
                  timestamp={new Date()}
                  userImage={currentUser?.profilePicture || ""}
                />
                
                <MessageBubble
                  content="Reels just keep getting better"
                  isCurrentUser={true}
                  timestamp={new Date()}
                  userImage={currentUser?.profilePicture || ""}
                />
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="bg-white border-t border-[hsl(var(--instagram-border))] p-2">
        <div className="flex items-center space-x-2">
          <button className="text-[hsl(var(--primary))]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Message..."
              className="w-full bg-gray-100 rounded-full px-4 py-2 pr-8 focus:outline-none text-sm"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            {messageText ? (
              <Button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[hsl(var(--primary))] bg-transparent hover:bg-transparent p-1"
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </Button>
            ) : (
              <>
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[hsl(var(--primary))]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <button className="text-[hsl(var(--primary))]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button className="text-[hsl(var(--primary))]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="text-[hsl(var(--primary))]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
