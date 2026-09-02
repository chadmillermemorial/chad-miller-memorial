import Link from "next/link";
import Container from "@/components/ui/Container";

type ConfirmationPageProps = {
  searchParams: Promise<{
    submissionId?: string;
  }>;
};

export default async function InKindConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = await searchParams;
  const rawSubmissionId = String(params.submissionId || "").trim();
  const submissionId = /^IK-2026-\d{4,}$/.test(rawSubmissionId)
    ? rawSubmissionId
    : "Not available";

  return (
    <section className="bg-slate-50 py-20">
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
            In-Kind Donation
          </p>

          <h1 className="mt-4 text-4xl font-bold text-[var(--brand-navy)] md:text-5xl">
            Contribution Submitted for Review
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Your contribution has been submitted for review. Submission does
            not constitute acceptance. The tournament team will contact you
            after review regarding acceptance and delivery or fulfillment.
          </p>

          <div className="mt-8 rounded-2xl bg-slate-100 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Submission ID
            </p>
            <p className="mt-2 text-2xl font-bold text-[var(--brand-navy)]">
              {submissionId}
            </p>
          </div>

          <p className="mt-6 leading-7 text-slate-600">
            Please keep this submission ID for reference if you need to contact
            the tournament team about your proposed contribution.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/"
              className="rounded-full bg-[var(--brand-navy)] px-6 py-3 font-semibold text-white"
            >
              Return Home
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-[var(--brand-navy)]"
            >
              Contact the Tournament
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
