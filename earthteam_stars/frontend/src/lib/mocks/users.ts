import type { User } from "@/lib/types";

export const mockReporter: User = {
  id: 1,
  email: "maria@wildlifetrust.org",
  name: "Maria Santos",
  role: "reporter",
  organization: "Wildlife Trust International",
  wallet_address: "MOCK_WALLET_REPORTER_1234",
};

export const mockReporterFreeland: User = {
  id: 4,
  email: "somchai@freeland.org",
  name: "Somchai Rattana",
  role: "reporter",
  organization: "Freeland Foundation",
  wallet_address: "MOCK_WALLET_REPORTER_4567",
};

export const mockReporterNPR: User = {
  id: 5,
  email: "amara@nationalparkrescue.org",
  name: "Amara Osei",
  role: "reporter",
  organization: "National Park Rescue",
  wallet_address: "MOCK_WALLET_REPORTER_8901",
};

export const mockReporterEntropika: User = {
  id: 6,
  email: "lucia@entropika.org",
  name: "Lucia Vargas",
  role: "reporter",
  organization: "Entropika",
  wallet_address: "MOCK_WALLET_REPORTER_2345",
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

export const mockUsers: User[] = [
  mockReporter,
  mockReporterFreeland,
  mockReporterNPR,
  mockReporterEntropika,
  mockVerifier,
  mockAdmin,
];
