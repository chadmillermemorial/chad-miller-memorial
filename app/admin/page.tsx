import Link from "next/link";
import { headers } from "next/headers";
import Stripe from "stripe";
import Container from "@/components/ui/Container";
import {
  getAdminEnvironment,
  isAdminCookieHeaderAuthenticated,
} from "@/lib/admin-auth";
import {
  filterAdminCheckoutRecords,
  toAdminCheckoutRecord,
  type AdminRecordFilter,
} from "@/lib/admin-records";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    type?: string;
    q?: string;
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

function getRecordFilter(value: string | undefined) {
  const allowed: AdminRecordFilter[] = [
    "all",
    "player",
    "sponsorship",
    "donation",
  ];

  return allowed.includes(
    value as AdminRecordFilter
  )
    ? (value as AdminRecordFilter)
    : "all";
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(unixSeconds: number) {
  if (!unixSeconds) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(unixSeconds * 1000));
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

  const selectedType =
    getRecordFilter(params.type);

  const query = params.q?.trim() || "";

  let records = [] as ReturnType<
    typeof toAdminCheckoutRecord
  >[];

  let stripeError = "";

  try {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error(
        "Stripe is not configured."
      );
    }

    const stripe =
      new Stripe(stripeSecretKey);

    const sessions =
      await stripe.checkout.sessions
        .list({
          limit: 100,
        })
        .autoPagingToArray({
          limit: 500,
        });

    records = sessions.map(
      toAdminCheckoutRecord
    );
  } catch (error) {
    console.error(
      "Admin Stripe search error:",
      error
    );

    stripeError =
      "Stripe records could not be loaded.";
  }

  const paidRecords = records.filter(
    (record): record is NonNullable<typeof record> =>
      Boolean(record)
  );

  const filteredRecords =
    filterAdminCheckoutRecords(
      paidRecords,
      selectedType,
      query
    );

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
                  "player",
                  "Find player registrations and issue organizer-authorized refunds, including after the public deadline.",
                ],
                [
                  "Sponsors",
                  "sponsorship",
                  "Refund paid sponsorships and remove their active tournament recognition and included capacity.",
                ],
                [
                  "Donations",
                  "donation",
                  "Refund paid donations and remove refunded donors from public recognition eligibility.",
                ],
              ].map(
                ([title, filter, description]) => (
                  <Link
                    key={title}
                    href={`/admin?type=${filter}`}
                    className="rounded-3xl bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                      {title}
                    </h2>

                    <p className="mt-3 leading-7 text-slate-600">
                      {description}
                    </p>
                  </Link>
                )
              )}
            </div>

            <form
              method="GET"
              className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-8"
            >
              <div className="grid gap-5 md:grid-cols-[220px_1fr_auto] md:items-end">
                <label>
                  <span className="block font-semibold text-slate-800">
                    Record Type
                  </span>

                  <select
                    name="type"
                    defaultValue={selectedType}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  >
                    <option value="all">
                      All Records
                    </option>
                    <option value="player">
                      Players
                    </option>
                    <option value="sponsorship">
                      Sponsors
                    </option>
                    <option value="donation">
                      Donations
                    </option>
                  </select>
                </label>

                <label>
                  <span className="block font-semibold text-slate-800">
                    Search
                  </span>

                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Name, email, company, team, or Stripe session ID"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <button
                  type="submit"
                  className="rounded-full bg-[var(--brand-navy)] px-7 py-3 font-semibold text-white"
                >
                  Search
                </button>
              </div>
            </form>

            {stripeError ? (
              <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-7 font-semibold text-red-700">
                {stripeError}
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                    Matching Payments
                  </h2>

                  <p className="text-sm text-slate-500">
                    {filteredRecords.length} record
                    {filteredRecords.length === 1
                      ? ""
                      : "s"}
                  </p>
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="rounded-3xl bg-white p-8 text-slate-600 shadow-sm">
                    No paid Stripe records matched this search.
                  </div>
                ) : (
                  filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-3xl bg-white p-7 shadow-sm"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                              {record.type === "sponsorship"
                                ? "Sponsor"
                                : record.type === "donation"
                                  ? "Donation"
                                  : "Player"}
                            </span>

                            <span className="text-sm text-slate-500">
                              {formatDate(record.created)}
                            </span>
                          </div>

                          <h3 className="mt-3 text-xl font-bold text-[var(--brand-navy)]">
                            {record.title}
                          </h3>

                          {record.subtitle && (
                            <p className="mt-1 text-slate-600">
                              {record.subtitle}
                            </p>
                          )}

                          <p className="mt-2 break-all text-xs text-slate-400">
                            {record.id}
                          </p>
                        </div>

                        <div className="md:text-right">
                          <p className="text-2xl font-bold text-[var(--brand-navy)]">
                            {formatCurrency(
                              record.amountCents
                            )}
                          </p>

                          <Link
                            href={`/admin/refund?session_id=${encodeURIComponent(record.id)}`}
                            className="mt-3 inline-block rounded-full bg-[var(--brand-blue)] px-6 py-3 font-semibold text-white"
                          >
                            Review Refund
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Container>
      </main>
    </>
  );
}
