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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-xl border border-black/[0.08] bg-white p-8">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-notion-blue border-t-transparent" />
          <h2 className="text-[17px] font-semibold">{title}</h2>
        </div>
        <ul className="mt-5 space-y-3">
          {steps.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    done
                      ? "bg-[#1f7a4d] text-white"
                      : active
                        ? "bg-sky-tint text-notion-blue"
                        : "bg-black/[0.05] text-stone"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={
                    done
                      ? "text-graphite"
                      : active
                        ? "font-medium text-black"
                        : "text-stone"
                  }
                >
                  {step}
                </span>
                {active ? (
                  <span className="ml-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-notion-blue/40 border-t-notion-blue" />
                ) : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-xs text-stone">
          Não feche esta página enquanto a análise termina.
        </p>
      </div>
    </div>
  );
}
