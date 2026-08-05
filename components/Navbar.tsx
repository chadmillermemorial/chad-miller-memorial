"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/about", label: "About" },
  { href: "/tournament", label: "Tournament" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/register", label: "Join Us" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo/logo.png"
            alt="SGM Chad Miller Memorial logo"
            width={54}
            height={54}
            className="h-12 w-12 object-contain"
          />

          <span className="hidden text-sm font-semibold leading-tight text-[var(--brand-navy)] sm:block">
            SGM Chad Miller Memorial
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`border-b-2 py-2 text-sm font-medium transition ${
                isActive(item.href)
                  ? "border-[var(--brand-teal)] text-[var(--brand-navy)]"
                  : "border-transparent text-slate-600 hover:text-[var(--brand-blue)]"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/register"
            className="rounded-full bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Register
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-[var(--brand-navy)] md:hidden"
        >
          <span className="text-2xl leading-none">{menuOpen ? "×" : "☰"}</span>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`text-base font-medium ${
                  isActive(item.href)
                    ? "text-[var(--brand-blue)]"
                    : "text-slate-700"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-full bg-[var(--brand-blue)] px-5 py-3 text-center font-semibold text-white"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}