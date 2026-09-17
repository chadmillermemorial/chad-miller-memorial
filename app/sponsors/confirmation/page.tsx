"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SponsorSession = {
  sponsorshipName: string;
  includedPlayerCount: number;
  email: string;
};

export default function SponsorConfirmationPage() {
  const [session, setSession] = useState<SponsorSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");

    if (!sessionId) {
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        const response = await fetch(
          `/api/sponsor-session?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        if (result.ok) {
          setSession({
            sponsorshipName: String(result.sponsorshipName || ""),
            includedPlayerCount: Number(result.includedPlayerCount || 0),
            email: String(result.email || ""),
          });
        }
      } catch (error) {
        console.error("Unable to load sponsor confirmation details:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadSession();
  }, []);

  const includesFoursome = session?.includedPlayerCount === 4;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm md:p-16">
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.35em] text-teal-600">
          Sponsorship Complete
        </p>

        <h1 className="mb-8 text-4xl font-bold text-slate-900 md:text-6xl">
          Thank you for your support.
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-slate-600">
          Your sponsorship payment for the Command Sergeant Major Chad Miller Memorial
          Golf Tournament has been successfully received.
        </p>

        {includesFoursome ? (
          <div className="mb-10 rounded-2xl bg-teal-50 p-6 text-left">
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              Complete your sponsor details and enter your foursome.
            </h2>

            <p className="mb-4 leading-7 text-slate-700">
              Your {session?.sponsorshipName || "Grey or Blue sponsor"} package includes
              four tournament spots. Those four spots are reserved, but the golfers are
              not fully registered until you submit their player information.
            </p>

            <p className="mb-4 leading-7 text-slate-700">
              We sent a secure sponsor-fulfillment email
              {session?.email ? ` to ${session.email}` : " to your sponsor contact email"}.
              Open the secure link in that email to enter each golfer&apos;s name, contact
              information, handicap/GHIN if available, tee selection, and shirt size.
            </p>

            <p className="font-semibold leading-7 text-slate-900">
              Please complete that step even if you need to return later to update your
              foursome.
            </p>
          </div>
        ) : (
          <div className="mb-10 rounded-2xl bg-teal-50 p-6 text-left">
            <h2 className="mb-2 text-xl font-bold text-slate-900">
              Sponsorship confirmed.
            </h2>

            <p className="leading-7 text-slate-600">
              Tournament organizers will follow up regarding your logo and any
              sponsorship materials needed for the event.
            </p>
          </div>
        )}

        {loading && (
          <p className="mb-8 text-sm text-slate-500">
            Confirming sponsorship details…
          </p>
        )}

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
