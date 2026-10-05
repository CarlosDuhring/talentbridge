import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: "marigold" | "coral" | "sky" | "midnight" | "sky-tint" | "mocha";
}) {
  const accents: Record<string, string> = {
    marigold: "bg-marigold text-black border-transparent",
    coral: "bg-coral text-white border-transparent",
    sky: "bg-sky-wash text-black border-transparent",
    midnight: "bg-midnight-ink text-white border-transparent",
    "sky-tint": "bg-sky-tint text-black border-transparent",
    mocha: "bg-mocha text-white border-transparent",
  };
  return (
    <div
      className={`rounded-xl border ${
        accent ? accents[accent] : "bg-white border-black/[0.08]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-black/[0.06]">
      <div>
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-graphite mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
