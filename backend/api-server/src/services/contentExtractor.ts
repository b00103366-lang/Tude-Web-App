/**
 * Content Extractor — downloads professor-uploaded files from storage and extracts
 * raw text for AI processing. Runs entirely server-side; no professor interaction.
 */

import { join } from "path";
import { readFile } from "fs/promises";
import { ObjectStorageService } from "../lib/objectStorage";
const LOCAL_UPLOAD_DIR = join(process.cwd(), "local-uploads");
const storageService = new ObjectStorageService();

// ── File buffer fetcher ───────────────────────────────────────────────────────

async function getFileBuffer(fileUrl: string): Promise<Buffer> {
  // Local dev storage: /local/<uuid>.<ext>
  if (fileUrl.startsWith("/local/")) {
    const filename = fileUrl.slice("/local/".length);
    return readFile(join(LOCAL_UPLOAD_DIR, filename));
  }

  // GCS object storage: /objects/uploads/<uuid>
  if (fileUrl.startsWith("/objects/")) {
    const file = await storageService.getObjectEntityFile(fileUrl);
    const [buffer] = await file.download();
    return buffer as Buffer;
  }

  throw new Error(`Unsupported storage path format: ${fileUrl}`);
}

// ── PDF ───────────────────────────────────────────────────────────────────────

async function extractPdf(fileUrl: string): Promise<string> {
  const { default: pdfParse } = await import("pdf-parse") as any;
  const buffer = await getFileBuffer(fileUrl);
  const result = await pdfParse(buffer);
  return (result.text as string).trim();
}

// ── DOCX ─────────────────────────────────────────────────────────────────────

async function extractDocx(fileUrl: string): Promise<string> {
  const { default: mammoth } = await import("mammoth") as any;
  const buffer = await getFileBuffer(fileUrl);
  const result = await mammoth.extractRawText({ buffer });
  return (result.value as string).trim();
}

// ── PPTX ─────────────────────────────────────────────────────────────────────

async function extractPptx(fileUrl: string): Promise<string> {
  const { default: officeParser } = await import("officeparser") as any;
  const buffer = await getFileBuffer(fileUrl);
  const text: string = await officeParser.parseOfficeAsync(buffer, {
    outputErrorToConsole: false,
  });
  return text.trim();
}

// ── Image → Claude Vision OCR ─────────────────────────────────────────────────

async function extractImage(fileUrl: string, fileType: string | null): Promise<string> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set — cannot run vision OCR");

  const buffer = await getFileBuffer(fileUrl);
  const base64 = buffer.toString("base64");

  // Infer media type from MIME or file extension
  const mime = (fileType ?? "").toLowerCase();
  const ext  = fileUrl.split(".").pop()?.toLowerCase() ?? "";
  const mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" =
    mime.includes("png") || ext === "png"   ? "image/png"  :
    mime.includes("webp") || ext === "webp" ? "image/webp" :
    mime.includes("gif")  || ext === "gif"  ? "image/gif"  :
    "image/jpeg";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: "Extract ALL text from this educational document image exactly as it appears. Preserve mathematical notation, tables, and exercise numbers. Return only the raw text content.",
          },
        ],
      }],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Vision OCR API error ${response.status}: ${(err as any).error?.message ?? ""}`);
  }

  const data = await response.json() as { content: { text: string }[] };
  return (data.content?.[0]?.text ?? "").trim();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Extract plain text from a professor-uploaded file.
 * Supports: PDF, DOCX, PPTX, JPEG/PNG/WEBP images.
 * Throws if the file type is unsupported or extraction fails.
 */
export async function extractText(fileUrl: string, fileType: string | null): Promise<string> {
  const t = (fileType ?? "").toLowerCase();
  const ext = fileUrl.split(".").pop()?.toLowerCase() ?? "";

  // Plain text — read directly
  if (t.includes("text/plain") || t === "text" || ext === "txt") {
    const buffer = await getFileBuffer(fileUrl);
    return buffer.toString("utf-8").trim();
  }

  // PDF
  if (t.includes("pdf") || ext === "pdf") {
    return extractPdf(fileUrl);
  }

  // DOCX
  if (t.includes("wordprocessingml") || t.includes("docx") || t.includes("msword") || ext === "docx") {
    return extractDocx(fileUrl);
  }

  // PPTX
  if (t.includes("presentationml") || t.includes("pptx") || t.includes("powerpoint") || ext === "pptx") {
    return extractPptx(fileUrl);
  }

  // Images
  if (t.includes("image/") || ["jpeg", "jpg", "png", "webp", "gif"].includes(ext)) {
    return extractImage(fileUrl, fileType);
  }

  throw new Error(`Unsupported file type for text extraction: ${fileType ?? ext ?? "unknown"}`);
}
