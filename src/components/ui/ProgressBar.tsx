export function ProgressBar({
  value,
  tone = "blue",
  className = "",
}: {
  value: number;
  tone?: "blue" | "green" | "yellow" | "red";
  className?: string;
}) {
  const colors = {
    blue: "bg-notion-blue",
    green: "bg-[#2f9e5f]",
    yellow: "bg-marigold",
    red: "bg-vermillion",
  };
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full rounded-full bg-black/[0.06] ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-500 ${colors[tone]}`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function scoreBarTone(score: number): "blue" | "green" | "yellow" | "red" {
  if (score >= 85) return "green";
  if (score >= 70) return "blue";
  if (score >= 50) return "yellow";
  return "red";
}
