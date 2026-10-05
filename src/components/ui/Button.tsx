import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost" | "text" | "outlined" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 rounded-lg disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-notion-blue text-white hover:bg-[#0068c4]",
  ghost: "bg-sky-tint text-notion-blue hover:bg-[#d8ecfd]",
  text: "bg-transparent text-black/95 hover:bg-black/5",
  outlined:
    "bg-transparent text-black/90 border border-black/20 hover:border-black/40 hover:bg-black/[0.02]",
  danger: "bg-transparent text-vermillion border border-vermillion/30 hover:bg-vermillion/5",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] px-3 py-1.5",
  md: "text-sm px-[15px] py-1.5",
  lg: "text-[15px] px-5 py-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
