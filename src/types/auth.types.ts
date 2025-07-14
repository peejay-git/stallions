/**
 * Auth types for the Stallion application
 */

/**
 * User roles within the application
 */
export type UserRole = 'talent' | 'sponsor' | 'admin';

/**
 * Wallet information structure
 */
export interface WalletInfo {
  address: string;
  publicKey: string;
  network: string;
  connectedAt?: string;
}

/**
 * Base user profile with common fields
 */
export interface BaseUserProfile {
  uid: string;
  email?: string;
  username?: string;
  firstName?: string;
  role: UserRole;
  isProfileComplete: boolean;
  walletConnected: boolean;
  walletInfo?: WalletInfo;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

/**
 * Talent-specific profile fields
 */
export interface TalentProfile extends BaseUserProfile {
  role: 'talent';
  skills?: string[];
  experience?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
}

/**
 * Sponsor-specific profile fields
 */
export interface SponsorProfile extends BaseUserProfile {
  role: 'sponsor';
  companyName?: string;
  companyUsername?: string;
  companyUrl?: string;
  companyTwitter?: string;
  entityName?: string;
  companyLogo?: string;
  industry?: string;
  shortBio?: string;
}

/**
 * Admin-specific profile fields
 */
export interface AdminProfile extends BaseUserProfile {
  role: 'admin';
  permissions?: string[];
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
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  setLoading: (value: boolean) => void;
  fetchUserFromFirestore: () => Promise<void>;
  initializeAuthListener: () => () => void;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
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
