import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";

export default function WaitlistConfirmationPage() {
  return (
    <>
      <section className="bg-[var(--brand-navy)] py-20 text-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <Image
              src="/images/logo/logo.png"
              alt="CSM Chad Miller Memorial logo"
              width={260}
              height={260}
              className="mx-auto w-full max-w-[220px]"
            />

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                Tournament Waitlist
              </p>

              <h1 className="mt-5 text-5xl font-bold md:text-6xl">
                You&apos;re on the Waitlist
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Your information has been received for the CSM Chad Miller
                Memorial Golf Tournament.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-lg md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-sky)] text-3xl text-[var(--brand-navy)]">
              ✓
            </div>

            <h2 className="mt-6 text-3xl font-bold text-[var(--brand-navy)]">
              Waitlist Request Confirmed
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              We&apos;ve added you to the tournament waitlist. A confirmation
              email has also been sent to the email address you provided.
            </p>

            <div className="mt-8 rounded-2xl bg-[var(--brand-sky)] p-6 text-left">
              <p className="font-semibold text-[var(--brand-navy)]">
                What happens next?
              </p>

              <p className="mt-3 leading-7 text-slate-600">
                If enough space becomes available for the number of golfers you
                requested, we&apos;ll contact you with instructions and a
                limited registration window.
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                Joining the waitlist does not reserve a tournament spot, and no
                payment is required unless registration becomes available.
              </p>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <p className="font-semibold text-[var(--brand-navy)]">
                Friday, October 9, 2026
              </p>

              <p className="mt-1 text-slate-600">
                Hyland Golf Course • Southern Pines, NC
              </p>
            </div>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="rounded-full bg-[var(--brand-navy)] px-7 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Return Home
              </Link>

              <Link
                href="/tournament"
                className="rounded-full border-2 border-[var(--brand-navy)] px-7 py-3 font-semibold text-[var(--brand-navy)] transition hover:bg-slate-100"
              >
                Tournament Details
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}