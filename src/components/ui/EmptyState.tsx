import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.12] bg-white/60 px-6 py-12 text-center">
      <p className="text-[15px] font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-graphite">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
