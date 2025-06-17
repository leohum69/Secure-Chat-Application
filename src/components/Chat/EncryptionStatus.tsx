
import React from "react";
import { useChat } from "@/contexts/ChatContext";
import { Lock, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EncryptionStatusProps {
  recipient: string | null;
}

const EncryptionStatus: React.FC<EncryptionStatusProps> = ({ recipient }) => {
  const { encryptionStatus, initiateEncryption, completeEncryption, resetEncryption } = useChat();
  const [peerPublicY, setPeerPublicY] = useState("");
  const [dhPublicY, setDhPublicY] = useState<string | null>(null);
  const [step, setStep] = useState<"initial" | "started" | "waiting" | "completing">("initial");

  const handleInitiateEncryption = async () => {
    if (!recipient) return;
    
    try {
      setStep("started");
      const response = await initiateEncryption(recipient);
      if (response && response.dh_public) {
        setDhPublicY(response.dh_public.y.toString());
        setStep("waiting");
      } else {
        throw new Error("Invalid response from key exchange initiation");
      }
    } catch (error) {
      console.error("Failed to initiate encryption:", error);
      setStep("initial");
    }
  };

  const handleCompleteEncryption = async () => {
    if (!recipient || !peerPublicY) return;
    
    try {
      setStep("completing");
      await completeEncryption(recipient, peerPublicY);
      setStep("initial");
      setPeerPublicY("");
    } catch (error) {
      console.error("Failed to complete encryption:", error);
      setStep("initial");
    }
  };

  const handleResetEncryption = () => {
    if (!recipient) return;
    
    resetEncryption(recipient);
    setStep("initial");
    setPeerPublicY("");
    setDhPublicY(null);
  };

  if (!recipient) {
    return null;
  }

  if (encryptionStatus === 'established') {
    return (
      <div className="bg-accent/10 text-accent flex items-center justify-between py-2 px-4 rounded-md">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">End-to-end encrypted</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResetEncryption}
          className="text-xs h-7"
        >
          <RefreshCw className="h-3 w-3 mr-1" /> Reset key
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
      {step === "initial" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              No encryption established yet
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleInitiateEncryption}>
            Start Encryption
          </Button>
        </div>
      )}

      {step === "started" && (
        <div className="text-center py-2">
          <span className="text-sm text-amber-700 dark:text-amber-400">
            Generating keys...
          </span>
        </div>
      )}

      {step === "waiting" && dhPublicY && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              Share your public key with {recipient}, then enter their public key
            </span>
          </div>
          
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded font-mono text-xs break-all">
            {dhPublicY}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Enter {recipient}'s public key:
            </label>
            <textarea
              className="w-full p-2 text-xs font-mono rounded border border-amber-200 dark:border-amber-700 bg-white dark:bg-amber-900/20"
              rows={3}
              value={peerPublicY}
              onChange={(e) => setPeerPublicY(e.target.value)}
              placeholder={`Paste ${recipient}'s public key here`}
            />
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCompleteEncryption}
            disabled={!peerPublicY}
            className="w-full"
          >
            Complete Key Exchange
          </Button>
        </div>
      )}

      {step === "completing" && (
        <div className="text-center py-2">
          <span className="text-sm text-amber-700 dark:text-amber-400">
            Establishing secure connection...
          </span>
        </div>
      )}
    </div>
  );
};

export default EncryptionStatus;