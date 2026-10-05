import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Accessible variant-based button primitive matching the shadcn/ui composition pattern. */
export type ButtonVariant = "default" | "outline";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children: ReactNode };

export function Button({ variant = "default", className = "", type = "button", children, ...props }: Props) {
  const variantClass = variant === "outline" ? "button button-secondary" : "button";
  return <button {...props} type={type} className={`${variantClass} ${className}`.trim()}>{children}</button>;
}
