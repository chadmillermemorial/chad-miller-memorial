export type AdminRecordType =
  | "player"
  | "sponsorship"
  | "donation";

export type AdminRecordFilter =
  | AdminRecordType
  | "all";

type CheckoutSessionLike = {
  id: string;
  amount_total?: number | null;
  payment_status?: string | null;
  created?: number | null;
  metadata?: Record<string, string | undefined> | null;
  customer_details?: {
    email?: string | null;
  } | null;
};

export type AdminCheckoutRecord = {
  id: string;
  type: AdminRecordType;
  title: string;
  subtitle: string;
  email: string;
  amountCents: number;
  created: number;
  searchText: string;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function getPlayerNames(
  metadata: Record<string, string | undefined>,
  playerCount: number
) {
  const names: string[] = [];

  for (
    let playerNumber = 1;
    playerNumber <= playerCount;
    playerNumber++
  ) {
    const firstName = clean(
      metadata[`p${playerNumber}FirstName`]
    );

    const lastName = clean(
      metadata[`p${playerNumber}LastName`]
    );

    const fullName =
      `${firstName} ${lastName}`.trim();

    if (fullName) {
      names.push(fullName);
    }
  }

  return names;
}

function classifyMetadata(
  metadata: Record<string, string | undefined>
): AdminRecordType | null {
  if (metadata.paymentType === "donation") {
    return "donation";
  }

  if (metadata.paymentType === "sponsorship") {
    return "sponsorship";
  }

  const playerCount = Number(
    metadata.playerCount || "0"
  );

  if (
    Number.isInteger(playerCount) &&
    playerCount >= 1 &&
    playerCount <= 4
  ) {
    return "player";
  }

  return null;
}

export function toAdminCheckoutRecord(
  session: CheckoutSessionLike
): AdminCheckoutRecord | null {
  if (session.payment_status !== "paid") {
    return null;
  }

  const metadata = session.metadata || {};
  const type = classifyMetadata(metadata);

  if (!type) {
    return null;
  }

  const fallbackEmail = clean(
    session.customer_details?.email
  );

  let title = "";
  let subtitle = "";
  let email = clean(metadata.email) || fallbackEmail;
  let additionalSearch = "";

  if (type === "donation") {
    title =
      clean(metadata.donorName) ||
      clean(metadata.publicRecognitionName) ||
      "Donation";

    subtitle = email;

    additionalSearch = [
      clean(metadata.publicRecognitionName),
      clean(metadata.phone),
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (type === "sponsorship") {
    title =
      clean(metadata.company) ||
      clean(metadata.contactName) ||
      "Sponsorship";

    subtitle = [
      clean(metadata.sponsorLevel),
      clean(metadata.contactName),
      email,
    ]
      .filter(Boolean)
      .join(" • ");

    additionalSearch = [
      clean(metadata.sponsorshipName),
      clean(metadata.phone),
      clean(metadata.website),
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (type === "player") {
    const playerCount = Number(
      metadata.playerCount || "0"
    );

    const names = getPlayerNames(
      metadata,
      playerCount
    );

    title =
      clean(metadata.teamName) ||
      names[0] ||
      "Player Registration";

    email =
      clean(metadata.p1Email) ||
      email;

    subtitle = [
      `${playerCount} golfer${playerCount === 1 ? "" : "s"}`,
      email,
    ]
      .filter(Boolean)
      .join(" • ");

    const playerEmails: string[] = [];

    for (
      let playerNumber = 1;
      playerNumber <= playerCount;
      playerNumber++
    ) {
      const playerEmail = clean(
        metadata[`p${playerNumber}Email`]
      );

      if (playerEmail) {
        playerEmails.push(playerEmail);
      }
    }

    additionalSearch = [
      ...names,
      ...playerEmails,
      clean(metadata.teamName),
    ]
      .filter(Boolean)
      .join(" ");
  }

  const searchText = [
    session.id,
    title,
    subtitle,
    email,
    additionalSearch,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: session.id,
    type,
    title,
    subtitle,
    email,
    amountCents:
      Number(session.amount_total || 0),
    created: Number(session.created || 0),
    searchText,
  };
}

export function filterAdminCheckoutRecords(
  records: AdminCheckoutRecord[],
  type: AdminRecordFilter,
  query: string
) {
  const normalizedQuery =
    query.trim().toLowerCase();

  return records.filter((record) => {
    if (
      type !== "all" &&
      record.type !== type
    ) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return record.searchText
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
