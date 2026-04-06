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
  manifestHash?: string;
  attestation?: AttestationState;
}

export interface AttestationState {
  status: 'none' | 'signed' | 'on-chain';
  signature?: { data: string; signature: string; verifyingKey: string };
  txHash?: string;
  contractAddress?: string;
  attestedAt?: string;
  walletAddress?: string;
  documentId?: string;
  metadataHash?: string;
}

export interface WalletState {
  available: boolean;
  connected: boolean;
  address: string | null;
  balance: { dust: bigint } | null;
  network: string;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
  walletName?: string;
  walletIcon?: string;
}

export type AppStep = 'LANDING' | 'UPLOAD' | 'REDACT' | 'MIDNIGHT' | 'MANIFEST';
