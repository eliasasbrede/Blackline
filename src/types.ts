export interface Redaction {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  type: string; // e.g., "person", "email", "date", "custom"
  confidence: number;
  status: 'suggested' | 'accepted' | 'rejected' | 'manual';
  action?: 'redact' | 'substitute' | 'keep';
  proposedSubstitute?: string;
  reason?: string;
}

export interface DocumentState {
  mode: 'redact' | 'substitute';
  originalText: string;
  redactedText: string;
  redactions: Redaction[];
  instructions: string;
  reviewerName: string;
  reviewerEmail: string;
  manifest?: ReleaseManifest;
}

export interface ReleaseManifest {
  mode: 'redact' | 'substitute';
  hash: string;
  timestamp: string;
  reviewerName: string;
  reviewerEmail: string;
  policy: string;
  redactionCount: number;
  originalHash: string;
}

export type AppStep = 'LANDING' | 'UPLOAD' | 'REDACT' | 'MIDNIGHT' | 'MANIFEST';
