import { useWallet } from "@/hooks/useWallet";
import { connectWallet, walletToAccount } from "@/lib/authService";
import { auth } from "@/lib/firebase";
import useAuthStore from "@/lib/stores/auth.store";
import { AuthState } from "@/types/auth.types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export type WalletConnectionMode = "connect" | "link";

export interface UseWalletConnectionOptions {
  mode?: WalletConnectionMode;
  email?: string;
}

export interface WalletConnectionState {
  isConnecting: boolean;
  isConnected: boolean;
  publicKey: string | null;
  userHasWallet: boolean;
  userRole: string | null;
  storedWalletAddress: string | null;
  userEmail: string;
}

export interface UseWalletConnectionResult {
  state: WalletConnectionState;
  connectWallet: () => Promise<void>;
  setUserEmail: (email: string) => void;
}

export function useWalletConnection({
  mode = "connect",
  email = "",
}: UseWalletConnectionOptions = {}): UseWalletConnectionResult {
  const { connect, isConnected, publicKey, networkPassphrase, isConnecting } =
    useWallet();
  const [userEmail, setUserEmail] = useState(email);
  const [userHasWallet, setUserHasWallet] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storedWalletAddress, setStoredWalletAddress] = useState<string | null>(
    null
  );

  // Get user data from auth store
  const user = useAuthStore((state: AuthState) => state.user);

  // Check if user already has a wallet address stored
  useEffect(() => {
    if (!auth.currentUser || !user) return;

    setUserRole(user.role!);
    setUserHasWallet(!!user.wallet);
    setStoredWalletAddress(user.wallet?.address || null);
  }, [user, auth.currentUser]);

  const handleConnectWallet = async () => {
    try {
      const publicKey = await connect();
      console.log("publicKey", publicKey);

      if (!publicKey) {
        throw new Error("Failed to get wallet public key");
      }

      // Store wallet info in user account
      await connectWallet({
        address: publicKey,
        publicKey: publicKey,
        network: networkPassphrase!,
      });

      if (mode === "link" && email) {
        await walletToAccount(publicKey, email);
      }

      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      if (
        error.message?.includes("Talents cannot change their wallet address")
      ) {
        toast.error(
          "You already have a wallet address linked to your account."
        );
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }
    }
  };

  return {
    state: {
      isConnecting,
      isConnected,
      publicKey,
      userHasWallet,
      userRole,
      storedWalletAddress,
      userEmail,
    },
    connectWallet: handleConnectWallet,
    setUserEmail,
  };
}
