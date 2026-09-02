"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import Container from "@/components/ui/Container";
import {
  CONTRIBUTION_TYPES,
  INTENDED_USES,
  parseInKindMetadata,
  validateInKindFiles,
} from "@/lib/in-kind-donations";

const OTHER = "Other — Write In";

async function readApiResponse(response: Response) {
  const result = await response.json();

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error || "We could not complete your contribution submission."
    );
  }

  return result;
}

export default function InKindDonationPage() {
  const [contributionType, setContributionType] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [publicRecognition, setPublicRecognition] = useState("No");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const files = formData
        .getAll("files")
        .filter(
          (value): value is File => value instanceof File && value.size > 0
        );

      validateInKindFiles(files);

      const metadataEntries = Array.from(formData.entries()).filter(
        ([key]) => key !== "files"
      );
      const metadata = parseInKindMetadata(
        Object.fromEntries(metadataEntries)
      );

      const createResponse = await fetch("/api/in-kind-donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phase: "create",
          metadata,
        }),
      });
      const createResult = await readApiResponse(createResponse);
      const submissionId = String(createResult.submissionId || "");

      let attachmentIssue = false;

      for (const file of files) {
        const uploadFormData = new FormData();
        uploadFormData.append("phase", "upload");
        uploadFormData.append("submissionId", submissionId);
        uploadFormData.append("file", file);

        try {
          const uploadResponse = await fetch("/api/in-kind-donation", {
            method: "POST",
            body: uploadFormData,
          });
          await readApiResponse(uploadResponse);
        } catch (uploadError) {
          console.error("In-kind attachment upload failed:", uploadError);
          attachmentIssue = true;
        }
      }

      const finalizeResponse = await fetch("/api/in-kind-donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phase: "finalize",
          submissionId,
          attachmentIssue,
        }),
      });
      const finalizeResult = await readApiResponse(finalizeResponse);

      window.location.assign(finalizeResult.confirmationUrl);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not complete your contribution submission. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="bg-[var(--brand-navy)] py-16 text-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <Image
              src="/images/logo/logo.png"
              alt="CSM Chad Miller Memorial logo"
              width={220}
              height={220}
              className="mx-auto w-full max-w-[190px]"
            />

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                In-Kind Donation
              </p>
              <h1 className="mt-5 text-4xl font-bold md:text-5xl">
                Offer an Item, Service, or Other Contribution
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Tell us what you would like to contribute. Every in-kind
                contribution is submitted for review and is not considered
                accepted until the tournament team follows up with you.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-16">
        <Container>
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-4xl space-y-8"
          >
            <div className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Donor Information
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="font-semibold">Donor / Business *</span>
                  <input
                    required
                    name="donorBusiness"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">Contact Name *</span>
                  <input
                    required
                    name="contactName"
                    type="text"
                    autoComplete="name"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">Email *</span>
                  <input
                    required
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">Phone *</span>
                  <input
                    required
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Contribution Details
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="font-semibold">Contribution Type *</span>
                  <select
                    required
                    name="contributionType"
                    value={contributionType}
                    onChange={(event) => setContributionType(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  >
                    <option value="">Select a type</option>
                    {CONTRIBUTION_TYPES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="font-semibold">Intended Use *</span>
                  <select
                    required
                    name="intendedUse"
                    value={intendedUse}
                    onChange={(event) => setIntendedUse(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  >
                    <option value="">Select an intended use</option>
                    {INTENDED_USES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                {contributionType === OTHER && (
                  <label className="block md:col-span-2">
                    <span className="font-semibold">
                      Contribution Type Write-In *
                    </span>
                    <input
                      required
                      name="contributionTypeWriteIn"
                      type="text"
                      placeholder="Describe the type of contribution"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>
                )}

                {intendedUse === OTHER && (
                  <label className="block md:col-span-2">
                    <span className="font-semibold">
                      Intended Use Write-In *
                    </span>
                    <input
                      required
                      name="intendedUseWriteIn"
                      type="text"
                      placeholder="Tell us how you think the contribution could support the tournament"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>
                )}

                <label className="block md:col-span-2">
                  <span className="font-semibold">Item / Service Name *</span>
                  <input
                    required
                    name="itemServiceName"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="font-semibold">Description *</span>
                  <textarea
                    required
                    name="description"
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    placeholder="Describe the item, service, experience, or other contribution."
                  />
                  <span className="mt-2 block text-sm leading-6 text-slate-500">
                    A written description is acceptable. Supporting files are
                    optional and are only needed if they help explain or
                    fulfill the contribution.
                  </span>
                </label>

                <label className="block">
                  <span className="font-semibold">Estimated Retail Value *</span>
                  <div className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-4">
                    <span className="font-semibold text-slate-500">$</span>
                    <input
                      required
                      name="estimatedRetailValue"
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-3 outline-none"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="font-semibold">Quantity *</span>
                  <input
                    required
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue="1"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="font-semibold">
                    Restrictions / Expiration
                  </span>
                  <textarea
                    name="restrictionsExpiration"
                    rows={3}
                    placeholder="Optional — include dates, exclusions, transfer limits, or other restrictions"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="font-semibold">Redemption Instructions</span>
                  <textarea
                    name="redemptionInstructions"
                    rows={3}
                    placeholder="Optional — explain how the winner or tournament team redeems the contribution"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="font-semibold">Website / Social</span>
                  <input
                    name="websiteSocial"
                    type="text"
                    placeholder="Optional"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="font-semibold">Drop-Off / Pickup Plan</span>
                  <textarea
                    name="dropOffPickupPlan"
                    rows={3}
                    placeholder="Optional — tell us whether the item is electronic, will be dropped off, needs pickup, or requires coordination"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Supporting Files
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                Optional. Upload a photo, logo, certificate, redemption
                document, or other supporting material if useful.
              </p>

              <label className="mt-6 block">
                <span className="font-semibold">Attachments</span>
                <input
                  name="files"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                />
                <span className="mt-2 block text-sm leading-6 text-slate-500">
                  Up to 3 files, 4 MB each. PDF, JPG, PNG, DOC, or DOCX.
                </span>
              </label>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Public Recognition
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                Recognition is optional and applies only if the tournament
                ultimately accepts the contribution.
              </p>

              <label className="mt-6 block">
                <span className="font-semibold">
                  Would you like public recognition? *
                </span>
                <select
                  required
                  name="publicRecognition"
                  value={publicRecognition}
                  onChange={(event) => setPublicRecognition(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </label>

              {publicRecognition === "Yes" && (
                <label className="mt-6 block">
                  <span className="font-semibold">Public Recognition Name</span>
                  <input
                    name="publicRecognitionName"
                    type="text"
                    placeholder="Optional — leave blank to use Donor / Business"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>
              )}

              <label className="mt-6 block">
                <span className="font-semibold">Notes</span>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Optional — anything else the tournament team should know"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800"
              >
                {error}
              </div>
            )}

            <div className="rounded-3xl bg-[var(--brand-navy)] p-8 text-white md:p-10">
              <h2 className="text-3xl font-bold">Submit for Review</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Submission does not constitute acceptance. The tournament team
                will review your proposed contribution and follow up regarding
                acceptance, delivery, pickup, redemption, or fulfillment.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="mt-7 rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting Contribution..." : "Submit Contribution for Review"}
              </button>
            </div>
          </form>
        </Container>
      </section>
    </>
  );
}
