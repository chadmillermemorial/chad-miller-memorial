import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
};

export default function Card({ children }: CardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      {children}
    </div>
  );
}