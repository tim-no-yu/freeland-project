// ─── User ────────────────────────────────────────────────────────
export type UserRole = "reporter" | "verifier" | "admin";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  wallet_address?: string;
}

// ─── Report Card ─────────────────────────────────────────────────
export type ReportCardType = "action" | "impact";

export type ReportCardStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "awaiting_info"
  | "approved"
  | "rejected"
  | "issued";

export type PlanetaryCategory =
  | "wildlife_protection"
  | "habitat_protection"
  | "regenerative_agriculture";

export type StarLevel = "copper" | "silver" | "gold" | "platinum";

export interface ReportCard {
  id: number;
  reporter: Pick<User, "id" | "name" | "email" | "organization">;
  type: ReportCardType;
  title: string;
  description: string;
  category: PlanetaryCategory;
  activity_date?: string;
  location?: string;
  notes?: string;

  // Step 2 fields
  problem_statement?: string;
  tags?: string[];
  results?: string;

  // Impact-specific (only when type === "impact")
  outcomes?: string;
  metrics_value?: number;
  metrics_unit?: string;
  baseline_description?: string;

  status: ReportCardStatus;
  star_level?: StarLevel;
  stars_awarded?: number;

  evidence: Evidence[];
  witnesses: Witness[];
  verifications: Verification[];
  chain_record?: ChainRecord;

  created_at: string;
  updated_at: string;
}

export type ReportCardListItem = Omit<
  ReportCard,
  "evidence" | "witnesses" | "verifications" | "chain_record"
>;

// ─── Evidence ────────────────────────────────────────────────────
export interface Evidence {
  id: number;
  report_card_id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  description?: string;
  uploaded_at: string;
}

// ─── Witness ─────────────────────────────────────────────────────
export interface Witness {
  id?: number;
  name: string;
  email?: string;
  organization?: string;
  relationship?: string;
}

// ─── Verification / Review ───────────────────────────────────────
export type VerificationDecision = "approve" | "reject" | "request_info";

export interface RubricScores {
  evidence_quality: number;   // 1-5
  impact_clarity: number;     // 1-5
  completeness: number;       // 1-5
  [key: string]: number;      // extensible for future rubric fields
}

export interface Verification {
  id: number;
  report_card_id: number;
  verifier: Pick<User, "id" | "name" | "email">;
  decision: VerificationDecision;
  scores: RubricScores;
  total_score: number;
  comments?: string;
  created_at: string;
}

// ─── Chain Record ────────────────────────────────────────────────
export interface ChainRecord {
  id: number;
  report_card_id: number;
  transaction_hash: string;
  wallet_address: string;
  token_amount: number;
  memo?: string;
  network: "devnet" | "mainnet";
  explorer_url: string;
  created_at: string;
}

// ─── API Helpers ─────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [field: string]: string | string[] | undefined;
}

// ─── Form Payloads ───────────────────────────────────────────────
export interface CreateReportCardPayload {
  type: ReportCardType;
  title: string;
  description: string;
  category: PlanetaryCategory;
  activity_date?: string;
  location?: string;
  notes?: string;
  problem_statement?: string;
  tags?: string[];
  results?: string;
  outcomes?: string;
  metrics_value?: number;
  metrics_unit?: string;
  baseline_description?: string;
  witnesses: Omit<Witness, "id">[];
}

export interface SubmitReviewPayload {
  report_card_id: number;
  decision: VerificationDecision;
  scores: RubricScores;
  comments?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}
