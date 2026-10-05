import type { ReactNode } from "react";

type Tone =
  | "neutral"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "purple"
  | "sky";

const tones: Record<Tone, string> = {
  neutral: "bg-black/[0.06] text-black/70",
  blue: "bg-sky-tint text-notion-blue",
  green: "bg-[#e3f5e9] text-[#1a7f45]",
  yellow: "bg-[#fff3d6] text-[#8a5a00]",
  red: "bg-[#fde8e4] text-vermillion",
  purple: "bg-[#ece9fb] text-[#5b4bc4]",
  sky: "bg-[#e6f3fe] text-[#0b6bb8]",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function scoreTone(score: number): Tone {
  if (score >= 85) return "green";
  if (score >= 70) return "blue";
  if (score >= 50) return "yellow";
  return "red";
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <Badge tone={scoreTone(score)} className="font-semibold tabular-nums">
      {Math.round(score)}/100
    </Badge>
  );
}
