import { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
};

export default function SectionHeading({
  eyebrow,
  title,
  children,
}: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-3 text-4xl font-bold tracking-tight text-[var(--brand-navy)] md:text-5xl">
        {title}
      </h2>

      {children && (
        <div className="mt-6 text-lg leading-8 text-slate-600">
          {children}
        </div>
      )}
    </div>
  );
}