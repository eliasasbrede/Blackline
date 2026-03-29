export interface Redaction {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  type: string; // e.g., "person", "email", "date", "custom"
  confidence: number;
  status: 'suggested' | 'accepted' | 'rejected' | 'manual';
  reason?: string;
}

export interface DocumentState {
  originalText: string;
  redactedText: string;
  redactions: Redaction[];
  instructions: string;
  manifest?: ReleaseManifest;
}

export interface ReleaseManifest {
  hash: string;
  timestamp: string;
  reviewer: string;
  policy: string;
  redactionCount: number;
  originalHash: string;
}

export type AppStep = 'LANDING' | 'UPLOAD' | 'REDACT' | 'REVIEW' | 'MANIFEST';
