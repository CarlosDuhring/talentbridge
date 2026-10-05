import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const field =
  "w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-sm text-black placeholder:text-black/35 focus:outline-none focus:border-notion-blue focus:ring-2 focus:ring-notion-blue/15 transition-colors";

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-black/80">
        {label}
        {required ? <span className="text-vermillion ml-0.5">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-stone">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${field} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${field} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${field} ${props.className ?? ""}`} />;
}
