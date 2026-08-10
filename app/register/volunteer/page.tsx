"use client";

import Image from "next/image";
import Container from "@/components/ui/Container";

const shirtSizes = ["S", "M", "L", "XL", "2XL", "3XL"];

const assignments = [
  "Sign-In / Silent Auction",
  "On-Course Hole Support",
  "General Event Support",
];

export default function VolunteerRegistrationPage() {
  return (
    <>
      <section className="bg-[var(--brand-navy)] py-20 text-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <Image
              src="/images/logo/logo.png"
              alt="SGM Chad Miller Memorial logo"
              width={260}
              height={260}
              className="mx-auto w-full max-w-[220px]"
            />

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                Volunteer
              </p>

              <h1 className="mt-5 text-5xl font-bold md:text-6xl">
                Join the Tournament Team
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Help us honor Sergeant Major Chad Miller and support a great
                tournament experience for players, sponsors, and guests.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <form
            action="/api/volunteer-registration"
            method="POST"
            className="mx-auto max-w-4xl"
          >
            <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                Volunteer Information
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                Tell us about yourself
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="font-semibold">First Name *</span>

                  <input
                    required
                    name="firstName"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">Last Name *</span>

                  <input
                    required
                    name="lastName"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">Email *</span>

                  <input
                    required
                    name="email"
                    type="email"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">Phone *</span>

                  <input
                    required
                    name="phone"
                    type="tel"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">
                    Men&apos;s Unisex T-Shirt Size *
                  </span>

                  <select
                    required
                    name="shirtSize"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Select size</option>

                    {shirtSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="font-semibold">
                    Preferred Assignment *
                  </span>

                  <select
                    required
                    name="assignment"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Select assignment</option>

                    {assignments.map((assignment) => (
                      <option key={assignment} value={assignment}>
                        {assignment}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-8 block">
                <span className="font-semibold">Notes</span>

                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Availability, limitations, special skills, or anything else we should know."
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
            </div>

            <div className="mt-8 rounded-3xl bg-[var(--brand-sky)] p-8">
              <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                Tournament Day
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Volunteers should plan to arrive by <strong>6:00 AM</strong> on
                Friday, October 9, 2026. Final assignments and additional
                instructions will be sent before tournament day.
              </p>
            </div>

            <div className="mt-10 rounded-3xl bg-[var(--brand-navy)] p-8 text-white md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">
                    Volunteer Registration
                  </p>

                  <h2 className="mt-3 text-3xl font-bold">
                    Thank you for helping.
                  </h2>

                  <p className="mt-4 max-w-xl leading-7 text-slate-300">
                    Submit your information and we&apos;ll send you a
                    confirmation by email.
                  </p>
                </div>

                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white transition hover:opacity-90"
                >
                  Register to Volunteer
                </button>
              </div>
            </div>
          </form>
        </Container>
      </section>
    </>
  );
}