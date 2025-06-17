
import React, { useState } from "react";
import { useChat } from "@/contexts/ChatContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Lock } from "lucide-react";

interface MessageInputProps {
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ disabled = false }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { sendMessage } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled || isSending) {
      return;
    }
    
    setIsSending(true);
    
    try {
      await sendMessage(message);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      {disabled && (
        <div className="crypto-badge mr-1">
          <Lock className="h-3 w-3" />
          <span>Locked</span>
        </div>
      )}
      <Input
        placeholder={disabled ? "Establish encryption first" : "Type a message..."}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        className="flex-1"
      />
      <Button 
        type="submit" 
        size="icon"
        disabled={!message.trim() || disabled || isSending}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default MessageInput;
