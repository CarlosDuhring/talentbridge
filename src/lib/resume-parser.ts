import { sanitizeResumeText } from "./prompt-injection";

export async function extractResumeText(
  buffer: Buffer,
  fileName: string
): Promise<{ text: string; fileType: string }> {
  const lower = fileName.toLowerCase();
  let text: string;
  let fileType: string;

  if (lower.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    text = data.text;
    fileType = "PDF";
  } else if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
    fileType = "DOCX";
  } else {
    throw new Error("Formato não suportado. Envie um arquivo PDF ou DOCX.");
  }

  return { text: sanitizeResumeText(text).text, fileType };
}