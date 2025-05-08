import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { User } from "@shared/schema";

export default function ExploreUsersPage() {
  const [, navigate] = useLocation();
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/all"],
  });

  const goBack = () => {
    navigate("/");
  };

  const handleUserClick = (userId: number) => {
    // Toggle expanded view for user details
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const navigateToProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-20 pt-14">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-[hsl(var(--instagram-border))] z-10">
        <div className="flex items-center px-4 py-2">
          <button className="mr-4" onClick={goBack}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">Explore Users</h1>
        </div>
      </div>

      {/* User List */}
      <div className="p-4">
        <h2 className="text-lg font-medium mb-4">All Instagram Users</h2>
        
        {!users || users.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No users found</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="border border-[hsl(var(--instagram-border))] rounded-md overflow-hidden">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                      <img 
                        src={user.profilePicture || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                        alt={`${user.username}'s profile`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/300x300?text=User";
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
                    <span className="text-sm font-medium text-gray-700">
                      ID: {user.id}
                    </span>
                  </div>
                </div>
                
                {expandedUser === user.id && (
                  <div className="p-4 bg-gray-50 border-t border-[hsl(var(--instagram-border))]">
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <span className="font-bold text-blue-700">User ID:</span> 
                      <span className="font-mono ml-2 text-lg font-semibold">{user.id}</span>
                    </div>
                    <div className="mb-3">
                      <span className="font-medium">Username:</span> {user.username}
                    </div>
                    <div className="mb-3">
                      <span className="font-medium">Full Name:</span> {user.fullName || "Not provided"}
                    </div>
                    <div className="mb-3">
                      <span className="font-medium">Bio:</span> {user.bio || "No bio available"}
                    </div>
                    <div className="mb-3">
                      <span className="font-medium">Email:</span> {user.email || "Not provided"}
                    </div>
                    <div className="mb-3">
                      <span className="font-medium">Verified:</span> {user.isVerified ? "Yes" : "No"}
                    </div>
                    <button 
                      className="bg-[hsl(var(--primary))] text-white py-1.5 px-4 rounded-md font-medium mt-2"
                      onClick={() => navigateToProfile(user.username)}
                    >
                      View Full Profile
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}