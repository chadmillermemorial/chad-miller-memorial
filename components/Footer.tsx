import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="bg-[var(--brand-navy)] text-white">
      <Container>
        <div className="py-16">

          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">

            {/* Brand */}
            <div>
              <Image
                src="/images/logo/logo.png"
                alt="Sergeant Major Chad Miller Memorial Golf Tournament"
                width={110}
                height={110}
                className="mb-6"
              />

              <h2 className="text-2xl font-bold">
                Sergeant Major Chad Miller Memorial Golf Tournament
              </h2>

              <p className="mt-5 max-w-md leading-7 text-slate-300">
                Honoring a life of leadership, service, and community while
                supporting The Honor Foundation Fort Bragg Chapters.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="mb-5 text-lg font-semibold">Explore</h3>

              <ul className="space-y-3 text-slate-300">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/about">About Chad</Link></li>
                <li><Link href="/tournament">Tournament</Link></li>
                <li><Link href="/sponsors">Sponsors</Link></li>
                <li><Link href="/register">Register</Link></li>
              </ul>
            </div>

            {/* Event */}
            <div>
              <h3 className="mb-5 text-lg font-semibold">Event</h3>

              <ul className="space-y-3 text-slate-300">
                <li>Hyland Golf Club</li>
                <li>Southern Pines, NC</li>
                <li>The Honor Foundation</li>
                <li>Fort Bragg Chapters</li>
              </ul>
            </div>

          </div>

          <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} Sergeant Major Chad Miller Memorial
            Golf Tournament. All Rights Reserved.
          </div>

        </div>
      </Container>
    </footer>
  );
}