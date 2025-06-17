
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/Auth/LoginForm";
import RegisterForm from "@/components/Auth/RegisterForm";
import { Lock } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-crypto-light to-background p-4">
      <div className="w-full max-w-md mb-8 text-center">
        <div className="mb-4 inline-flex p-4 rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">CryptoChat Palace</h1>
        <p className="text-muted-foreground">
          Secure messaging with advanced encryption
        </p>
      </div>

      <Tabs
        defaultValue="login"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-md"
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm />
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-sm text-center max-w-md text-muted-foreground">
        <p className="mb-2">Secured with industry-standard cryptography:</p>
        <div className="flex justify-center flex-wrap gap-2">
          <span className="crypto-badge">RSA</span>
          <span className="crypto-badge">AES</span>
          <span className="crypto-badge">Diffie-Hellman</span>
          <span className="crypto-badge">PKI</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
