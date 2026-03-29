import { Redaction } from "../types";

export async function suggestRedactions(text: string, instructions: string): Promise<Redaction[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const redactions: Redaction[] = [];
  
  // Simple mock logic: find capitalized words that look like names, or anything that looks like an email/amount
  // This is just a simulation for the UI shell.
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const amountRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?/g;
  const nameRegex = /[A-Z][a-z]+ [A-Z][a-z]+/g;

  let match;

  // Find Emails
  while ((match = emailRegex.exec(text)) !== null) {
    redactions.push({
      id: crypto.randomUUID(),
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      type: "email",
      confidence: 0.99,
      status: 'suggested',
      reason: "Identified as an email address."
    });
  }

  // Find Amounts
  while ((match = amountRegex.exec(text)) !== null) {
    redactions.push({
      id: crypto.randomUUID(),
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      type: "financial",
      confidence: 0.95,
      status: 'suggested',
      reason: "Identified as a financial amount."
    });
  }

  // Find Names (very naive)
  while ((match = nameRegex.exec(text)) !== null) {
    // Avoid overlapping with emails
    const isOverlapping = redactions.some(r => 
      (match!.index >= r.startIndex && match!.index < r.endIndex) ||
      (match!.index + match![0].length > r.startIndex && match!.index + match![0].length <= r.endIndex)
    );

    if (!isOverlapping) {
      redactions.push({
        id: crypto.randomUUID(),
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        type: "person",
        confidence: 0.85,
        status: 'suggested',
        reason: "Identified as a personal name."
      });
    }
  }

  return redactions.sort((a, b) => a.startIndex - b.startIndex);
}
