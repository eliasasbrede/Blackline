/**
 * Blackline — Modular Document Text Extraction Layer
 *
 * Single entry point: extractText(buffer, filename)
 * Dispatches to the appropriate extractor based on file extension.
 * Adding a new format = one new case branch + dependency.
 */
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ExtractionResult {
  text: string;
  metadata: {
    filename: string;
    extension: string;
    sizeBytes: number;
    extractedAt: string;
  };
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Individual extractors
// ---------------------------------------------------------------------------

/** Plain text / markdown — straightforward UTF-8 decode */
function extractPlaintext(buffer: Buffer, filename: string): ExtractionResult {
  const text = buffer.toString("utf-8");
  const ext = getExtension(filename);
  return {
    text,
    metadata: {
      filename,
      extension: ext,
      sizeBytes: buffer.length,
      extractedAt: new Date().toISOString(),
    },
    warnings: [],
  };
}

/** DOCX — uses mammoth to extract raw text from OOXML */
async function extractDocx(buffer: Buffer, filename: string): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });

  const warnings: string[] = [];
  if (result.messages && result.messages.length > 0) {
    for (const msg of result.messages) {
      warnings.push(`[mammoth] ${msg.type}: ${msg.message}`);
    }
  }

  const text = result.value.trim();

  if (text.length === 0) {
    throw new Error("The uploaded .docx file appears to be empty or contains no extractable text.");
  }

  return {
    text,
    metadata: {
      filename,
      extension: ".docx",
      sizeBytes: buffer.length,
      extractedAt: new Date().toISOString(),
    },
    warnings:
      warnings.length > 0
        ? warnings
        : ["Some formatting may have been simplified during conversion."],
  };
}

/** PDF — uses pdf-parse to extract text from text-based PDFs (no OCR) */
async function extractPdf(buffer: Buffer, filename: string): Promise<ExtractionResult> {
  const parser = new PDFParse({ data: buffer });
  let textResult;
  try {
    textResult = await parser.getText();
  } finally {
    await parser.destroy();
  }

  const warnings: string[] = [];
  const text = textResult.text.trim();

  if (text.length === 0) {
    throw new Error(
      "The uploaded PDF appears to contain no extractable text. It may be a scanned/image-based PDF. Please convert it to a text-based PDF or .docx first."
    );
  }

  if (textResult.total > 100) {
    warnings.push(`Large document: ${textResult.total} pages. Extraction quality may vary.`);
  }

  warnings.push("PDF text extraction may lose some formatting, tables, and layout structure.");

  return {
    text,
    metadata: {
      filename,
      extension: ".pdf",
      sizeBytes: buffer.length,
      extractedAt: new Date().toISOString(),
    },
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? "." + parts.pop()!.toLowerCase() : "";
}

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".docx", ".pdf"]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Extract plaintext from any supported document buffer */
export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  const ext = getExtension(filename);

  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported file type "${ext}". Supported formats: ${[...SUPPORTED_EXTENSIONS].join(", ")}`
    );
  }

  switch (ext) {
    case ".docx":
      return extractDocx(buffer, filename);
    case ".pdf":
      return extractPdf(buffer, filename);
    case ".txt":
    case ".md":
      return extractPlaintext(buffer, filename);
    default:
      throw new Error(`No extractor available for "${ext}".`);
  }
}
