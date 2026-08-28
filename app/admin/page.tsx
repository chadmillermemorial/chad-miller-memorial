import { headers } from "next/headers";
import Container from "@/components/ui/Container";
import {
  getAdminEnvironment,
  isAdminCookieHeaderAuthenticated,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getAdminAuthenticated(
  cookieHeader: string | null
) {
  try {
    const { sessionSecret } =
      getAdminEnvironment({
        ADMIN_PASSWORD:
          process.env.ADMIN_PASSWORD,
        ADMIN_SESSION_SECRET:
          process.env.ADMIN_SESSION_SECRET,
      });

    return isAdminCookieHeaderAuthenticated(
      cookieHeader,
      sessionSecret
    );
  } catch {
    return false;
  }
}

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const params = await searchParams;
  const requestHeaders = await headers();

  const authenticated =
    getAdminAuthenticated(
      requestHeaders.get("cookie")
    );

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-50 py-20">
        <Container>
          <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 shadow-lg md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
              Tournament Administration
            </p>

            <h1 className="mt-4 text-4xl font-bold text-[var(--brand-navy)]">
              Admin Sign In
            </h1>

            <p className="mt-4 leading-7 text-slate-600">
              Enter the private tournament administrator password to manage refunds and tournament records.
            </p>

            {params.error === "invalid" && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                The password was not accepted.
              </div>
            )}

            {params.error === "config" && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                Admin access is not configured yet.
              </div>
            )}

            <form
              action="/api/admin/login"
              method="POST"
              className="mt-8"
            >
              <label className="block">
                <span className="font-semibold text-slate-800">
                  Admin Password
                </span>

                <input
                  required
                  autoComplete="current-password"
                  name="password"
                  type="password"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--brand-blue)]"
                />
              </label>

              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-[var(--brand-navy)] px-7 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Sign In
              </button>
            </form>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <>
      <section className="bg-[var(--brand-navy)] py-14 text-white">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                Tournament Administration
              </p>

              <h1 className="mt-4 text-4xl font-bold md:text-5xl">
                Refund Management
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Manage player, sponsor, and donation refunds from one private dashboard.
              </p>
            </div>

            <form
              action="/api/admin/logout"
              method="POST"
            >
              <button
                type="submit"
                className="rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Sign Out
              </button>
            </form>
          </div>
        </Container>
      </section>

      <main className="bg-slate-50 py-16">
        <Container>
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                [
                  "Players",
                  "Find player registrations and issue organizer-authorized refunds, including after the public deadline.",
                ],
                [
                  "Sponsors",
                  "Refund paid sponsorships and remove their active tournament recognition and included capacity.",
                ],
                [
                  "Donations",
                  "Refund paid donations and remove refunded donors from public recognition eligibility.",
                ],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-3xl bg-white p-7 shadow-sm"
                >
                  <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                    {title}
                  </h2>

                  <p className="mt-3 leading-7 text-slate-600">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
              Search and refund controls are being added in the next implementation step.
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
