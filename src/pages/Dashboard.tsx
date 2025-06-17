
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import ChatList from "@/components/Chat/ChatList";
import ChatWindow from "@/components/Chat/ChatWindow";
import { Button } from "@/components/ui/button";
import { User, Lock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showChatList, setShowChatList] = useState(true);
  const isMobile = useIsMobile();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChatSelect = () => {
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBackToList = () => {
    setShowChatList(true);
  };

  return (
    <ChatProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="bg-card border-b shadow-sm p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">CryptoChat Palace</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium hidden sm:inline">{user?.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 container mx-auto py-6 px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
            {/* Chat list - hide on mobile when viewing a chat */}
            {(!isMobile || (isMobile && showChatList)) && (
              <div className="md:col-span-4 h-full" onClick={handleChatSelect}>
                <ChatList />
              </div>
            )}
            
            {/* Chat window - show on desktop or when a chat is selected on mobile */}
            {(!isMobile || (isMobile && !showChatList)) && (
              <div className="md:col-span-8 h-full">
                <ChatWindow onBack={handleBackToList} />
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        {/* <footer className="bg-muted py-3 text-center text-sm text-muted-foreground">
          <p>CryptoChat Palace - End-to-End Encrypted Messaging</p>
        </footer> */}
      </div>
    </ChatProvider>
  );
};

export default Dashboard;
