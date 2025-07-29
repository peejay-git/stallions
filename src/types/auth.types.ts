/**
 * Auth types for the Stallion application
 */

/**
 * User roles within the application
 */
export type UserRole = "talent" | "sponsor" | "admin";

/**
 * Wallet information structure
 */
export interface WalletInfo {
  address: string;
  publicKey: string;
  network: string;
}

/**
 * Base user profile with common fields
 */
export interface BaseUserProfile {
  uid: string;
  email?: string;
  role?: UserRole;
  authProvider?: string;
  isProfileComplete?: boolean;
  wallet: WalletInfo | null;
  createdAt?: string;
  lastLogin?: string;
  profileData?: {
    firstName: string;
    lastName: string;
    username: string;
    socials?: { platform: string; username: string }[];
    location: string;
    lastLogin?: string;
  };
  isOnboarded?: boolean;
  walletConnected?: boolean;
}

/**
 * Talent-specific profile fields
 */
export interface TalentProfile extends BaseUserProfile {
  role?: "talent";
  profileData?: {
    firstName: string;
    lastName: string;
    username: string;
    skills?: string[];
    socials?: { platform: string; username: string }[];
    location: string;
    lastLogin?: string;
  };
}

/**
 * Sponsor-specific profile fields
 */
export interface SponsorProfile extends Omit<BaseUserProfile, "profileData"> {
  role?: "sponsor";
  profileData?: {
    firstName: string;
    lastName: string;
    username: string;
    companyName: string;
    companyUsername: string;
    companyUrl: string;
    companyTwitter: string;
    entityName: string;
    companyLogo: string;
    industry: string;
    shortBio: string;
    lastLogin?: string;
    socials?: { platform: string; username: string }[];
    telegram?: string;
  };
}

/**
 * Admin-specific profile fields
 */
export interface AdminProfile extends BaseUserProfile {
  role?: "admin";
  profileData?: {
    firstName: string;
    lastName: string;
    username: string;
    location: string;
    lastLogin?: string;
    socials?: { platform: string; username: string }[];
  };
}

/**
 * User profile union type
 */
export type UserProfile = TalentProfile | SponsorProfile | AdminProfile;

/**
 * Authentication state interface
 */
export interface AuthState {
  // User data
  user: UserProfile | null;

  // Authentication state
  isAuthenticated: boolean;
  isEmailAuthenticated: boolean;
  isWalletAuthenticated: boolean;
  loading: boolean;

  // Actions
  setUser: (user: Omit<UserProfile, "role">) => void;
  clearUser: () => void;
  setLoading: (value: boolean) => void;
  fetchUserFromFirestore: () => Promise<void>;
  fetchUserByWalletAddress: (
    walletAddress: string
  ) => Promise<UserProfile | null>;
  initializeAuthListener: () => () => void;
  updateUserRole: (role: UserRole) => Promise<void>;
  updateUserProfile: (
    profileData: Partial<UserProfile["profileData"]>
  ) => Promise<void>;
  connectWalletToUser: (walletInfo: WalletInfo) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  logout: () => Promise<boolean>;
  requiresProfileCompletion: () => boolean;
}

/**
 * Wallet data structure as received from wallet connection
 */
export interface WalletData {
  address: string;
  publicKey: string;
  network: string;
}

/**
 * Authentication result structure
 */
export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserProfile;
}
