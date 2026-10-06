"use client";

export function LoadingOverlay({
  title,
  steps,
  activeStep,
}: {
  title: string;
  steps: string[];
  activeStep: number;
}) {
  const total = steps.length;
  const progress = Math.min(
    100,
    Math.round(((activeStep + 0.5) / total) * 100)
  );

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-notion-blue/20" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-notion-blue" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-black">{title}</p>
          <p className="text-xs text-graphite">
            {steps[activeStep] ?? "Processando"}...
          </p>
        </div>
        <span className="ml-auto text-sm font-semibold tabular-nums text-notion-blue">
          {progress}%
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full bg-notion-blue transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-4 space-y-1.5">
        {steps.map((step, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <li
              key={step}
              className={`flex items-center gap-2 text-sm ${
                done
                  ? "text-graphite"
                  : active
                    ? "font-medium text-black"
                    : "text-stone"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${
                  done
                    ? "bg-[#1f7a4d] text-white"
                    : active
                      ? "bg-notion-blue text-white"
                      : "bg-black/[0.06] text-stone"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {step}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
