
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { 
  getMessages, 
  getUsers, 
  startDiffieHellman, 
  completeDiffieHellman, 
  sendMessage,
  User,
  Message
} from "@/api/api";

type ChatContextType = {
  users: User[];
  activeChat: string | null;
  messages: Message[];
  encryptionStatus: 'none' | 'in-progress' | 'established';
  setActiveChat: (username: string) => void;
  initiateEncryption: (username: string) => Promise<any>; // Changed return type to any
  completeEncryption: (username: string, peerY: string) => Promise<void>; 
  sendMessage: (message: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  resetEncryption: (username: string) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, sharedKeys } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [encryptionStatus, setEncryptionStatus] = useState<'none' | 'in-progress' | 'established'>('none');
  const [encryptionData, setEncryptionData] = useState<Record<string, { status: 'none' | 'in-progress' | 'established' }>>({});

  // Initialize encryption data from shared keys
  useEffect(() => {
    if (sharedKeys && sharedKeys.length > 0) {
      const newEncryptionData: Record<string, { status: 'none' | 'in-progress' | 'established' }> = {};
      
      sharedKeys.forEach(key => {
        // Find the other user in the shared key
        const otherUser = key.users.find(u => u !== user?.username);
        if (otherUser) {
          newEncryptionData[otherUser] = { status: 'established' };
        }
      });
      
      setEncryptionData(newEncryptionData);
    }
  }, [sharedKeys, user]);

  // Fetch users when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat && isAuthenticated) {
      fetchMessages();

      // Set the encryption status for this chat
      const status = encryptionData[activeChat]?.status || 'none';
      setEncryptionStatus(status);
    }
  }, [activeChat, isAuthenticated, encryptionData]);

  useEffect(() => {
    if (!activeChat || !isAuthenticated) return;
  
    const interval = setInterval(() => {
      fetchMessages();
    }, 2000); // 2000ms = 2 seconds
  
    return () => clearInterval(interval); // Clean up when activeChat changes or unmounts
  }, [activeChat, isAuthenticated]);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    }
  };

  const fetchMessages = async () => {
    if (!activeChat) return;

    try {
      const fetchedMessages = await getMessages(activeChat);
      setMessages(fetchedMessages);
    } catch (error: any) {
      if (error.message?.includes("Shared key not found")) {
        // No encryption established yet
        setMessages([]);
        setEncryptionStatus('none');
        
        // Update the encryption status for this chat
        setEncryptionData(prev => ({
          ...prev,
          [activeChat]: { status: 'none' }
        }));
        
      } else {
        toast.error("Failed to load messages");
        console.error(error);
      }
    }
  };

  const resetEncryption = (username: string) => {
    // Reset encryption status for a specific user
    setEncryptionData(prev => ({
      ...prev,
      [username]: { status: 'none' }
    }));
    
    if (activeChat === username) {
      setEncryptionStatus('none');
      setMessages([]);
    }
    
    toast.info("Encryption reset. You'll need to establish a new secure connection.");
  };

  const initiateEncryption = async (username: string) => {
    try {
      setEncryptionStatus('in-progress');
      
      // Update the encryption status for this chat
      setEncryptionData(prev => ({
        ...prev,
        [username]: { status: 'in-progress' }
      }));
      
      const response = await startDiffieHellman(username);
      toast.success("Encryption initiated, waiting for peer to complete");
      return response;
    } catch (error) {
      setEncryptionStatus('none');
      toast.error("Failed to initiate encryption");
      throw error;
    }
  };

  const completeEncryption = async (username: string, peerY: string) => {
    try {
      await completeDiffieHellman(username, peerY);
      setEncryptionStatus('established');
      
      // Update the encryption status for this chat
      setEncryptionData(prev => ({
        ...prev,
        [username]: { status: 'established' }
      }));
      
      toast.success("End-to-end encryption established");
    } catch (error) {
      setEncryptionStatus('none');
      toast.error("Failed to establish encryption");
      throw error;
    }
  };

  const sendNewMessage = async (message: string) => {
    if (!activeChat) return;

    try {
      await sendMessage(activeChat, message);
      // Refresh messages after sending
      fetchMessages();
    } catch (error) {
      toast.error("Failed to send message");
      throw error;
    }
  };

  const refreshMessages = async () => {
    if (activeChat) {
      await fetchMessages();
    }
  };

  const value = {
    users,
    activeChat,
    messages,
    encryptionStatus,
    setActiveChat,
    initiateEncryption,
    completeEncryption,
    sendMessage: sendNewMessage,
    refreshMessages,
    resetEncryption,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};