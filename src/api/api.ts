
import { toast } from "sonner";

const API_URL = "http://localhost:5000"; // Replace with your Flask backend URL

// Types
export interface User {
  username: string;
}

export interface Message {
  from: string;
  to: string;
  message: string;
  timestamp: string;
}

export interface SharedKey {
  users: string[];
  aes_key: string;
}

export interface LoginResponse {
  message: string;
  rsa_public_key: string;
  certificate: string;
  shared_keys: SharedKey[];
}

// Authentication
export const registerUser = async (username: string, email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    return data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// User management
export const getUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/users`, {
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch users");
    }

    return data.users;
  } catch (error) {
    console.error("Get users error:", error);
    throw error;
  }
};

// Crypto operations
export const startDiffieHellman = async (recipient: string) => {
  try {
    const response = await fetch(`${API_URL}/start_dh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: recipient }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to start key exchange");
    }

    return data;
  } catch (error) {
    console.error("DH start error:", error);
    throw error;
  }
};

export const completeDiffieHellman = async (recipient: string, peerY: string) => {
  try {
    const response = await fetch(`${API_URL}/complete_dh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: recipient, peer_y: peerY }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to complete key exchange");
    }

    toast.success("Secure connection established");
    return data;
  } catch (error) {
    console.error("DH complete error:", error);
    throw error;
  }
};

// Messaging
export const sendMessage = async (recipient: string, message: string) => {
  try {
    const response = await fetch(`${API_URL}/send_message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: recipient, message }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to send message");
    }

    return data;
  } catch (error) {
    console.error("Send message error:", error);
    throw error;
  }
};

export const getMessages = async (otherUser: string) => {
  try {
    const response = await fetch(`${API_URL}/get_messages?with=${otherUser}`, {
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch messages");
    }

    return data;
  } catch (error) {
    console.error("Get messages error:", error);
    throw error;
  }
};