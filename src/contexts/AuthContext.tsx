
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { loginUser, registerUser } from "@/api/api";

type User = {
  username: string;
  rsaPublicKey?: string;
  certificate?: string;
};

type SharedKey = {
  users: string[];
  aes_key: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sharedKeys: SharedKey[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sharedKeys, setSharedKeys] = useState<SharedKey[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in (stored in localStorage for demo purposes)
    const storedUser = localStorage.getItem("cryptoUser");
    const storedKeys = localStorage.getItem("cryptoSharedKeys");
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        if (storedKeys) {
          setSharedKeys(JSON.parse(storedKeys));
        }
      } catch (e) {
        console.error("Failed to parse stored user data", e);
        localStorage.removeItem("cryptoUser");
        localStorage.removeItem("cryptoSharedKeys");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await loginUser(username, password);
      
      const loggedInUser = {
        username,
        rsaPublicKey: data.rsa_public_key,
        certificate: data.certificate,
      };
      
      setUser(loggedInUser);
      localStorage.setItem("cryptoUser", JSON.stringify(loggedInUser));
      
      // Store shared keys if they exist
      if (data.shared_keys && Array.isArray(data.shared_keys)) {
        setSharedKeys(data.shared_keys);
        localStorage.setItem("cryptoSharedKeys", JSON.stringify(data.shared_keys));
      }
      
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      await registerUser(username, email, password);
      toast.success("Registration successful! Please log in.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSharedKeys([]);
    localStorage.removeItem("cryptoUser");
    localStorage.removeItem("cryptoSharedKeys");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    sharedKeys,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};