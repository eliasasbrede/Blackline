import { Redaction } from "../types";

interface RedactionResponse {
  redactions: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    type: string;
    confidence: number;
    reason: string;
    proposedSubstitute?: string;
  }>;
  error?: string;
}

export async function suggestRedactions(text: string, instructions: string, mode: 'redact' | 'substitute'): Promise<Redaction[]> {
  const response = await fetch("/api/redact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, instructions, mode }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: "Unknown error" }));
    
    if (response.status === 413) {
      throw new Error("Document is too large. Please use a document under 100,000 characters.");
    }
    if (response.status === 429) {
      throw new Error("Rate limited. Please wait a moment and try again.");
    }
    
    throw new Error(errorBody.error || `Server error (${response.status})`);
  }

  const data: RedactionResponse = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  // Transform server response into Redaction objects with IDs and status
  return (data.redactions || []).map((r) => ({
    id: crypto.randomUUID(),
    text: r.text,
    startIndex: r.startIndex,
    endIndex: r.endIndex,
    type: r.type,
    confidence: r.confidence,
    status: "suggested" as const,
    action: mode === 'substitute' ? 'substitute' : 'redact',
    proposedSubstitute: r.proposedSubstitute,
    reason: r.reason,
  }));
}
