export type ETSTier = 'COPPER' | 'SILVER' | 'GOLD';

export interface ETSReport {
  // Tier 1: Copper (Collaboration)
  userName: string;
  location: string;
  solutionDescription: string;
  
  // Tier 2: Silver (Action) - Optional
  problemStatement?: string;
  teamSize?: number;
  duration?: string;
  evidenceUrl?: string; // For the file uploads Tim is setting up
  
  // Tier 3: Gold (Impact) - Optional
  outcomeIndicators?: string; 
  impactMetrics?: string;
  tier: ETSTier;
}