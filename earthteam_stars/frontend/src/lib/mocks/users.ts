import type { User } from "@/lib/types";

export const mockReporter: User = {
  id: 1,
  email: "maria@wildlifetrust.org",
  name: "Maria Santos",
  role: "reporter",
  organization: "Wildlife Trust International",
  wallet_address: "MOCK_WALLET_REPORTER_1234",
};

export const mockVerifier: User = {
  id: 2,
  email: "james@earthteam.org",
  name: "James Okonkwo",
  role: "verifier",
  organization: "EarthTeam",
  wallet_address: "MOCK_WALLET_VERIFIER_5678",
};

export const mockAdmin: User = {
  id: 3,
  email: "admin@earthteam.org",
  name: "EarthTeam Admin",
  role: "admin",
  organization: "EarthTeam",
};

export const mockUsers: User[] = [mockReporter, mockVerifier, mockAdmin];
