
import React, { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import EncryptionStatus from "./EncryptionStatus";
import MessageInput from "./MessageInput";
import { Lock, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatWindowProps {
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { activeChat, messages, encryptionStatus } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  if (!activeChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card rounded-lg p-8 text-center">
        <div className="mb-4 p-4 bg-muted rounded-full">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
        <p className="text-muted-foreground max-w-xs">
          Select a user from the list to start an encrypted conversation
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-3">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-medium">{activeChat}</h2>
          <div className="flex items-center gap-1 text-xs">
            {encryptionStatus === 'established' ? (
              <>
                <Lock className="h-3 w-3 text-accent" />
                <span className="text-accent">Encrypted</span>
              </>
            ) : (
              <span className="text-muted-foreground">No encryption</span>
            )}
          </div>
        </div>
      </div>

      {/* Encryption status banner */}
      <div className="p-2 bg-muted">
        <EncryptionStatus recipient={activeChat} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-310px)]">
          <div className="space-y-4 p-4">
            {messages.length > 0 ? (
              messages.map((msg, index) => {
                const isOwnMessage = msg.from === user?.username;
                const time = new Date(msg.timestamp);
                
                return (
                  <div 
                    key={index}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      message-bubble 
                      ${isOwnMessage ? 'message-bubble-sent' : 'message-bubble-received'}
                    `}>
                      <p>{msg.message}</p>
                      <div className="text-xs opacity-70 text-right mt-1">
                        {format(time, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : encryptionStatus === 'established' ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>Establish encryption to start messaging</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <MessageInput disabled={encryptionStatus !== 'established'} />
      </div>
    </div>
  );
};

export default ChatWindow;