export function Logo({
  size = "md",
  inverted = false,
}: {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}) {
  const sizes = { sm: 20, md: 26, lg: 34 };
  const text = {
    sm: "text-[15px]",
    md: "text-[18px]",
    lg: "text-[24px]",
  };
  const s = sizes[size];
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg
        width={s}
        height={s}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill={inverted ? "#ffffff" : "#0075de"} />
        <path
          d="M7 21c0-5 4-9 9-9s9 4 9 9"
          stroke={inverted ? "#0075de" : "#ffffff"}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M7 21h18"
          stroke={inverted ? "#0075de" : "#ffffff"}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="16" cy="12" r="2.4" fill={inverted ? "#ffb110" : "#ffb110"} />
      </svg>
      <span
        className={`${text[size]} font-semibold tracking-[-0.02em] ${
          inverted ? "text-white" : "text-black"
        }`}
      >
        TalentBridge
      </span>
    </span>
  );
}
