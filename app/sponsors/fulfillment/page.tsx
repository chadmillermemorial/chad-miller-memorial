"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Container from "@/components/ui/Container";

type SponsorLevel =
  | "hole"
  | "grey"
  | "blue"
  | "other";

type SponsorRecord = {
  sponsorId: string;
  sponsorshipLevel: string;
  normalizedLevel: SponsorLevel;
  amount: number;
  company: string;
  publicDisplayName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  tagline: string;
  materialsDue: string;
  materialsStatus: string;
  hasPrimaryLogo?: boolean;
  hasAlternateLogo?: boolean;
  bluePreferences: string[];
  representativeName: string;
  representativeTitle: string;
};

type FilePayload = {
  name: string;
  type: string;
  size: number;
  data: string;
};

const BLUE_FEATURE_OPTIONS = [
  "Breakfast",
  "Lunch",
  "Driving Range",
  "Putting Green",
  "Longest Drive",
  "Closest to the Pin",
  "Hole-in-One Contest",
  "Silent Auction",
  "Tribute / Awards Program",
  "No Preference — place us where it best supports the tournament",
];

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function validateLogoFile(
  file: File | null
) {
  if (!file) {
    return "";
  }

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    extension !== "svg" &&
    extension !== "png"
  ) {
    return "Logo files must be SVG or PNG.";
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    return "Logo files must be 5 MB or smaller.";
  }

  return "";
}

function fileToPayload(
  file: File
): Promise<FilePayload> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        const result =
          String(
            reader.result || ""
          );

        const commaIndex =
          result.indexOf(",");

        if (
          commaIndex < 0
        ) {
          reject(
            new Error(
              "Unable to read uploaded file."
            )
          );

          return;
        }

        resolve({
          name:
            file.name,

          type:
            file.type,

          size:
            file.size,

          data:
            result.substring(
              commaIndex + 1
            ),
        });
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to read uploaded file."
          )
        );
      };

      reader.readAsDataURL(
        file
      );
    }
  );
}

export default function SponsorFulfillmentPage() {
  const [
    sponsorId,
    setSponsorId,
  ] = useState("");

  const [
    token,
    setToken,
  ] = useState("");

  const [
    sponsor,
    setSponsor,
  ] =
    useState<SponsorRecord | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    publicDisplayName,
    setPublicDisplayName,
  ] = useState("");

  const [
    website,
    setWebsite,
  ] = useState("");

  const [
    tagline,
    setTagline,
  ] = useState("");

  const [
    contactName,
    setContactName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    representativeName,
    setRepresentativeName,
  ] = useState("");

  const [
    representativeTitle,
    setRepresentativeTitle,
  ] = useState("");

  const [
    bluePreference1,
    setBluePreference1,
  ] = useState("");

  const [
    bluePreference2,
    setBluePreference2,
  ] = useState("");

  const [
    bluePreference3,
    setBluePreference3,
  ] = useState("");

  const [
    additionalNotes,
    setAdditionalNotes,
  ] = useState("");

  const [
    primaryLogo,
    setPrimaryLogo,
  ] =
    useState<File | null>(
      null
    );

  const [
    alternateLogo,
    setAlternateLogo,
  ] =
    useState<File | null>(
      null
    );

  const [
    primaryLogoError,
    setPrimaryLogoError,
  ] = useState("");

  const [
    alternateLogoError,
    setAlternateLogoError,
  ] = useState("");

  const [
    informationConfirmed,
    setInformationConfirmed,
  ] = useState(false);

  const [
    usageAuthorized,
    setUsageAuthorized,
  ] = useState(false);

  useEffect(() => {
    async function loadSponsor() {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const sponsorIdParam =
          String(
            params.get(
              "sponsorId"
            ) || ""
          ).trim();

        const tokenParam =
          String(
            params.get(
              "token"
            ) || ""
          ).trim();

        if (
          !sponsorIdParam ||
          !tokenParam
        ) {
          setLoadError(
            "This sponsor fulfillment link is incomplete or invalid."
          );

          setLoading(
            false
          );

          return;
        }

        setSponsorId(
          sponsorIdParam
        );

        setToken(
          tokenParam
        );

        const response =
          await fetch(
            "/api/sponsor-fulfillment",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    action:
                      "getSponsorFulfillment",

                    sponsorId:
                      sponsorIdParam,

                    token:
                      tokenParam,
                  }
                ),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.ok ||
          !result.sponsor
        ) {
          throw new Error(
            result.error ||
              "Unable to load sponsor information."
          );
        }

        const record =
          result.sponsor as SponsorRecord;

        setSponsor(
          record
        );

        setPublicDisplayName(
          record.publicDisplayName ||
            record.company ||
            ""
        );

        setWebsite(
          record.website ||
            ""
        );

        setTagline(
          record.tagline ||
            ""
        );

        setContactName(
          record.contactName ||
            ""
        );

        setEmail(
          record.email ||
            ""
        );

        setPhone(
          record.phone ||
            ""
        );

        setRepresentativeName(
          record.representativeName ||
            ""
        );

        setRepresentativeTitle(
          record.representativeTitle ||
            ""
        );

        setBluePreference1(
          record
            .bluePreferences?.[0] ||
            ""
        );

        setBluePreference2(
          record
            .bluePreferences?.[1] ||
            ""
        );

        setBluePreference3(
          record
            .bluePreferences?.[2] ||
            ""
        );
      } catch (error) {
        console.error(
          "Sponsor fulfillment load error:",
          error
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load sponsor information."
        );
      } finally {
        setLoading(
          false
        );
      }
    }

    loadSponsor();
  }, []);

  const level =
    sponsor?.normalizedLevel ||
    "other";

  const isHole =
    level === "hole";

  const isGrey =
    level === "grey";

  const isBlue =
    level === "blue";

  const showTagline =
    isGrey ||
    isBlue;

  const materialsAlreadySubmitted =
    useMemo(() => {
      const status =
        String(
          sponsor?.materialsStatus ||
            ""
        )
          .trim()
          .toLowerCase();

      return (
        status ===
        "submitted"
      );
    }, [
      sponsor?.materialsStatus,
    ]);

  const requiresPrimaryLogo =
    useMemo(() => {
      return !Boolean(
        sponsor?.hasPrimaryLogo
      );
    }, [
      sponsor?.hasPrimaryLogo,
    ]);

  function handlePrimaryLogo(
    file: File | null
  ) {
    const error =
      validateLogoFile(
        file
      );

    setPrimaryLogoError(
      error
    );

    if (error) {
      setPrimaryLogo(
        null
      );

      return;
    }

    setPrimaryLogo(
      file
    );
  }

  function handleAlternateLogo(
    file: File | null
  ) {
    const error =
      validateLogoFile(
        file
      );

    setAlternateLogoError(
      error
    );

    if (error) {
      setAlternateLogo(
        null
      );

      return;
    }

    setAlternateLogo(
      file
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitError("");

    if (
      !sponsor ||
      !sponsorId ||
      !token
    ) {
      setSubmitError(
        "Unable to verify this sponsorship."
      );

      return;
    }

    if (
      requiresPrimaryLogo &&
      !primaryLogo
    ) {
      setPrimaryLogoError(
        "Please upload your primary logo."
      );

      return;
    }

    const primaryError =
      validateLogoFile(
        primaryLogo
      );

    const alternateError =
      validateLogoFile(
        alternateLogo
      );

    if (
      primaryError ||
      alternateError
    ) {
      setPrimaryLogoError(
        primaryError
      );

      setAlternateLogoError(
        alternateError
      );

      return;
    }

    if (
      !informationConfirmed ||
      !usageAuthorized
    ) {
      setSubmitError(
        "Please complete both approval confirmations before submitting."
      );

      return;
    }

    if (isBlue) {
      const preferences = [
        bluePreference1,
        bluePreference2,
        bluePreference3,
      ].filter(Boolean);

      const uniquePreferences =
        new Set(
          preferences
        );

      if (
        uniquePreferences.size !==
        preferences.length
      ) {
        setSubmitError(
          "Please select different choices for each Blue Sponsor preference."
        );

        return;
      }
    }

    setSubmitting(
      true
    );

    try {
      const primaryLogoPayload =
        primaryLogo
          ? await fileToPayload(
              primaryLogo
            )
          : null;

      const alternateLogoPayload =
        alternateLogo
          ? await fileToPayload(
              alternateLogo
            )
          : null;

      const response =
        await fetch(
          "/api/sponsor-fulfillment",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  action:
                    "saveSponsorFulfillment",

                  sponsorId,

                  token,

                  publicDisplayName:
                    publicDisplayName.trim(),

                  website:
                    website.trim(),

                  tagline:
                    showTagline
                      ? tagline.trim()
                      : "",

                  contactName:
                    contactName.trim(),

                  email:
                    email.trim(),

                  phone:
                    phone.trim(),

                  bluePreference1:
                    isBlue
                      ? bluePreference1
                      : "",

                  bluePreference2:
                    isBlue
                      ? bluePreference2
                      : "",

                  bluePreference3:
                    isBlue
                      ? bluePreference3
                      : "",

                  representativeName:
                    isBlue
                      ? representativeName.trim()
                      : "",

                  representativeTitle:
                    isBlue
                      ? representativeTitle.trim()
                      : "",

                  additionalNotes:
                    isBlue
                      ? additionalNotes.trim()
                      : "",

                  primaryLogo:
                    primaryLogoPayload,

                  alternateLogo:
                    alternateLogoPayload,

                  informationConfirmed:
                    true,

                  usageAuthorized:
                    true,
                }
              ),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to submit sponsor materials."
        );
      }

      setSubmitted(
        true
      );

      window.scrollTo({
        top:
          0,

        behavior:
          "smooth",
      });
    } catch (error) {
      console.error(
        "Sponsor fulfillment submission error:",
        error
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit sponsor materials."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  if (loading) {
    return (
      <section className="min-h-[650px] bg-slate-50 py-24">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-lg">
            <p className="text-lg text-slate-600">
              Loading your
              sponsorship
              information…
            </p>
          </div>
        </Container>
      </section>
    );
  }

  if (
    loadError ||
    !sponsor
  ) {
    return (
      <section className="min-h-[650px] bg-slate-50 py-24">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
              Sponsor
              Fulfillment
            </p>

            <h1 className="mt-4 text-4xl font-bold text-[var(--brand-navy)]">
              We couldn’t
              verify this
              sponsor link.
            </h1>

            <p className="mt-6 leading-8 text-slate-600">
              {loadError ||
                "This private sponsor fulfillment link is invalid or unavailable."}
            </p>

            <p className="mt-6 text-sm text-slate-500">
              Please contact
              chadmillermemorial@gmail.com
              if you need
              assistance.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="min-h-[650px] bg-slate-50 py-24">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-lg md:p-14">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">
              Materials
              Received
            </p>

            <h1 className="mt-4 text-4xl font-bold text-[var(--brand-navy)] md:text-5xl">
              Thank you.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Your sponsor
              materials have
              been received.
              Our tournament
              team will review
              your submission
              before it is used
              publicly.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              You may return
              to your private
              sponsor link if
              you need to
              update your
              information
              before final
              production.
            </p>

            <p className="mt-4 leading-7 text-slate-600">
              We’ll contact
              you if we need
              clarification
              or a different
              logo file.
            </p>

            {isBlue && (
              <p className="mt-4 leading-7 text-slate-600">
                We’ll also
                review your
                special-event
                and
                activity-area
                preferences
                and make every
                effort to
                accommodate
                your highest
                available
                choice.
              </p>
            )}

            <p className="mt-8 font-semibold text-[var(--brand-navy)]">
              Thank you for
              supporting the
              SGM Chad Miller
              Memorial Golf
              Tournament.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <>
      <section className="bg-[var(--brand-navy)] py-20 text-white">
        <Container>
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
              Sponsor
              Fulfillment
            </p>

            <h1 className="mt-5 text-5xl font-bold md:text-6xl">
              Thank you for
              supporting the
              SGM Chad Miller
              Memorial.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Your sponsorship
              helps us honor
              Chad’s legacy,
              support The Honor
              Foundation, and
              recognize members
              of the U.S.
              Special
              Operations
              community.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <form
            onSubmit={
              handleSubmit
            }
            className="mx-auto max-w-5xl space-y-8"
          >
            <div className="rounded-3xl border border-[var(--brand-teal)]/30 bg-[var(--brand-sky)] p-8 shadow-sm md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Materials
                Deadline
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                {sponsor.materialsDue ||
                  "September 11, 2026"}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Please submit
                your sponsor
                materials by
                this date to
                guarantee
                inclusion in
                printed
                tournament
                signage and
                scheduled
                recognition.
              </p>
            </div>

            {materialsAlreadySubmitted && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Materials
                  Already
                  Submitted
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Your sponsor
                  materials are
                  already on
                  file.
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  You may use
                  this page to
                  make
                  corrections
                  or update
                  your sponsor
                  information
                  before final
                  production.
                </p>

                <p className="mt-3 font-semibold leading-7 text-[var(--brand-navy)]">
                  Your existing
                  primary logo
                  remains on
                  file. You do
                  not need to
                  upload it
                  again unless
                  you want to
                  replace it
                  with a
                  different
                  version.
                </p>
              </div>
            )}

            <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Your
                Sponsorship
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                {
                  sponsor.sponsorshipLevel
                }
              </h2>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Company /
                    Organization
                  </p>

                  <p className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
                    {
                      sponsor.company
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Sponsorship
                    Amount
                  </p>

                  <p className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
                    {formatCurrency(
                      sponsor.amount
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Primary
                    Contact
                  </p>

                  <p className="mt-1 text-lg text-[var(--brand-navy)]">
                    {
                      sponsor.contactName
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Materials
                    Status
                  </p>

                  <p className="mt-1 text-lg text-[var(--brand-navy)]">
                    {sponsor.materialsStatus ||
                      "Requested"}
                  </p>
                </div>
              </div>
            </div>

            {(isHole ||
              isGrey) && (
              <div className="rounded-3xl bg-[var(--sand)] p-8 shadow-sm md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--golf-green)]">
                  Memorial Hole
                  Recognition
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Help us honor
                  a fallen U.S.
                  Special
                  Operations
                  service
                  member.
                </h2>

                <p className="mt-5 leading-8 text-slate-600">
                  Your
                  sponsorship
                  supports a
                  dedicated
                  Memorial Hole
                  Sign honoring
                  a fallen
                  service
                  member from
                  the U.S.
                  Special
                  Operations
                  community.
                  You are
                  sponsoring
                  the memorial
                  recognition
                  displayed on
                  the hole —
                  not naming or
                  purchasing
                  the golf hole
                  itself.
                </p>

                <p className="mt-4 leading-8 text-slate-600">
                  The
                  tournament
                  team will
                  select and
                  prepare the
                  memorial
                  information,
                  including the
                  fallen
                  service
                  member’s
                  photograph,
                  name, rank,
                  service
                  information,
                  and memorial
                  details.
                </p>

                <p className="mt-4 font-semibold leading-7 text-[var(--brand-navy)]">
                  The fallen
                  service
                  member will
                  remain the
                  primary focus
                  of the sign,
                  with your
                  sponsor
                  recognition
                  presented
                  respectfully
                  alongside the
                  memorial.
                </p>
              </div>
            )}

            {isBlue && (
              <div className="rounded-3xl bg-[var(--brand-sky)] p-8 shadow-sm md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                  Blue Sponsor
                  Recognition
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Special
                  events,
                  contests, and
                  activity
                  areas come
                  first.
                </h2>

                <p className="mt-5 leading-8 text-slate-600">
                  Blue Sponsors
                  are given
                  priority for
                  recognition
                  at major
                  tournament
                  events,
                  contests, and
                  specialty
                  activity
                  areas.
                  Examples
                  include the
                  Driving
                  Range,
                  Putting
                  Green,
                  Longest
                  Drive,
                  Closest-to-the-Pin,
                  Hole-in-One
                  Contest,
                  Breakfast,
                  Lunch, Silent
                  Auction, and
                  Tribute /
                  Awards
                  Program.
                </p>

                <p className="mt-4 leading-8 text-slate-600">
                  If those
                  opportunities
                  are fully
                  assigned, or
                  if additional
                  Memorial Hole
                  Sponsors are
                  needed, the
                  tournament
                  team may
                  assign a Blue
                  Sponsor to
                  Memorial Hole
                  recognition
                  while
                  maintaining
                  recognition
                  appropriate
                  to the Blue
                  Sponsorship
                  level.
                </p>
              </div>
            )}

            <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Sponsor
                Information
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                How should we
                represent your
                organization?
              </h2>

              <div className="mt-8 grid gap-6">
                <label className="block">
                  <span className="font-semibold text-[var(--brand-navy)]">
                    Public-Facing
                    Organization
                    Name *
                  </span>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Enter the
                    exact name
                    you would
                    like
                    displayed
                    on
                    tournament
                    signage and
                    the Sponsor
                    Recognition
                    page.
                  </p>

                  <input
                    required
                    value={
                      publicDisplayName
                    }
                    onChange={(
                      event
                    ) =>
                      setPublicDisplayName(
                        event
                          .target
                          .value
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold text-[var(--brand-navy)]">
                    Website URL
                    *
                  </span>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    This is
                    where
                    visitors
                    will be
                    directed
                    when they
                    select your
                    organization
                    on our
                    Sponsor
                    Recognition
                    page.
                  </p>

                  <input
                    required
                    type="url"
                    value={
                      website
                    }
                    onChange={(
                      event
                    ) =>
                      setWebsite(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="https://"
                    className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                {showTagline && (
                  <label className="block">
                    <span className="font-semibold text-[var(--brand-navy)]">
                      Short
                      Tagline or
                      Description
                      — Optional
                    </span>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Maximum
                      150
                      characters.
                      We may use
                      this on
                      the
                      Sponsor
                      Recognition
                      page or in
                      selected
                      tournament
                      communications
                      where
                      space
                      permits.
                    </p>

                    <textarea
                      value={
                        tagline
                      }
                      maxLength={
                        150
                      }
                      rows={3}
                      onChange={(
                        event
                      ) =>
                        setTagline(
                          event
                            .target
                            .value
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {
                        tagline.length
                      }
                      /150
                    </p>
                  </label>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Logo &
                Artwork
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                Send us your
                best-quality
                logo.
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Accepted file
                types:
                <strong>
                  {" "}
                  SVG or PNG
                  only.
                </strong>{" "}
                SVG is
                preferred.
                For PNG files,
                please
                provide a
                high-resolution
                image with a
                transparent
                background
                whenever
                possible.
              </p>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <label className="block rounded-2xl border border-slate-200 p-6">
                  <span className="font-semibold text-[var(--brand-navy)]">
                    {requiresPrimaryLogo
                      ? "Primary Logo *"
                      : "Primary Logo — Optional Replacement"}
                  </span>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {requiresPrimaryLogo
                      ? "This will be the primary logo used for your tournament recognition."
                      : "Your primary logo is already on file. Leave this blank to keep the existing logo, or upload a new SVG or PNG to replace it."}
                  </p>

                  <input
                    type="file"
                    required={
                      requiresPrimaryLogo
                    }
                    accept=".svg,.png,image/svg+xml,image/png"
                    onChange={(
                      event
                    ) =>
                      handlePrimaryLogo(
                        event
                          .target
                          .files?.[0] ||
                          null
                      )
                    }
                    className="mt-4 block w-full text-sm"
                  />

                  {primaryLogo && (
                    <p className="mt-3 text-sm font-medium text-[var(--brand-blue)]">
                      {
                        primaryLogo.name
                      }
                    </p>
                  )}

                  {primaryLogoError && (
                    <p className="mt-3 text-sm font-semibold text-red-600">
                      {
                        primaryLogoError
                      }
                    </p>
                  )}
                </label>

                <label className="block rounded-2xl border border-slate-200 p-6">
                  <span className="font-semibold text-[var(--brand-navy)]">
                    Alternate
                    Logo —
                    Optional
                  </span>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {sponsor.hasAlternateLogo
                      ? "An alternate logo is already on file. Leave this blank to keep it, or upload a new version to replace it."
                      : "If available, provide an alternate version suitable for a different light or dark background."}
                  </p>

                  <input
                    type="file"
                    accept=".svg,.png,image/svg+xml,image/png"
                    onChange={(
                      event
                    ) =>
                      handleAlternateLogo(
                        event
                          .target
                          .files?.[0] ||
                          null
                      )
                    }
                    className="mt-4 block w-full text-sm"
                  />

                  {alternateLogo && (
                    <p className="mt-3 text-sm font-medium text-[var(--brand-blue)]">
                      {
                        alternateLogo.name
                      }
                    </p>
                  )}

                  {alternateLogoError && (
                    <p className="mt-3 text-sm font-semibold text-red-600">
                      {
                        alternateLogoError
                      }
                    </p>
                  )}
                </label>
              </div>

              <p className="mt-6 text-sm text-slate-500">
                Maximum file
                size: 5 MB per
                logo.
              </p>
            </div>

            {isBlue && (
              <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                  Blue Sponsor
                  Special Event
                  & Area
                  Preferences
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Tell us what
                  interests
                  your
                  organization
                  most.
                </h2>

                <p className="mt-5 leading-8 text-slate-600">
                  Please rank
                  up to three
                  preferred
                  special-event,
                  contest, or
                  activity-area
                  sponsorships.
                  We will make
                  every effort
                  to
                  accommodate
                  your highest
                  available
                  preference
                  based on
                  availability
                  and the order
                  completed
                  sponsor
                  materials are
                  received.
                </p>

                <p className="mt-4 font-semibold leading-7 text-[var(--brand-navy)]">
                  Specific
                  assignments
                  and
                  exclusivity
                  are not
                  guaranteed.
                  Some major
                  areas,
                  including
                  Breakfast and
                  Lunch, may
                  recognize
                  multiple Blue
                  Sponsors.
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  <label className="block">
                    <span className="font-semibold">
                      First
                      Preference
                    </span>

                    <select
                      value={
                        bluePreference1
                      }
                      onChange={(
                        event
                      ) =>
                        setBluePreference1(
                          event
                            .target
                            .value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="">
                        Select
                      </option>

                      {BLUE_FEATURE_OPTIONS.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option
                            }
                            value={
                              option
                            }
                          >
                            {
                              option
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="font-semibold">
                      Second
                      Preference
                    </span>

                    <select
                      value={
                        bluePreference2
                      }
                      onChange={(
                        event
                      ) =>
                        setBluePreference2(
                          event
                            .target
                            .value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="">
                        Select
                      </option>

                      {BLUE_FEATURE_OPTIONS.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option
                            }
                            value={
                              option
                            }
                          >
                            {
                              option
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="font-semibold">
                      Third
                      Preference
                    </span>

                    <select
                      value={
                        bluePreference3
                      }
                      onChange={(
                        event
                      ) =>
                        setBluePreference3(
                          event
                            .target
                            .value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="">
                        Select
                      </option>

                      {BLUE_FEATURE_OPTIONS.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option
                            }
                            value={
                              option
                            }
                          >
                            {
                              option
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>
              </div>
            )}

            {isBlue && (
              <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                  Tribute &
                  Awards
                  Recognition
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Representative
                  information —
                  optional.
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  If there is
                  a
                  representative
                  from your
                  organization
                  you would
                  specifically
                  like
                  recognized
                  during the
                  tribute and
                  awards
                  program,
                  provide their
                  information
                  below.
                  Leaving this
                  blank will not
                  affect your
                  Blue Sponsor
                  recognition.
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <label className="block">
                    <span className="font-semibold">
                      Representative
                      Name
                    </span>

                    <input
                      value={
                        representativeName
                      }
                      onChange={(
                        event
                      ) =>
                        setRepresentativeName(
                          event
                            .target
                            .value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold">
                      Representative
                      Title
                    </span>

                    <input
                      value={
                        representativeTitle
                      }
                      onChange={(
                        event
                      ) =>
                        setRepresentativeTitle(
                          event
                            .target
                            .value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>
                </div>

                <label className="mt-6 block">
                  <span className="font-semibold">
                    Additional
                    Recognition
                    Notes —
                    Optional
                  </span>

                  <p className="mt-1 text-sm text-slate-500">
                    Maximum 500
                    characters.
                  </p>

                  <textarea
                    value={
                      additionalNotes
                    }
                    maxLength={
                      500
                    }
                    rows={4}
                    onChange={(
                      event
                    ) =>
                      setAdditionalNotes(
                        event
                          .target
                          .value
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {
                      additionalNotes.length
                    }
                    /500
                  </p>
                </label>
              </div>
            )}

            <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Primary
                Contact
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                Who should we
                contact if we
                have a
                question?
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="font-semibold">
                    Contact Name
                    *
                  </span>

                  <input
                    required
                    value={
                      contactName
                    }
                    onChange={(
                      event
                    ) =>
                      setContactName(
                        event
                          .target
                          .value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">
                    Email *
                  </span>

                  <input
                    required
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event
                          .target
                          .value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="font-semibold">
                    Phone *
                  </span>

                  <input
                    required
                    type="tel"
                    value={
                      phone
                    }
                    onChange={(
                      event
                    ) =>
                      setPhone(
                        event
                          .target
                          .value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 md:max-w-md"
                  />
                </label>
              </div>

              <p className="mt-6 text-sm leading-6 text-slate-500">
                We will use
                this contact
                if we have
                questions
                about
                artwork,
                signage,
                sponsor
                recognition,
                or Blue
                Sponsor
                feature
                assignments
                where
                applicable.
              </p>
            </div>

            <div className="rounded-3xl bg-[var(--brand-navy)] p-8 text-white shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-teal)]">
                Final
                Approval
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Confirm your
                sponsor
                materials.
              </h2>

              <div className="mt-8 space-y-5">
                <label className="flex gap-4">
                  <input
                    required
                    type="checkbox"
                    checked={
                      informationConfirmed
                    }
                    onChange={(
                      event
                    ) =>
                      setInformationConfirmed(
                        event
                          .target
                          .checked
                      )
                    }
                    className="mt-1 h-5 w-5 shrink-0"
                  />

                  <span className="leading-7 text-slate-200">
                    I confirm
                    that the
                    organization
                    name,
                    website,
                    contact
                    information,
                    and any
                    recognition
                    preferences
                    submitted
                    above are
                    correct.
                  </span>
                </label>

                <label className="flex gap-4">
                  <input
                    required
                    type="checkbox"
                    checked={
                      usageAuthorized
                    }
                    onChange={(
                      event
                    ) =>
                      setUsageAuthorized(
                        event
                          .target
                          .checked
                      )
                    }
                    className="mt-1 h-5 w-5 shrink-0"
                  />

                  <span className="leading-7 text-slate-200">
                    I authorize
                    the SGM Chad
                    Miller
                    Memorial
                    Golf
                    Tournament
                    to use the
                    submitted
                    company
                    name, logo,
                    artwork,
                    and
                    provided
                    information
                    for
                    tournament
                    signage,
                    website
                    recognition,
                    communications,
                    and other
                    materials
                    associated
                    with the
                    event.
                  </span>
                </label>
              </div>

              {submitError && (
                <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {
                    submitError
                  }
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="mt-8 rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? materialsAlreadySubmitted
                    ? "Updating Sponsor Materials…"
                    : "Submitting Sponsor Materials…"
                  : materialsAlreadySubmitted
                    ? "Update Sponsor Materials"
                    : "Submit Sponsor Materials"}
              </button>

              <p className="mt-5 text-sm leading-6 text-slate-400">
                Your
                submission
                will be
                reviewed by
                the
                tournament
                team before
                any materials
                are published
                or sent to
                production.
              </p>
            </div>
          </form>
        </Container>
      </section>
    </>
  );
}