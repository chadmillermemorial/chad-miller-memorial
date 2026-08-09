import Link from "next/link";
import Container from "@/components/ui/Container";

export default async function PlayerConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ registrationId?: string }>;
}) {
  const params = await searchParams;
  const registrationId = params.registrationId;

  return (
    <section className="bg-slate-50 py-24 md:py-32">
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-xl md:p-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
            Registration Received
          </p>

          <h1 className="mt-5 text-4xl font-bold text-[var(--brand-navy)] md:text-6xl">
            Your player information has been saved.
          </h1>

          <p className="mt-7 text-lg leading-8 text-slate-600">
            Thank you for registering for the Sergeant Major Chad Miller
            Memorial Golf Tournament.
          </p>

          {registrationId && (
            <div className="mt-8 rounded-2xl bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Registration ID
              </p>

              <p className="mt-2 break-all font-semibold text-[var(--brand-navy)]">
                {registrationId}
              </p>
            </div>
          )}

          <div className="mt-8 rounded-2xl bg-[var(--brand-sky)] p-6 text-left">
            <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
              Payment is still required.
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Your player information has been recorded, but registration is
              not complete until payment is received. We will connect secure
              online payment in the next phase.
            </p>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-[var(--brand-blue)] px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
          >
            Return Home
          </Link>
        </div>
      </Container>
    </section>
  );
}