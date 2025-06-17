
import React from "react";
import { useChat } from "@/contexts/ChatContext";
import { User, MessageSquare, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

const ChatList = () => {
  const { users, activeChat, setActiveChat, encryptionStatus } = useChat();
  const { sharedKeys } = useAuth();
  
  // Determine if encryption is established with a user
  const isEncryptedWithUser = (username: string) => {
    if (activeChat === username && encryptionStatus === 'established') {
      return true;
    }
    
    // Check if we have a shared key with this user
    return sharedKeys.some(key => 
      key.users.includes(username)
    );
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Conversations</h2>
        <p className="text-sm text-muted-foreground">Secure end-to-end encrypted</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {users && users.length > 0 ? (
            users.map((user) => {
              const isEncrypted = isEncryptedWithUser(user.username);
              
              return (
                <div
                  key={user.username}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors mb-1 ${
                    activeChat === user.username ? "bg-muted" : ""
                  }`}
                  onClick={() => setActiveChat(user.username)}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{user.username}</p>
                      {isEncrypted && (
                        <Lock className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {isEncrypted
                        ? "Encrypted connection"
                        : "Tap to start chatting"}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatList;