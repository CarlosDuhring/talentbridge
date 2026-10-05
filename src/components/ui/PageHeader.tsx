import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] leading-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-graphite">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
