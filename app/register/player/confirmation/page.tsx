import Link from "next/link";

export default function PlayerConfirmationPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm md:p-16">
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.35em] text-teal-600">
          Registration Complete
        </p>

        <h1 className="mb-8 text-4xl font-bold text-slate-900 md:text-6xl">
          You&apos;re registered.
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-slate-600">
          Thank you for registering for the Command Sergeant Major Chad Miller Memorial
          Golf Tournament.
        </p>

        <div className="mb-10 rounded-2xl bg-teal-50 p-6 text-left">
          <h2 className="mb-2 text-xl font-bold text-slate-900">
            Payment received.
          </h2>

          <p className="leading-7 text-slate-600">
            Your payment was successfully processed and your player
            registration has been recorded.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex rounded-full bg-teal-700 px-8 py-4 font-semibold text-white transition hover:bg-teal-800"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}