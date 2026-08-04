import Link from "next/link";

const navItems = [
  { href: "/about", label: "About" },
  { href: "/tournament", label: "Tournament" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/register", label: "Register" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="max-w-[220px] text-sm font-semibold leading-tight tracking-wide text-[var(--brand-navy)] sm:max-w-none"
        >
          SGM Chad Miller Memorial
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-[var(--brand-blue)]"
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
      </div>
    </nav>
  );
}