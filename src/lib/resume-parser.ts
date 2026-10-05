export async function extractResumeText(
  buffer: Buffer,
  fileName: string
): Promise<{ text: string; fileType: string }> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return { text: data.text, fileType: "PDF" };
  }
  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, fileType: "DOCX" };
  }
  throw new Error("Formato não suportado. Envie um arquivo PDF ou DOCX.");
}
