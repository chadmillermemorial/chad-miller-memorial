"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Container from "@/components/ui/Container";

type SponsorLevel =
  | "hole"
  | "grey"
  | "blue"
  | "other";

type SponsorGolfer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ghin: string;
  handicap: string;
  teeSelection: string;
  shirtSize: string;
};

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

  includedFoursome?: boolean;
  foursomeStatus?: string;
  foursomePlayers?: SponsorGolfer[];
  foursomeEmergencyContactName?: string;
  foursomeEmergencyContactPhone?: string;
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

const SHIRT_SIZES = [
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
];

const MAX_FILE_SIZE =
  3 * 1024 * 1024;

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3";

function emptyGolfer(): SponsorGolfer {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    ghin: "",
    handicap: "",
    teeSelection: "",
    shirtSize: "",
  };
}

function emptyFoursome() {
  return [
    emptyGolfer(),
    emptyGolfer(),
    emptyGolfer(),
    emptyGolfer(),
  ];
}

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

function validatePrimaryLogoFile(
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

  if (extension !== "png") {
    return "The website / digital logo must be a PNG file.";
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    return "Logo files must be 3 MB or smaller.";
  }

  return "";
}

function validateAlternateLogoFile(
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

  if (extension !== "svg") {
    return "The print-quality logo must be an SVG file.";
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    return "Logo files must be 3 MB or smaller.";
  }

  return "";
}

function fileToPayload(
  file: File
): Promise<FilePayload> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
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

  /*
    Sponsor materials
  */

  const [
    submittingMaterials,
    setSubmittingMaterials,
  ] = useState(false);

  const [
    materialsError,
    setMaterialsError,
  ] = useState("");

  const [
    materialsSuccess,
    setMaterialsSuccess,
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

  /*
    Included sponsor foursome
  */

  const [
    foursomePlayers,
    setFoursomePlayers,
  ] =
    useState<SponsorGolfer[]>(
      emptyFoursome()
    );

  const [
    emergencyContactName,
    setEmergencyContactName,
  ] = useState("");

  const [
    emergencyContactPhone,
    setEmergencyContactPhone,
  ] = useState("");

  const [
    rosterConfirmed,
    setRosterConfirmed,
  ] = useState(false);

  const [
    submittingFoursome,
    setSubmittingFoursome,
  ] = useState(false);

  const [
    foursomeError,
    setFoursomeError,
  ] = useState("");

  const [
    foursomeSuccess,
    setFoursomeSuccess,
  ] = useState("");

  const [
    foursomeStatus,
    setFoursomeStatus,
  ] = useState("");

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

        const savedPlayers =
          Array.isArray(
            record.foursomePlayers
          )
            ? record.foursomePlayers
            : [];

        if (
          savedPlayers.length === 4
        ) {
          setFoursomePlayers(
            savedPlayers.map(
              (
                player
              ) => ({
                firstName:
                  player.firstName ||
                  "",

                lastName:
                  player.lastName ||
                  "",

                email:
                  player.email ||
                  "",

                phone:
                  player.phone ||
                  "",

                ghin:
                  player.ghin ||
                  "",

                handicap:
                  player.handicap ||
                  "",

                teeSelection:
                  player.teeSelection ||
                  "",

                shirtSize:
                  player.shirtSize ||
                  "",
              })
            )
          );
        }

        setEmergencyContactName(
          record
            .foursomeEmergencyContactName ||
            ""
        );

        setEmergencyContactPhone(
          record
            .foursomeEmergencyContactPhone ||
            ""
        );

        setFoursomeStatus(
          record.foursomeStatus ||
            ""
        );
      } catch (
        error
      ) {
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

  const includedFoursome =
    Boolean(
      sponsor?.includedFoursome
    ) ||
    isGrey ||
    isBlue;

  const materialsAlreadySubmitted =
    String(
      sponsor?.materialsStatus ||
      ""
    )
      .trim()
      .toLowerCase() ===
    "submitted";

  const requiresPrimaryLogo =
    !Boolean(
      sponsor?.hasPrimaryLogo
    );

  function updateGolfer(
    index: number,
    field:
      keyof SponsorGolfer,
    value: string
  ) {
    setFoursomePlayers(
      (
        current
      ) =>
        current.map(
          (
            golfer,
            golferIndex
          ) =>
            golferIndex ===
            index
              ? {
                  ...golfer,
                  [field]:
                    value,
                }
              : golfer
        )
    );
  }

  function handlePrimaryLogo(
    file: File | null
  ) {
    const error =
      validatePrimaryLogoFile(
        file
      );

    setPrimaryLogoError(
      error
    );

    if (
      error
    ) {
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
      validateAlternateLogoFile(
        file
      );

    setAlternateLogoError(
      error
    );

    if (
      error
    ) {
      setAlternateLogo(
        null
      );

      return;
    }

    setAlternateLogo(
      file
    );
  }

  async function handleMaterialsSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMaterialsError("");
    setMaterialsSuccess(
      false
    );

    if (
      !sponsor ||
      !sponsorId ||
      !token
    ) {
      setMaterialsError(
        "Unable to verify this sponsorship."
      );

      return;
    }

    if (
      requiresPrimaryLogo &&
      !primaryLogo
    ) {
      setPrimaryLogoError(
        "Please upload your website / digital logo as a PNG file."
      );

      return;
    }

    const primaryError =
      validatePrimaryLogoFile(
        primaryLogo
      );

    const alternateError =
      validateAlternateLogoFile(
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
      setMaterialsError(
        "Please complete both approval confirmations before submitting."
      );

      return;
    }

    if (
      isBlue
    ) {
      if (
        !bluePreference1
      ) {
        setMaterialsError(
          "Please select a first Blue Sponsor preference."
        );

        return;
      }

      const preferences = [
        bluePreference1,
        bluePreference2,
        bluePreference3,
      ].filter(
        Boolean
      );

      const uniquePreferences =
        new Set(
          preferences
        );

      if (
        uniquePreferences.size !==
        preferences.length
      ) {
        setMaterialsError(
          "Please select different choices for each Blue Sponsor preference."
        );

        return;
      }
    }

    setSubmittingMaterials(
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

                  submissionType:
                    "materials",

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

      setMaterialsSuccess(
        true
      );

      setInformationConfirmed(
        false
      );

      setUsageAuthorized(
        false
      );

      setSponsor(
        (
          current
        ) =>
          current
            ? {
                ...current,

                materialsStatus:
                  "Submitted",

                hasPrimaryLogo:
                  Boolean(
                    primaryLogo ||
                    current.hasPrimaryLogo
                  ),

                hasAlternateLogo:
                  Boolean(
                    alternateLogo ||
                    current.hasAlternateLogo
                  ),
              }
            : current
      );

      window.scrollTo({
        top:
          0,

        behavior:
          "smooth",
      });
    } catch (
      error
    ) {
      console.error(
        "Sponsor fulfillment submission error:",
        error
      );

      setMaterialsError(
        error instanceof Error
          ? error.message
          : "Unable to submit sponsor materials."
      );
    } finally {
      setSubmittingMaterials(
        false
      );
    }
  }

  async function handleFoursomeSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFoursomeError("");
    setFoursomeSuccess("");

    if (
      !sponsor ||
      !sponsorId ||
      !token
    ) {
      setFoursomeError(
        "Unable to verify this sponsorship."
      );

      return;
    }

    if (
      !includedFoursome
    ) {
      setFoursomeError(
        "This sponsorship does not include a foursome."
      );

      return;
    }

    for (
      let index = 0;
      index <
      foursomePlayers.length;
      index++
    ) {
      const golfer =
        foursomePlayers[
          index
        ];

      if (
        !golfer.firstName.trim() ||
        !golfer.lastName.trim() ||
        !golfer.email.trim() ||
        !golfer.phone.trim() ||
        !golfer.shirtSize.trim() ||
        !golfer.teeSelection.trim()
      ) {
        setFoursomeError(
          `Please complete all required information for Golfer ${
            index + 1
          }.`
        );

        return;
      }
    }

    if (
      !emergencyContactName.trim() ||
      !emergencyContactPhone.trim()
    ) {
      setFoursomeError(
        "Please provide the emergency contact name and phone number."
      );

      return;
    }

    if (
      !rosterConfirmed
    ) {
      setFoursomeError(
        "Please confirm that the foursome information is accurate."
      );

      return;
    }

    setSubmittingFoursome(
      true
    );

    try {
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

                  submissionType:
                    "foursome",

                  sponsorId,
                  token,

                  players:
                    foursomePlayers.map(
                      (
                        golfer
                      ) => ({
                        firstName:
                          golfer.firstName.trim(),

                        lastName:
                          golfer.lastName.trim(),

                        email:
                          golfer.email.trim(),

                        phone:
                          golfer.phone.trim(),

                        ghin:
                          golfer.ghin.trim(),

                        handicap:
                          golfer.handicap.trim(),

                        teeSelection:
                          golfer.teeSelection,

                        shirtSize:
                          golfer.shirtSize,
                      })
                    ),

                  emergencyContactName:
                    emergencyContactName.trim(),

                  emergencyContactPhone:
                    emergencyContactPhone.trim(),

                  rosterConfirmed:
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
            "Unable to submit the sponsor foursome."
        );
      }

      const newStatus =
        result.foursome
          ?.status ||
        "Registered";

      setFoursomeStatus(
        newStatus
      );

      setFoursomeSuccess(
        result.message ||
          "Sponsor foursome roster received."
      );

      setRosterConfirmed(
        false
      );
    } catch (
      error
    ) {
      console.error(
        "Sponsor foursome submission error:",
        error
      );

      setFoursomeError(
        error instanceof Error
          ? error.message
          : "Unable to submit the sponsor foursome."
      );
    } finally {
      setSubmittingFoursome(
        false
      );
    }
  }

  if (
    loading
  ) {
    return (
      <section className="min-h-[650px] bg-slate-50 py-24">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-lg">
            <p className="text-lg text-slate-600">
              Loading your sponsorship information…
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
              Sponsor Fulfillment
            </p>

            <h1 className="mt-4 text-4xl font-bold text-[var(--brand-navy)]">
              We couldn’t verify this sponsor link.
            </h1>

            <p className="mt-6 leading-8 text-slate-600">
              {loadError ||
                "This private sponsor fulfillment link is invalid or unavailable."}
            </p>

            <p className="mt-6 text-sm text-slate-500">
              Please contact chadmillermemorial@gmail.com if you need assistance.
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
              Sponsor Fulfillment
            </p>

            <h1 className="mt-5 text-5xl font-bold md:text-6xl">
              Thank you for supporting the SGM Chad Miller Memorial.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Your sponsorship helps us honor Chad’s legacy, support The Honor
              Foundation, and recognize members of the U.S. Special Operations
              community.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <div className="mx-auto max-w-5xl space-y-8">
            {materialsSuccess && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Materials Received
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Thank you.
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  Your sponsor materials have been received. You can continue
                  using this private page to update your information or your
                  included foursome where applicable.
                </p>
              </div>
            )}

            <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Your Sponsorship
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                {sponsor.sponsorshipLevel}
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Company / Organization
                  </p>

                  <p className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
                    {sponsor.company}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Sponsorship Amount
                  </p>

                  <p className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
                    {formatCurrency(
                      sponsor.amount
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Included Foursome
                  </p>

                  <p className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
                    {includedFoursome
                      ? "Yes — 4 golfers"
                      : "Not included"}
                  </p>
                </div>
              </div>
            </div>

            {includedFoursome && (
              <form
                onSubmit={
                  handleFoursomeSubmit
                }
                className="space-y-8"
              >
                <div className="rounded-3xl border border-[var(--brand-teal)]/30 bg-[var(--brand-sky)] p-8 shadow-sm md:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                    Included Foursome
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    Your four tournament spots are already reserved.
                  </h2>

                  <p className="mt-4 leading-7 text-slate-600">
                    Your {isBlue
                      ? "Blue"
                      : "Grey"} Sponsorship includes four tournament entries.
                    There is no additional player-registration payment for these
                    golfers. Please provide the roster below.
                  </p>

                  <p className="mt-4 font-semibold text-[var(--brand-navy)]">
                    Roster Status:{" "}
                    {foursomeStatus ||
                      "Reserved — golfer information needed"}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    You may return to this private link later to update golfer
                    information if your foursome changes.
                  </p>
                </div>

                {foursomeSuccess && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                    <p className="font-semibold text-emerald-800">
                      {foursomeSuccess}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-emerald-700">
                      All four golfers are now recorded in the tournament field.
                      Your sponsorship has not been charged any additional
                      registration fee.
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {foursomePlayers.map(
                    (
                      golfer,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="rounded-3xl bg-white p-8 shadow-lg md:p-10"
                      >
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                          Golfer{" "}
                          {index + 1}
                        </p>

                        <div className="mt-7 grid gap-6 md:grid-cols-2">
                          <label className="block">
                            <span className="font-semibold">
                              First Name *
                            </span>

                            <input
                              required
                              value={
                                golfer.firstName
                              }
                              onChange={(
                                event
                              ) =>
                                updateGolfer(
                                  index,
                                  "firstName",
                                  event.target.value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </label>

                          <label className="block">
                            <span className="font-semibold">
                              Last Name *
                            </span>

                            <input
                              required
                              value={
                                golfer.lastName
                              }
                              onChange={(
                                event
                              ) =>
                                updateGolfer(
                                  index,
                                  "lastName",
                                  event.target.value
                                )
                              }
                              className={
                                inputClass
                              }
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
                                golfer.email
                              }
                              onChange={(
                                event
                              ) =>
                                updateGolfer(
                                  index,
                                  "email",
                                  event.target.value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </label>

                          <label className="block">
                            <span className="font-semibold">
                              Phone *
                            </span>

                            <input
                              required
                              type="tel"
                              value={
                                golfer.phone
                              }
                              onChange={(
                                event
                              ) =>
                                updateGolfer(
                                  index,
                                  "phone",
                                  event.target.value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </label>

                          <label className="block">
                            <span className="font-semibold">
                              GHIN — Optional
                            </span>

                            <input
                              value={
                                golfer.ghin
                              }
                              onChange={(
                                event
                              ) =>
                                updateGolfer(
                                  index,
                                  "ghin",
                                  event.target.value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </label>

                          <label className="block">
                            <span className="font-semibold">
                              Handicap — Optional
                            </span>

                            <input
                              value={
                                golfer.handicap
                              }
                              onChange={(
                                event
                              ) =>
                                updateGolfer(
                                  index,
                                  "handicap",
                                  event.target.value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </label>

                          <label className="block">
                            <span className="font-semibold">
                              Men&apos;s Unisex T-Shirt Size *
                            </span>

                            <select
                              required
                              value={
                                golfer.shirtSize
                              }
                              onChange={(
                                event
                              ) =>
                                updateGolfer(
                                  index,
                                  "shirtSize",
                                  event.target.value
                                )
                              }
                              className={
                                inputClass
                              }
                            >
                              <option value="">
                                Select size
                              </option>

                              {SHIRT_SIZES.map(
                                (
                                  size
                                ) => (
                                  <option
                                    key={
                                      size
                                    }
                                    value={
                                      size
                                    }
                                  >
                                    {size}
                                  </option>
                                )
                              )}
                            </select>
                          </label>

                          <label className="block">
                            <span className="font-semibold">
                              Tee Selection *
                            </span>

                            <select
                              required
                              value={
                                golfer.teeSelection
                              }
                              onChange={(
                                event
                              ) =>
                                updateGolfer(
                                  index,
                                  "teeSelection",
                                  event.target.value
                                )
                              }
                              className={
                                inputClass
                              }
                            >
                              <option value="">
                                Select tee
                              </option>

                              <option value="mens">
                                Men&apos;s Tee
                              </option>

                              <option value="womens">
                                Women&apos;s Tee
                              </option>
                            </select>
                          </label>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                    Emergency Contact
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    Foursome emergency contact.
                  </h2>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="font-semibold">
                        Emergency Contact Name *
                      </span>

                      <input
                        required
                        value={
                          emergencyContactName
                        }
                        onChange={(
                          event
                        ) =>
                          setEmergencyContactName(
                            event.target.value
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="font-semibold">
                        Emergency Contact Phone *
                      </span>

                      <input
                        required
                        type="tel"
                        value={
                          emergencyContactPhone
                        }
                        onChange={(
                          event
                        ) =>
                          setEmergencyContactPhone(
                            event.target.value
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>
                  </div>

                  <label className="mt-8 flex gap-4 rounded-2xl bg-slate-50 p-5">
                    <input
                      required
                      type="checkbox"
                      checked={
                        rosterConfirmed
                      }
                      onChange={(
                        event
                      ) =>
                        setRosterConfirmed(
                          event.target.checked
                        )
                      }
                      className="mt-1 h-5 w-5 shrink-0"
                    />

                    <span className="leading-7 text-slate-600">
                      I confirm that the four golfer names and contact
                      information submitted above are accurate to the best of my
                      knowledge.
                    </span>
                  </label>

                  <p className="mt-5 text-sm leading-6 text-slate-500">
                    This roster form only provides golfer information for your
                    included sponsorship entries. It does not require the sponsor
                    contact to accept player-specific acknowledgments on behalf
                    of another golfer.
                  </p>

                  {foursomeError && (
                    <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                      {foursomeError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      submittingFoursome
                    }
                    className="mt-8 rounded-full bg-[var(--brand-blue)] px-8 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingFoursome
                      ? "Saving Foursome…"
                      : foursomeStatus ===
                          "Registered"
                        ? "Update Foursome Roster"
                        : "Submit Foursome Roster"}
                  </button>
                </div>
              </form>
            )}

            <form
              onSubmit={
                handleMaterialsSubmit
              }
              className="space-y-8"
            >
              <div className="rounded-3xl border border-[var(--brand-teal)]/30 bg-[var(--brand-sky)] p-8 shadow-sm md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                  Materials Deadline
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  {sponsor.materialsDue ||
                    "September 11, 2026"}
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  Please submit your sponsor materials by this date to guarantee
                  inclusion in printed tournament signage and scheduled
                  recognition.
                </p>
              </div>

              {materialsAlreadySubmitted && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm md:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Materials Already Submitted
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    Your sponsor materials are already on file.
                  </h2>

                  <p className="mt-4 leading-7 text-slate-600">
                    You may use this page to make corrections or update your
                    sponsor information before final production.
                  </p>

                  <p className="mt-3 font-semibold leading-7 text-[var(--brand-navy)]">
                    Your existing website / digital PNG logo remains on file.
                    You do not need to upload it again unless you want to replace
                    it.
                  </p>
                </div>
              )}

              {isHole && (
                <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                    Memorial Hole Recognition
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    Recognition alongside the memorial.
                  </h2>

                  <p className="mt-4 leading-8 text-slate-600">
                    Your organization will be recognized at a Memorial Hole.
                    The service member honored at that location will remain the
                    primary focus of the sign, with sponsor recognition
                    presented respectfully alongside the memorial.
                  </p>
                </div>
              )}

              {isGrey && (
                <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                    Grey Sponsor Recognition
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    Tournament-wide sponsor recognition.
                  </h2>

                  <p className="mt-4 leading-8 text-slate-600">
                    Grey Sponsors receive tournament recognition and one
                    included foursome. Your four golfer entries are handled
                    above and require no additional registration payment.
                  </p>
                </div>
              )}

              {isBlue && (
                <div className="rounded-3xl bg-[var(--brand-sky)] p-8 shadow-sm md:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                    Blue Sponsor Recognition
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    Special events, contests, and activity areas come first.
                  </h2>

                  <p className="mt-5 leading-8 text-slate-600">
                    Blue Sponsors are given priority for recognition at major
                    tournament events, contests, and specialty activity areas.
                    Examples include the Driving Range, Putting Green, Longest
                    Drive, Closest-to-the-Pin, Hole-in-One Contest, Breakfast,
                    Lunch, Silent Auction, and Tribute / Awards Program.
                  </p>

                  <p className="mt-4 leading-8 text-slate-600">
                    If those opportunities are fully assigned, or if additional
                    Memorial Hole Sponsors are needed, the tournament team may
                    assign a Blue Sponsor to Memorial Hole recognition while
                    maintaining recognition appropriate to the Blue Sponsorship
                    level.
                  </p>
                </div>
              )}

              <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                  Sponsor Information
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  How should we represent your organization?
                </h2>

                <div className="mt-8 grid gap-6">
                  <label className="block">
                    <span className="font-semibold text-[var(--brand-navy)]">
                      Public-Facing Organization Name *
                    </span>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Enter the exact name you would like displayed on tournament
                      signage and the Sponsor Recognition page.
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
                          event.target.value
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold text-[var(--brand-navy)]">
                      Website URL — Optional
                    </span>

                    <input
                      type="url"
                      value={
                        website
                      }
                      onChange={(
                        event
                      ) =>
                        setWebsite(
                          event.target.value
                        )
                      }
                      placeholder="https://"
                      className={
                        inputClass
                      }
                    />
                  </label>

                  {showTagline && (
                    <label className="block">
                      <span className="font-semibold text-[var(--brand-navy)]">
                        Short Tagline or Description — Optional
                      </span>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Maximum 150 characters.
                      </p>

                      <textarea
                        value={
                          tagline
                        }
                        maxLength={
                          150
                        }
                        rows={
                          3
                        }
                        onChange={(
                          event
                        ) =>
                          setTagline(
                            event.target.value
                          )
                        }
                        className={
                          inputClass
                        }
                      />

                      <p className="mt-1 text-right text-xs text-slate-400">
                        {tagline.length}/150
                      </p>
                    </label>
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                  Logo & Artwork
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Send us your best-quality logo.
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  Please provide a <strong>PNG logo</strong> for website and
                  digital recognition. If available, we also strongly prefer an{" "}
                  <strong>SVG logo</strong> for printed signs, banners, and
                  other large-format materials.
                </p>

                <div className="mt-8 grid gap-8 md:grid-cols-2">
                  <label className="block rounded-2xl border border-slate-200 p-6">
                    <span className="font-semibold text-[var(--brand-navy)]">
                      {requiresPrimaryLogo
                        ? "Website / Digital Logo (PNG) *"
                        : "Website / Digital Logo (PNG) — Optional Replacement"}
                    </span>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {requiresPrimaryLogo
                        ? "Required. Upload a high-resolution PNG for website and digital recognition. A transparent background is preferred."
                        : "Your required PNG logo is already on file. Leave this blank to keep it, or upload a new PNG to replace it."}
                    </p>

                    <input
                      type="file"
                      required={
                        requiresPrimaryLogo
                      }
                      accept=".png,image/png"
                      onChange={(
                        event
                      ) =>
                        handlePrimaryLogo(
                          event.target
                            .files?.[0] ||
                            null
                        )
                      }
                      className="mt-4 block w-full text-sm"
                    />

                    {primaryLogo && (
                      <p className="mt-3 text-sm font-medium text-[var(--brand-blue)]">
                        {primaryLogo.name}
                      </p>
                    )}

                    {primaryLogoError && (
                      <p className="mt-3 text-sm font-semibold text-red-600">
                        {primaryLogoError}
                      </p>
                    )}
                  </label>

                  <label className="block rounded-2xl border border-slate-200 p-6">
                    <span className="font-semibold text-[var(--brand-navy)]">
                      Print-Quality Logo (SVG) — Strongly Preferred
                    </span>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {sponsor.hasAlternateLogo
                        ? "A print-quality SVG logo is already on file. Leave this blank to keep it, or upload a new SVG to replace it."
                        : "If available, upload an SVG version for printed signs, banners, and other large-format materials."}
                    </p>

                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      onChange={(
                        event
                      ) =>
                        handleAlternateLogo(
                          event.target
                            .files?.[0] ||
                            null
                        )
                      }
                      className="mt-4 block w-full text-sm"
                    />

                    {alternateLogo && (
                      <p className="mt-3 text-sm font-medium text-[var(--brand-blue)]">
                        {alternateLogo.name}
                      </p>
                    )}

                    {alternateLogoError && (
                      <p className="mt-3 text-sm font-semibold text-red-600">
                        {alternateLogoError}
                      </p>
                    )}
                  </label>
                </div>

                <p className="mt-6 text-sm text-slate-500">
                  Maximum file size: 3 MB per logo. The PNG is required; the SVG
                  is strongly preferred when available.
                </p>
              </div>

              {isBlue && (
                <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                    Blue Sponsor Special Event & Area Preferences
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    Tell us what interests your organization most.
                  </h2>

                  <p className="mt-5 leading-8 text-slate-600">
                    Please select at least one preferred special-event, contest,
                    or activity-area sponsorship. We will make every effort to
                    accommodate your highest available preference based on
                    availability and the order completed sponsor materials are
                    received.
                  </p>

                  <p className="mt-4 font-semibold leading-7 text-[var(--brand-navy)]">
                    Specific assignments and exclusivity are not guaranteed.
                    Some major areas, including Breakfast and Lunch, may
                    recognize multiple Blue Sponsors.
                  </p>

                  <div className="mt-8 grid gap-6 md:grid-cols-3">
                    {[
                      {
                        label:
                          "First Preference *",

                        value:
                          bluePreference1,

                        setter:
                          setBluePreference1,

                        required:
                          true,
                      },

                      {
                        label:
                          "Second Preference",

                        value:
                          bluePreference2,

                        setter:
                          setBluePreference2,

                        required:
                          false,
                      },

                      {
                        label:
                          "Third Preference",

                        value:
                          bluePreference3,

                        setter:
                          setBluePreference3,

                        required:
                          false,
                      },
                    ].map(
                      (
                        preference
                      ) => (
                        <label
                          key={
                            preference.label
                          }
                          className="block"
                        >
                          <span className="font-semibold">
                            {preference.label}
                          </span>

                          <select
                            required={
                              preference.required
                            }
                            value={
                              preference.value
                            }
                            onChange={(
                              event
                            ) =>
                              preference.setter(
                                event.target.value
                              )
                            }
                            className={
                              inputClass
                            }
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
                                  {option}
                                </option>
                              )
                            )}
                          </select>
                        </label>
                      )
                    )}
                  </div>
                </div>
              )}

              {isBlue && (
                <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                    Tribute & Awards Recognition
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    Representative information — optional.
                  </h2>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="font-semibold">
                        Representative Name
                      </span>

                      <input
                        value={
                          representativeName
                        }
                        onChange={(
                          event
                        ) =>
                          setRepresentativeName(
                            event.target.value
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="font-semibold">
                        Representative Title
                      </span>

                      <input
                        value={
                          representativeTitle
                        }
                        onChange={(
                          event
                        ) =>
                          setRepresentativeTitle(
                            event.target.value
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>
                  </div>

                  <label className="mt-6 block">
                    <span className="font-semibold">
                      Additional Recognition Notes — Optional
                    </span>

                    <textarea
                      value={
                        additionalNotes
                      }
                      maxLength={
                        500
                      }
                      rows={
                        4
                      }
                      onChange={(
                        event
                      ) =>
                        setAdditionalNotes(
                          event.target.value
                        )
                      }
                      className={
                        inputClass
                      }
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {additionalNotes.length}/500
                    </p>
                  </label>
                </div>
              )}

              <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                  Primary Contact
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Who should we contact if we have a question?
                </h2>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <label className="block">
                    <span className="font-semibold">
                      Contact Name *
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
                          event.target.value
                        )
                      }
                      className={
                        inputClass
                      }
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
                          event.target.value
                        )
                      }
                      className={
                        inputClass
                      }
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
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 md:max-w-md"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl bg-[var(--brand-navy)] p-8 text-white shadow-lg md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-teal)]">
                  Final Approval
                </p>

                <h2 className="mt-3 text-3xl font-bold">
                  Confirm your sponsor materials.
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
                          event.target.checked
                        )
                      }
                      className="mt-1 h-5 w-5 shrink-0"
                    />

                    <span className="leading-7 text-slate-200">
                      I confirm that the organization name, website, contact
                      information, and recognition preferences submitted above
                      are correct.
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
                          event.target.checked
                        )
                      }
                      className="mt-1 h-5 w-5 shrink-0"
                    />

                    <span className="leading-7 text-slate-200">
                      I authorize the SGM Chad Miller Memorial Golf Tournament
                      to use the submitted company name, logo, artwork, and
                      provided information for tournament signage, website
                      recognition, communications, and other materials associated
                      with the event.
                    </span>
                  </label>
                </div>

                {materialsError && (
                  <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {materialsError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submittingMaterials
                  }
                  className="mt-8 rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingMaterials
                    ? materialsAlreadySubmitted
                      ? "Updating Sponsor Materials…"
                      : "Submitting Sponsor Materials…"
                    : materialsAlreadySubmitted
                      ? "Update Sponsor Materials"
                      : "Submit Sponsor Materials"}
                </button>

                <p className="mt-5 text-sm leading-6 text-slate-400">
                  Your submission will be reviewed by the tournament team before
                  any materials are published or sent to production.
                </p>
              </div>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}