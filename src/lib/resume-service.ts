import { prisma } from "./db";
import { extractResumeText } from "./resume-parser";
import { getAIProvider } from "./ai";
import { addCandidateSkill, upsertSkill } from "./scoring";
import type { ResumeAnalysisData } from "./ai/types";

export const MAX_RESUME_SIZE = 8 * 1024 * 1024;

const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ResumeProcessResult = {
  resumeId: string;
  provider: string;
  analysis: ResumeAnalysisData;
};

export async function processResume(
  candidateId: string,
  buffer: Buffer,
  fileName: string
): Promise<ResumeProcessResult> {
  const { text, fileType } = await extractResumeText(buffer, fileName);
  if (!text.trim()) {
    throw new Error(
      "Não foi possível extrair texto do arquivo. Verifique se o PDF contém texto selecionável."
    );
  }

  const ai = getAIProvider();
  const analysis = await ai.analyzeResume(text);

  const resume = await prisma.resume.create({
    data: {
      candidateId,
      fileName,
      fileType,
      mimeType: fileType === "PDF" ? "application/pdf" : MIME_DOCX,
      fileData: buffer.toString("base64"),
      hasFile: true,
      rawText: text.slice(0, 100000),
    },
  });

  await prisma.resumeAnalysis.create({
    data: {
      resumeId: resume.id,
      provider: ai.name,
      data: JSON.stringify(analysis),
    },
  });

  const [existingEducations, existingCertifications, existingCourses] =
    await Promise.all([
      prisma.education.findMany({ where: { candidateId } }),
      prisma.certification.findMany({ where: { candidateId } }),
      prisma.candidateCourse.findMany({ where: { candidateId } }),
    ]);
  const educationKeys = new Set(
    existingEducations.map((e) => `${e.institution}|${e.course}`.toLowerCase())
  );
  const certificationKeys = new Set(
    existingCertifications.map((c) => c.name.toLowerCase())
  );
  const courseKeys = new Set(existingCourses.map((c) => c.name.toLowerCase()));

  for (const e of analysis.education) {
    const key = `${e.institution}|${e.course}`.toLowerCase();
    if (educationKeys.has(key)) continue;
    educationKeys.add(key);
    await prisma.education.create({
      data: {
        candidateId,
        institution: e.institution,
        course: e.course,
        level: e.level,
        startYear: e.startYear ?? null,
        endYear: e.endYear ?? null,
      },
    });
  }

  for (const c of analysis.certifications) {
    const key = c.name.toLowerCase();
    if (certificationKeys.has(key)) continue;
    certificationKeys.add(key);
    await prisma.certification.create({
      data: {
        candidateId,
        name: c.name,
        issuer: c.issuer ?? null,
        year: c.year ?? null,
      },
    });
  }

  for (const c of analysis.courses) {
    const key = c.name.toLowerCase();
    if (courseKeys.has(key)) continue;
    courseKeys.add(key);
    await prisma.candidateCourse.create({
      data: {
        candidateId,
        name: c.name,
        issuer: c.issuer ?? null,
        year: c.year ?? null,
      },
    });
  }

  return { resumeId: resume.id, provider: ai.name, analysis };
}

export async function confirmResumeSkills(
  candidateId: string,
  skills: { name: string; category: string; evidence?: string }[]
) {
  for (const s of skills) {
    const skill = await upsertSkill(s.name, s.category);
    await addCandidateSkill(
      candidateId,
      skill.id,
      "INFORMED",
      s.evidence || "Confirmado pelo candidato",
      "CURRICULO"
    );
  }
  return skills.length;
}
