import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export default function Button({
  href,
  children,
  variant = "primary",
}: ButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-[var(--brand-blue)] text-white hover:opacity-90"
      : "border border-[var(--brand-blue)] text-[var(--brand-blue)] hover:bg-[var(--brand-blue)] hover:text-white";

  return (
    <Link
      href={href}
      className={`inline-flex rounded-full px-6 py-3 font-semibold transition ${styles}`}
    >
      {children}
    </Link>
  );
}