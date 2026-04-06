import type { User } from "@/lib/types";

export const mockReporter: User = {
  id: 1,
  email: "maria@wildlifetrust.org",
  name: "Maria Santos",
  role: "reporter",
  organization: "Wildlife Trust International",
  wallet_address: "DRtXHDgC312wpNdNCSb8vCoXDcofCJcPHdAa4VnA8DQ5",
};

export const mockVerifier: User = {
  id: 2,
  email: "james@earthteam.org",
  name: "James Okonkwo",
  role: "verifier",
  organization: "EarthTeam",
  wallet_address: "7nYBtc4xJPWbQEhHp1ERNBLiDg9MC4j9rRAFgMkXbqvR",
};

export const mockAdmin: User = {
  id: 3,
  email: "admin@earthteam.org",
  name: "EarthTeam Admin",
  role: "admin",
  organization: "EarthTeam",
};

export const mockUsers: User[] = [mockReporter, mockVerifier, mockAdmin];
