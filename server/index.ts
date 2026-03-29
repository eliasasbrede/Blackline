import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = parseInt(process.env.API_PORT || "3001", 10);
const MAX_DOCUMENT_LENGTH = 100_000;
const GEMINI_MODEL = "gemini-2.5-flash";

// ---------------------------------------------------------------------------
// Gemini setup
// ---------------------------------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai: InstanceType<typeof GoogleGenAI> | null = null;

if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RedactRequest {
  text: string;
  instructions: string;
}

interface RedactionResult {
  text: string;
  startIndex: number;
  endIndex: number;
  type: string;
  confidence: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// System prompt — instructs Gemini to return structured redaction spans
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are Blackline, a precision document redaction engine. You analyze text and identify exact spans that must be redacted according to the user's disclosure policy.

Your task has TWO distinct parts:
1. EXACT TERMS: Identify any specific literal words, names, or short phrases the user EXPLICITLY requested to be redacted system-wide (e.g. "Cardano", "Project Falcon"). Extract them EXACTLY as written into the exact_terms_to_redact array.
2. CONTEXTUAL REDACTIONS: Identify other sensitive entities (like emails, phone numbers, or types of people's names if generally requested) that fall under the policy but weren't given as exact explicit literals.

STRICT RULES:
1. Do not hallucinate exact terms. Only use strings explicitly asked to be removed globally.
2. Do not misclassify generic document titles (e.g. "Cardano Basics") as contextual person names. If they asked to redact "Cardano", put "Cardano" in exact_terms_to_redact and ignore "Cardano Basics" contextually unless it explicitly violates another rule.
3. NEVER over-redact. Never add categories the user did not ask for.
4. Return 0-based character indices for contextual_redactions.

RESPONSE FORMAT — return ONLY this strict JSON structure, and absolutely nothing else:
{
  "exact_terms_to_redact": ["Cardano", "Project Falcon"],
  "contextual_redactions": [
    {
      "text": "exact substring from document",
      "startIndex": 0,
      "endIndex": 10,
      "type": "person",
      "confidence": 0.95,
      "reason": "Identified per disclosure policy"
    }
  ]
}`;

// ---------------------------------------------------------------------------
// Mock fallback — used when GEMINI_API_KEY is not set
// ---------------------------------------------------------------------------
function mockRedact(text: string, instructions: string): RedactionResult[] {
  const redactions: RedactionResult[] = [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const amountRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?/g;
  const nameRegex = /[A-Z][a-z]+ [A-Z][a-z]+/g;

  // Extremely basic heuristic to simulate the dual-path engine when Gemini API Key is missing.
  // We'll extract capitalized words from the policy that aren't common stop words.
  const policyWords = instructions.split(/\s+/).filter(w => w.length > 4 && /[A-Z]/.test(w[0]));
  const processedTerms = new Set<string>();

  for (const term of policyWords) {
    const cleanTerm = term.replace(/[.,!?;:\"']/g, "");
    if (processedTerms.has(cleanTerm)) continue;
    processedTerms.add(cleanTerm);

    const escapedText = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedText, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      redactions.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        type: "instruction",
        confidence: 1.0,
        reason: "[MOCK ENGINE] Explicit term extracted from user instruction fallback."
      });
    }
  }

  let match: RegExpExecArray | null;
  while ((match = emailRegex.exec(text)) !== null) {
    redactions.push({ text: match[0], startIndex: match.index, endIndex: match.index + match[0].length, type: "email", confidence: 0.99, reason: "Identified as an email address." });
  }
  while ((match = amountRegex.exec(text)) !== null) {
    redactions.push({ text: match[0], startIndex: match.index, endIndex: match.index + match[0].length, type: "financial", confidence: 0.95, reason: "Identified as a financial amount." });
  }
  while ((match = nameRegex.exec(text)) !== null) {
    const overlap = redactions.some((r) => match!.index < r.endIndex && match!.index + match![0].length > r.startIndex);
    if (!overlap) {
      redactions.push({ text: match[0], startIndex: match.index, endIndex: match.index + match[0].length, type: "person", confidence: 0.85, reason: "Identified as a personal name." });
    }
  }
  return redactions.sort((a, b) => a.startIndex - b.startIndex);
}

// ---------------------------------------------------------------------------
// Validation & normalization utilities
// ---------------------------------------------------------------------------

/** Strip markdown code fences that LLMs sometimes wrap around JSON */
function stripCodeFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return s.trim();
}

/** Validate a single redaction against the source text */
function validateRedaction(r: any, text: string): RedactionResult | null {
  // Must have numeric indices
  if (typeof r.startIndex !== "number" || typeof r.endIndex !== "number") return null;
  if (r.startIndex < 0 || r.endIndex > text.length || r.startIndex >= r.endIndex) return null;

  const claimedText: string = typeof r.text === "string" ? r.text : "";
  const actualText = text.substring(r.startIndex, r.endIndex);

  let finalStart = r.startIndex;
  let finalEnd = r.endIndex;
  let finalText = actualText;

  // If the text at the given indices doesn't match the claimed text, try to
  // locate the claimed text in the document and fix the indices.
  if (claimedText && actualText !== claimedText) {
    const foundAt = text.indexOf(claimedText);
    if (foundAt !== -1) {
      finalStart = foundAt;
      finalEnd = foundAt + claimedText.length;
      finalText = claimedText;
    } else {
      // Indices exist but text doesn't match anywhere — use what's at the indices
      finalText = actualText;
    }
  }

  // Final bounds check after correction
  if (finalStart < 0 || finalEnd > text.length || finalStart >= finalEnd) return null;
  if (finalText.trim().length === 0) return null;

  const VALID_TYPES = new Set([
    "person", "email", "phone", "address", "financial", "date",
    "organization", "id_number", "medical", "legal", "project_name", "custom",
  ]);

  return {
    text: finalText,
    startIndex: finalStart,
    endIndex: finalEnd,
    type: VALID_TYPES.has(r.type) ? r.type : "custom",
    confidence: Math.min(1, Math.max(0, typeof r.confidence === "number" ? r.confidence : 0.8)),
    reason: typeof r.reason === "string" && r.reason.length > 0 ? r.reason : "Identified as sensitive per disclosure policy.",
  };
}

/** Remove overlapping redactions — instruction/manual overrides win completely over contextual deductions */
function deduplicateOverlaps(redactions: RedactionResult[]): RedactionResult[] {
  const sorted = [...redactions].sort((a, b) => a.startIndex - b.startIndex);
  const result: RedactionResult[] = [];

  for (const r of sorted) {
    const last = result[result.length - 1];
    if (last && r.startIndex < last.endIndex) {
      // Overlap detected
      const rIsInst = r.type === "instruction" || r.type === "manual";
      const lastIsInst = last.type === "instruction" || last.type === "manual";

      if (rIsInst && !lastIsInst) {
        result[result.length - 1] = r; // Replace hallucinated/context prediction with explicit exact target
      } else if (!rIsInst && lastIsInst) {
        // Keep last, it's explicitly defined
      } else {
        // Keep higher confidence; if tied, keep longer span
        if (r.confidence > last.confidence || (r.confidence === last.confidence && (r.endIndex - r.startIndex) > (last.endIndex - last.startIndex))) {
          result[result.length - 1] = r;
        }
      }
    } else {
      result.push(r);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Gemini redaction engine
// ---------------------------------------------------------------------------
async function geminiRedact(text: string, instructions: string): Promise<RedactionResult[]> {
  if (!ai) throw new Error("Gemini AI client not initialized");

  const userPrompt = `DISCLOSURE POLICY:
${instructions}

DOCUMENT TO ANALYZE (${text.length} characters):
${text}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.1,
      topP: 0.95,
      responseMimeType: "application/json",
    },
  });

  const rawText = response.text?.trim();

  if (!rawText) {
    console.log("[gemini] Empty response — no redactions");
    return [];
  }

  // Parse JSON
  const jsonStr = stripCodeFences(rawText);
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error("[gemini] Failed to parse response as JSON. Raw (first 500 chars):", rawText.substring(0, 500));
    throw new Error("AI returned an invalid response format. Please try again.");
  }

  // Extract redactions arrays
  const exactTerms: string[] = Array.isArray(parsed.exact_terms_to_redact) ? parsed.exact_terms_to_redact : [];
  const rawContextual: any[] = Array.isArray(parsed.contextual_redactions) 
    ? parsed.contextual_redactions 
    : Array.isArray(parsed.redactions) ? parsed.redactions : [];

  const combinedRedactions: RedactionResult[] = [];

  // Phase 1: Global Exact Instruction Targets
  const processedTerms = new Set<string>();
  for (const term of exactTerms) {
    if (typeof term !== 'string' || term.trim().length === 0) continue;
    if (processedTerms.has(term)) continue;
    processedTerms.add(term);

    const escapedText = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedText, 'gi'); // Case-insensitive global sweep
    let match;
    while ((match = regex.exec(text)) !== null) {
      combinedRedactions.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        type: "instruction",
        confidence: 1.0,
        reason: "Explicit term specified in user instruction."
      });
    }
  }

  // Phase 2: Contextual validations
  let validContextual = 0;
  for (const r of rawContextual) {
    const clean = validateRedaction(r, text);
    if (clean) {
      combinedRedactions.push(clean);
      validContextual++;
    } else {
      console.warn("[gemini] Skipped invalid contextual redaction:", JSON.stringify(r).substring(0, 200));
    }
  }

  // Deduplicate overlapping spans (instructions win)
  const deduped = deduplicateOverlaps(combinedRedactions);

  console.log(`[gemini] Parsed ${exactTerms.length} exact instructions -> ${combinedRedactions.length - validContextual} hits. Contextual spans: ${validContextual} valid. Combined deduplicated hits: ${deduped.length}`);

  return deduped;
}

// ---------------------------------------------------------------------------
// POST /api/redact
// ---------------------------------------------------------------------------
app.post("/api/redact", async (req, res) => {
  try {
    const { text, instructions } = req.body as RedactRequest;

    // Input validation
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Missing or invalid 'text' field" });
      return;
    }
    if (!instructions || typeof instructions !== "string") {
      res.status(400).json({ error: "Missing or invalid 'instructions' field" });
      return;
    }
    if (text.length > MAX_DOCUMENT_LENGTH) {
      res.status(413).json({ error: `Document too large. Maximum ${MAX_DOCUMENT_LENGTH.toLocaleString()} characters.` });
      return;
    }
    if (text.trim().length === 0) {
      res.status(400).json({ error: "Document is empty." });
      return;
    }

    // Route to engine
    let redactions: RedactionResult[];

    if (ai) {
      console.log(`[api] Gemini redaction request — ${text.length} chars, policy: "${instructions.substring(0, 80)}..."`);
      redactions = await geminiRedact(text, instructions);
    } else {
      console.log(`[api] Mock redaction (no GEMINI_API_KEY) — ${text.length} chars`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      redactions = mockRedact(text, instructions);
      
      // We must dedupe mock redactions too because we just added instruction parsing to it!
      redactions = deduplicateOverlaps(redactions);
    }

    res.json({ redactions });
  } catch (err: any) {
    console.error("[api] Redaction error:", err?.message || err);

    const errStr = JSON.stringify(err);
    if (err?.status === 429 || err?.message?.includes("429") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
      res.status(429).json({ error: "Rate limited by AI provider (Daily free tier quota exhausted). Please wait or use a different account/project." });
      return;
    }
    if (err?.message?.includes("invalid response format")) {
      res.status(502).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: "Failed to analyze document. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    engine: ai ? "gemini" : "mock",
    model: ai ? GEMINI_MODEL : null,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🛡️  Blackline API server running on http://localhost:${PORT}`);
  if (ai) {
    console.log(`   Engine: Gemini (${GEMINI_MODEL})`);
  } else {
    console.log("   Engine: Mock regex fallback (set GEMINI_API_KEY in .env for real AI)");
  }
});
