import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-semibold tracking-wide text-gray-900"
        >
          Chad Miller Memorial
        </Link>

        <div className="hidden gap-6 md:flex">
          <Link
            href="/about"
            className="text-sm text-gray-700 hover:text-teal-600"
          >
            About
          </Link>

          <Link
            href="/tournament"
            className="text-sm text-gray-700 hover:text-teal-600"
          >
            Tournament
          </Link>

          <Link
            href="/sponsors"
            className="text-sm text-gray-700 hover:text-teal-600"
          >
            Sponsors
          </Link>

          <Link
            href="/register"
            className="text-sm text-gray-700 hover:text-teal-600"
          >
            Register
          </Link>

          <Link
            href="/contact"
            className="text-sm text-gray-700 hover:text-teal-600"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}