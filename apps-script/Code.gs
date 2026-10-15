const PLAYERS_SHEET_NAME = "Players";
const HOLDS_SHEET_NAME = "Capacity Holds";
const PAIRINGS_SHEET_NAME = "Pairings";
const SPONSORS_SHEET_NAME = "Sponsors";
const DONATIONS_SHEET_NAME = "Donations";
const VOLUNTEERS_SHEET_NAME = "Volunteers";
const IN_KIND_SHEET_NAME = "In-Kind Donations";
const IN_KIND_SOURCE_SHEET_ID = 763058240;
const IN_KIND_FOLDER_ID = "1pZ1Pb7ExUPa_fEGNhc88FAwCWtIFXwIi";
const IN_KIND_FOLDER_NAME = "Chad Miller Memorial - In-Kind Contributions";
const IN_KIND_ADMIN_EMAIL = "chadmillermemorial@gmail.com";
const IN_KIND_MAX_FILES = 3;
const IN_KIND_MAX_FILE_BYTES = 4 * 1024 * 1024;

const MAX_PLAYERS = 128;
const HOLD_MINUTES = 35;
const SPONSOR_HOLD_MINUTES = 35;

const SPONSOR_CAPACITY_INTERNAL_KEY_PROPERTY = "SPONSOR_CAPACITY_INTERNAL_KEY";
const EMAIL_SENDER_NAME = "CSM Chad Miller Memorial Golf Tournament";
const EVENT_DATE = "Friday, October 9, 2026";
const EVENT_LOCATION = "Hyland Golf Course, Southern Pines, NC";
const WEBSITE_URL = "https://www.chadmillermemorial.org";
const REFUND_DEADLINE_TEXT = "September 25, 2026 at 11:59 PM ET";

const SHOTGUN_ONE_HOLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const SHOTGUN_TWO_HOLES = [1, 2, 4, 5, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18];

const PLAYER_HEADERS = [
  "Registration ID", "Registration Date", "Payment Status", "Payment Amount",
  "Team Name", "Player Number", "First Name", "Last Name", "Email", "Phone",
  "GHIN", "Handicap", "Tee", "Men's Shirt Size", "Emergency Contact",
  "Emergency Contact Phone", "Checked In", "Cart Number", "Starting Hole",
  "Notes", "Refund Amount", "Processing Fee Retained", "Refund Date",
  "Stripe Refund ID", "Withdrawal Token Hash"
];

const HOLD_HEADERS = [
  "Hold ID", "Created At", "Expires At", "Player Count", "Status", "Stripe Session ID"
];

const PAIRING_HEADERS = [
  "Group Number", "Shotgun", "Starting Hole", "Registration ID",
  "Player Number", "First Name", "Last Name", "Handicap", "Team Name",
  "Tee", "Pairing Status", "Notes"
];

const SPONSOR_HEADERS = [
  "Company", "Contact Name", "Email", "Phone", "Sponsorship Level", "Amount",
  "Paid", "Logo Received", "Website", "Banner Received", "Notes", "Sponsor ID",
  "Fulfillment Token Hash", "Fulfillment Email Sent", "Materials Due",
  "Public Display Name", "Fulfillment Website URL", "Primary Logo File",
  "Alternate Logo File", "Tagline / Description", "Materials Submitted",
  "Materials Status", "Memorial Honoree", "Memorial Hole", "Blue Preference 1",
  "Blue Preference 2", "Blue Preference 3", "Blue Feature Assignment",
  "Representative Name", "Representative Title", "Website Status",
  "Memorial Sign Status", "Main Board Status", "Blue Feature Sign Status",
  "Communications Status", "Fulfillment Complete", "Internal Notes",
  "Payment Status", "Refund Amount", "Processing Fee Retained",
  "Refund Date", "Stripe Refund ID"
];

const DONATION_HEADERS = [
  "Donor Name", "Email", "Amount", "Date", "Anonymous", "Notes", "Phone",
  "Registered Player?", "Public Recognition", "Public Recognition Name",
  "Payment Status", "Stripe Session ID", "Refund Amount",
  "Processing Fee Retained", "Refund Date", "Stripe Refund ID", "Thank You Status"
];

const IN_KIND_HEADERS = [
  "Submission ID", "Submitted At", "Donor / Business", "Contact Name",
  "Email", "Phone", "Contribution Type", "Contribution Type Write-In",
  "Intended Use", "Intended Use Write-In", "Item / Service Name", "Description",
  "Estimated Retail Value", "Quantity", "Restrictions / Expiration",
  "Redemption Instructions", "Website / Social", "File Links",
  "Drop-Off / Pickup Plan", "Public Recognition", "Public Recognition Name",
  "Status", "Reviewer", "Review Date", "Accepted / Declined Date",
  "Received Date", "Donor Notification Status", "Attachment Status", "Notes"
];

const IN_KIND_STATUSES = [
  "Submitted", "Under Review", "Accepted", "Declined", "Received", "Ready for Event"
];

const IN_KIND_CONTRIBUTION_TYPES = [
  "Physical Item / Merchandise", "Gift Card / Gift Certificate", "Service",
  "Experience", "Food / Beverage", "Event Supply / Equipment", "Other — Write In"
];

const IN_KIND_INTENDED_USES = [
  "Silent Auction", "Contest Prize", "Event Supply / Operations",
  "Food & Beverage", "Participant / Volunteer Support", "Other — Write In"
];

const IN_KIND_ALLOWED_MIME_TYPES = [
  "application/pdf", "image/jpeg", "image/png", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const IN_KIND_ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];

const VOLUNTEER_HEADERS = [
  "First Name", "Last Name", "Email", "Phone", "Shirt Size",
  "Assignment", "Arrival Time", "Checked In", "Notes"
];

/* MENU / AUTHORIZATION */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Tournament Tools")
    .addItem("Build / Refresh Pairings", "buildPairings")
    .addSeparator()
    .addItem("Setup / Refresh In-Kind Donations", "setupInKindDonations")
    .addItem("Install In-Kind Status Trigger", "installInKindDonationStatusTrigger")
    .addToUi();
}

function authorizeEmail() {
  const remaining = MailApp.getRemainingDailyQuota();
  SpreadsheetApp.getUi().alert(
    "Email authorization complete.\n\n" +
    "Remaining recipient quota today: " + remaining
  );
}

/* WEB APP */

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || "") : "";
  if (action === "get2027Capabilities") return get2027Capabilities();
  if (action === "getCapacity") return getCapacity();
  if (action === "getApprovedSponsors") return getApprovedSponsors();
  return jsonResponse({
    ok: true,
    message: "Chad Miller Memorial endpoint is running. 2026 enrollment is closed.",
    registrationClosed: true,
    completedYear: 2026,
    upcomingYear: 2027
  });
}

function doPost(e) {
  try {
    const data = JSON.parse(e && e.postData ? e.postData.contents : "null");

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("A JSON request object is required.");
    }

    // These are inquiries only: never reserve places or create payments.
    if (data.action === "save2027Inquiry") return save2027Inquiry(data);
    if (data.action === "get2027Capabilities") return get2027Capabilities();

    // Close the public script endpoint as well as the website's old forms.
    // Paid settlement, release, refund and fulfillment routes remain below
    // so historical payments can still be reconciled without losing records.
    const closedEnrollmentActions = [
      "attachPlayerCheckout", "getPlayerCapacityHold", "reserveCapacity",
      "reserveSponsorCapacity", "validateWaitlistOffer", "volunteerRegistration",
      "waitlistRegistration", "createInKindDonation", "uploadInKindDonationFile",
      "finalizeInKindDonation"
    ];
    if (closedEnrollmentActions.indexOf(data.action) !== -1) {
      return jsonResponse({
        ok: false, registrationClosed: true, completedYear: 2026, upcomingYear: 2027,
        message: "2026 enrollment is closed. 2027 registration and paid sponsorships are not open."
      });
    }
    // Untagged legacy payments belong to 2026. Explicit future-year data must
    // use a dedicated handler; it must never land in the historical tabs.
    if (data.eventYear !== undefined && String(data.eventYear) !== "2026") {
      throw new Error("This event year requires a separate supported handler.");
    }

    if (data.action === "getCapacity") return getCapacity();
    if (data.action === "getApprovedSponsors") return getApprovedSponsors();
    if (data.action === "releaseCapacity") return releaseCapacity(data);
    if (data.action === "releaseSponsorCapacity") return releaseSponsorCapacity(data);
    if (data.action === "playerWithdrawal") return savePlayerWithdrawal(data);
    if (data.action === "getSponsorFulfillment") return getSponsorFulfillment(data);
    if (data.action === "saveSponsorFulfillment") return saveSponsorFulfillment(data);
    if (data.action === "sponsorRefund") return saveSponsorRefund(data);
    if (data.action === "donationRefund") return saveDonationRefund(data);
    if (data.action) throw new Error("Unsupported action.");
    if (data.paymentType === "sponsorship") return savePaidSponsor(data);
    if (data.paymentType === "donation") return savePaidDonation(data);
    if (data.paymentType && data.paymentType !== "player") {
      throw new Error("Unsupported payment type.");
    }

    return savePaidRegistration(data);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error && error.message ? error.message : String(error),
      message: error && error.message ? error.message : String(error)
    });
  }
}

/* VOLUNTEERS */

function saveVolunteerRegistration(data) {
  if (
    !data.firstName || !data.lastName || !data.email ||
    !data.phone || !data.shirtSize || !data.assignment
  ) {
    throw new Error("Required volunteer information is missing.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateVolunteersSheet(spreadsheet);

    if (volunteerAlreadyExists(sheet, data.firstName, data.lastName, data.email)) {
      sendVolunteerConfirmationOnce(data);
      return jsonResponse({ok: true, duplicate: true});
    }

    sheet.appendRow([
      data.firstName || "", data.lastName || "", data.email || "",
      data.phone || "", data.shirtSize || "", data.assignment || "",
      "6:00 AM", "No", data.notes || ""
    ]);

    sendVolunteerConfirmationOnce(data);
    return jsonResponse({ok: true, volunteerSaved: true});
  } finally {
    lock.releaseLock();
  }
}

/* CAPACITY */

function getCapacity() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const playersSheet = spreadsheet.getSheetByName(PLAYERS_SHEET_NAME);
  const holdsSheet = spreadsheet.getSheetByName(HOLDS_SHEET_NAME);
  const paidPlayers = playersSheet ? countPaidPlayers(playersSheet) : 0;
  const activeHolds = holdsSheet ? countCurrentActiveHoldsReadOnly_(holdsSheet) : 0;
  const physicalRemaining = Math.max(MAX_PLAYERS - paidPlayers - activeHolds, 0);
  const waitlistState = getWaitlistPriorityStateReadOnly_(spreadsheet);
  const publicRegistrationOpen = physicalRemaining > 0 && !waitlistState.priorityActive;

  return jsonResponse({
    ok: true,
    maxPlayers: MAX_PLAYERS,
    paidPlayers,
    activeHolds,
    physicalRemaining,
    remaining: publicRegistrationOpen ? physicalRemaining : 0,
    full: physicalRemaining === 0,
    publicRegistrationOpen,
    waitlistPriorityActive: waitlistState.priorityActive,
    waitlistWaitingCount: waitlistState.waitingCount,
    waitlistOffersOutstanding: waitlistState.offersOutstanding
  });
}

function countCurrentActiveHoldsReadOnly_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const rows = sheet.getRange(2, 1, lastRow - 1, HOLD_HEADERS.length).getValues();
  const now = Date.now();

  return rows.reduce((total, row) => {
    const playerCount = Number(row[3]) || 0;
    const status = String(row[4] || "").trim();

    if (status === "Sponsor Reserved") return total + playerCount;
    if (status !== "Active") return total;

    const expiresAt = row[2] instanceof Date
      ? row[2].getTime()
      : new Date(row[2]).getTime();

    if (Number.isFinite(expiresAt) && expiresAt <= now) return total;
    return total + playerCount;
  }, 0);
}

function getWaitlistPriorityStateReadOnly_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName("Waitlist");

  if (!sheet || sheet.getLastRow() < 2) {
    return {priorityActive: false, waitingCount: 0, offersOutstanding: 0};
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  const now = Date.now();
  let waitingCount = 0;
  let offersOutstanding = 0;

  rows.forEach((row) => {
    const status = String(row[7] || "").trim().toLowerCase();

    if (status === "waiting" || status === "contacted") {
      waitingCount++;
      return;
    }

    if (status !== "registration offered") return;

    const deadline = row[9];
    const deadlineTime = deadline instanceof Date
      ? deadline.getTime()
      : new Date(deadline).getTime();

    if (Number.isFinite(deadlineTime) && deadlineTime <= now) return;
    offersOutstanding++;
  });

  return {
    priorityActive: waitingCount > 0 || offersOutstanding > 0,
    waitingCount,
    offersOutstanding
  };
}

function reserveCapacity(data) {
  const playerCount = Number(data.playerCount);

  if (![1, 2, 3, 4].includes(playerCount)) {
    throw new Error("Invalid player count.");
  }

  const reservationType = String(data.reservationType || "player").trim().toLowerCase();

  if (!["player", "sponsor"].includes(reservationType)) {
    throw new Error("Invalid capacity reservation type.");
  }

  const sponsorReservation = reservationType === "sponsor";

  if (sponsorReservation) {
    requireSponsorCapacityInternalKey_(data);
  }

  const attemptId = sponsorReservation
    ? ""
    : String(data.registrationAttemptId || "").trim();

  if (attemptId.length > 100) {
    throw new Error("Invalid registration attempt ID.");
  }

  const requestedHoldId = attemptId ? cmmPlayerCheckoutV2HoldId_(attemptId) : "";
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const playersSheet = getOrCreatePlayersSheet(spreadsheet);
    const holdsSheet = getOrCreateHoldsSheet(spreadsheet);

    cleanupExpiredHolds(holdsSheet);

    const remaining = MAX_PLAYERS -
      countPaidPlayers(playersSheet) -
      countActiveHolds(holdsSheet);

    const existing = requestedHoldId
      ? cmmPlayerCheckoutV2FindHold_(holdsSheet, requestedHoldId)
      : null;

    /*
    Recognize this exact registration attempt's existing hold before
    treating the tournament as full. Never take another person's hold.
    */

    if (existing) {
      const status = String(existing.values[4] || "").trim();

      if (status === "Converted") {
        return jsonResponse({
          ok: false,
          alreadyRegistered: true,
          message: "This registration attempt has already been completed."
        });
      }

      if (status !== "Active") {
        return jsonResponse({
          ok: false,
          startNewAttempt: true,
          message: "This checkout attempt has ended. Refresh the registration page to start a new attempt."
        });
      }

      if (Number(existing.values[3]) !== playerCount) {
        return jsonResponse({
          ok: false,
          message: "The player count changed for the same checkout attempt. Resume or cancel the original checkout before starting again."
        });
      }

      const expiry = new Date(existing.values[2]).getTime();

      if (!Number.isFinite(expiry) || expiry <= Date.now()) {
        return jsonResponse({
          ok: false,
          message: "This hold has an invalid or expired deadline. Please contact the tournament organizer."
        });
      }

      if (remaining < 0) {
        return jsonResponse({
          ok: false,
          message: "Tournament capacity needs administrator review before checkout can continue."
        });
      }
    } else if (playerCount > remaining) {
      return jsonResponse({
        ok: false,
        full: remaining <= 0,
        remaining: Math.max(remaining, 0),
        message: remaining <= 0
          ? "All available player spots are paid or temporarily held by another checkout."
          : `Only ${remaining} player spot(s) remain.`
      });
    }

    let waitlistOffer = null;

    if (!sponsorReservation) {
      const state = getWaitlistPriorityState_(spreadsheet);

      if (state.priorityActive || data.waitlistId || data.offerToken) {
        waitlistOffer = validateWaitlistOffer_(
          spreadsheet, data.waitlistId, data.offerToken, playerCount
        );

        if (!waitlistOffer.valid) {
          return jsonResponse({
            ok: false,
            waitlistPriority: state.priorityActive,
            remaining: state.priorityActive ? 0 : Math.max(remaining, 0),
            message: waitlistOffer.reason ||
              "Available tournament spots are currently reserved for the waitlist."
          });
        }
      }
    }

    if (existing) {
      return jsonResponse({
        ok: true,
        holdProtocol: "player-hold-v2",
        reused: true,
        holdId: requestedHoldId,
        expiresAt: new Date(existing.values[2]).toISOString(),
        stripeSessionId: String(existing.values[5] || "").trim(),
        remainingAfterHold: Math.max(remaining, 0),
        reservationType,
        waitlistId: waitlistOffer && waitlistOffer.valid ? waitlistOffer.waitlistId : ""
      });
    }

    const holdId = sponsorReservation
      ? "SPONSOR-" + Utilities.getUuid()
      : requestedHoldId || Utilities.getUuid();

    const createdAt = new Date();
    const expiresAt = new Date(
      createdAt.getTime() +
      (sponsorReservation ? SPONSOR_HOLD_MINUTES : HOLD_MINUTES) * 60000
    );

    holdsSheet.appendRow([
      holdId, createdAt, expiresAt, playerCount, "Active", ""
    ]);

    return jsonResponse({
      ok: true,
      holdProtocol: requestedHoldId ? "player-hold-v2" : "legacy",
      reused: false,
      holdId,
      expiresAt: expiresAt.toISOString(),
      stripeSessionId: "",
      remainingAfterHold: remaining - playerCount,
      reservationType,
      waitlistId: waitlistOffer && waitlistOffer.valid ? waitlistOffer.waitlistId : ""
    });
  } finally {
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }
}

function reserveSponsorCapacity(data) {
  const playerCount = Number(data.playerCount);

  if (playerCount !== 4) {
    throw new Error("Sponsor foursome reservation must contain exactly 4 players.");
  }

  data.reservationType = "sponsor";
  return reserveCapacity(data);
}

function releaseSponsorCapacity(data) {
  requireSponsorCapacityInternalKey_(data);

  const holdId = String(data && data.holdId ? data.holdId : "").trim();
  if (!holdId) return jsonResponse({ok: true, released: false});

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const holdsSheet = getOrCreateHoldsSheet(spreadsheet);
    const lastRow = holdsSheet.getLastRow();

    if (lastRow < 2) return jsonResponse({ok: true, released: false});

    const rows = holdsSheet.getRange(2, 1, lastRow - 1, HOLD_HEADERS.length).getValues();
    const index = rows.findIndex((row) => String(row[0] || "").trim() === holdId);

    if (index === -1) return jsonResponse({ok: true, released: false});

    const rowNumber = index + 2;
    const status = String(rows[index][4] || "").trim();

    if (status === "Sponsor Reserved" || status === "Converted") {
      return jsonResponse({ok: true, released: false, protected: true});
    }

    if (status !== "Active") return jsonResponse({ok: true, released: false});

    holdsSheet.getRange(rowNumber, 5).setValue("Released");
    return jsonResponse({ok: true, released: true});
  } finally {
    lock.releaseLock();
  }
}

function requireSponsorCapacityInternalKey_(data) {
  const expectedKey = String(
    PropertiesService.getScriptProperties()
      .getProperty(SPONSOR_CAPACITY_INTERNAL_KEY_PROPERTY) || ""
  ).trim();

  if (!expectedKey) {
    throw new Error("Sponsor capacity security is not configured.");
  }

  const providedKey = String(data && data.internalKey ? data.internalKey : "").trim();

  if (!secureSponsorCapacityKeyMatch_(expectedKey, providedKey)) {
    throw new Error("Unauthorized sponsor capacity request.");
  }
}

function secureSponsorCapacityKeyMatch_(first, second) {
  const a = String(first || "");
  const b = String(second || "");

  if (a.length !== b.length) return false;

  let difference = 0;

  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return difference === 0;
}

function releaseCapacity(data) {
  const holdId = String(data && data.holdId ? data.holdId : "").trim();

  if (!holdId) return jsonResponse({ok: true, released: false});

  if (holdId.startsWith("SPONSOR-")) {
    return jsonResponse({ok: true, released: false, protected: true});
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const holdsSheet = getOrCreateHoldsSheet(spreadsheet);
    const lastRow = holdsSheet.getLastRow();

    if (lastRow < 2) return jsonResponse({ok: true, released: false});

    const rows = holdsSheet.getRange(2, 1, lastRow - 1, HOLD_HEADERS.length).getValues();
    const index = rows.findIndex((row) => String(row[0] || "").trim() === holdId);

    if (index === -1) return jsonResponse({ok: true, released: false});

    const status = String(rows[index][4] || "").trim();

    if (status !== "Active") {
      return jsonResponse({
        ok: true,
        released: false,
        protected: status === "Sponsor Reserved" || status === "Converted"
      });
    }

    holdsSheet.getRange(index + 2, 5).setValue("Released");
    return jsonResponse({ok: true, released: true});
  } finally {
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }
}

/* PAID PLAYER REGISTRATIONS */

function savePaidRegistration(data) {
  if (!data.registrationId) throw new Error("Registration ID is required.");

  if (!data.players || !Array.isArray(data.players)) {
    throw new Error("No player data was received.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreatePlayersSheet(spreadsheet);
    const holdsSheet = getOrCreateHoldsSheet(spreadsheet);

    if (registrationAlreadyExists(sheet, data.registrationId)) {
      if (data.capacityHoldId) {
        updateHoldStatus(
          holdsSheet, data.capacityHoldId, "Converted",
          data.stripeSessionId || data.registrationId
        );
      }

      if (data.waitlistId) {
        completeWaitlistRegistration_(spreadsheet, data.waitlistId, data.registrationId);
      }

      sendPlayerConfirmationOnce(data);

      return jsonResponse({
        ok: true, duplicate: true, registrationId: data.registrationId
      });
    }

    const validPlayers = data.players.filter(
      (player) => player.firstName || player.lastName
    );

    if (validPlayers.length === 0) {
      throw new Error("At least one player is required.");
    }

    const registrationDate = new Date();

    const rows = validPlayers.map((player, index) => [
      data.registrationId,
      registrationDate,
      data.paymentStatus || "Paid",
      Number(data.paymentAmount || 75),
      data.teamName || "",
      index + 1,
      player.firstName || "",
      player.lastName || "",
      player.email || "",
      player.phone || "",
      player.ghin || "",
      player.handicap || "",
      player.teeSelection || "",
      player.shirtSize || "",
      data.emergencyContactName || "",
      data.emergencyContactPhone || "",
      "No",
      "",
      "",
      buildPlayerNotes(data),
      "",
      "",
      "",
      "",
      hashWithdrawalToken_(data.withdrawalToken || "")
    ]);

    sheet.getRange(
      sheet.getLastRow() + 1, 1, rows.length, PLAYER_HEADERS.length
    ).setValues(rows);

    if (data.capacityHoldId) {
      updateHoldStatus(
        holdsSheet, data.capacityHoldId, "Converted",
        data.stripeSessionId || data.registrationId
      );
    }

    if (data.waitlistId) {
      completeWaitlistRegistration_(spreadsheet, data.waitlistId, data.registrationId);
    }

    sendPlayerConfirmationOnce(data);

    return jsonResponse({
      ok: true,
      registrationId: data.registrationId,
      playersSaved: rows.length
    });
  } finally {
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }
}

/* PLAYER WITHDRAWALS / REFUNDS */

function savePlayerWithdrawal(data) {
  if (
    !data.registrationId || !data.playerNumber ||
    !data.refundId || !data.withdrawalToken
  ) {
    throw new Error("Required withdrawal information is missing.");
  }

  const stripeRefundStatus = String(data.stripeRefundStatus || "").trim().toLowerCase();

  if (stripeRefundStatus === "failed" || stripeRefundStatus === "canceled") {
    throw new Error("Stripe did not confirm an active refund.");
  }

  const playerNumber = Number(data.playerNumber);

  if (!Number.isInteger(playerNumber) || playerNumber < 1 || playerNumber > 4) {
    throw new Error("Invalid player number.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreatePlayersSheet(spreadsheet);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) throw new Error("The registration could not be found.");

    const rows = sheet.getRange(2, 1, lastRow - 1, PLAYER_HEADERS.length).getValues();
    const matchingRows = [];

    rows.forEach((row, index) => {
      if (String(row[0] || "").trim() === String(data.registrationId).trim()) {
        matchingRows.push({rowNumber: index + 2, values: row});
      }
    });

    if (matchingRows.length === 0) {
      throw new Error("The registration could not be found.");
    }

    const target = matchingRows.find(
      (entry) => Number(entry.values[5]) === playerNumber
    );

    if (!target) throw new Error("The selected golfer could not be found.");

    const storedTokenHash = String(target.values[24] || "").trim();
    const incomingTokenHash = hashWithdrawalToken_(data.withdrawalToken);

    if (!storedTokenHash || storedTokenHash !== incomingTokenHash) {
      throw new Error("The withdrawal authorization is invalid.");
    }

    const currentStatus = String(target.values[2] || "").trim().toLowerCase();
    const existingRefundId = String(target.values[23] || "").trim();

    if (currentStatus === "refunded") {
      const primaryRow = matchingRows.find((entry) => Number(entry.values[5]) === 1);
      const recipient = String(
        primaryRow ? primaryRow.values[8] : target.values[8]
      ).trim();
      const playerName = `${target.values[6] || ""} ${target.values[7] || ""}`.trim();

      sendPlayerWithdrawalConfirmationOnce_({
        registrationId: data.registrationId,
        playerNumber,
        playerName,
        recipient,
        refundId: existingRefundId || data.refundId,
        refundAmount: Number(target.values[20] || 0),
        processingFee: Number(target.values[21] || 0),
        stripeRefundStatus: data.stripeRefundStatus || ""
      });

      return jsonResponse({
        ok: true,
        duplicate: true,
        registrationId: data.registrationId,
        playerNumber,
        refundId: existingRefundId || data.refundId
      });
    }

    if (currentStatus !== "paid") {
      throw new Error("This golfer is not currently eligible for an automated refund.");
    }

    const refundAmount = Number(data.refundAmountCents || 0) / 100;
    const processingFee = Number(data.processingFeeCents || 0) / 100;
    const withdrawalDate = data.withdrawalDate ? new Date(data.withdrawalDate) : new Date();
    const existingNotes = String(target.values[19] || "").trim();

    const withdrawalNote = [
      "Withdrawn " + withdrawalDate.toISOString(),
      "Stripe Refund: " + data.refundId,
      "Refund: " + formatCurrency(refundAmount),
      "Processing fee retained: " + formatCurrency(processingFee)
    ].join(" | ");

    const updatedNotes = existingNotes
      ? existingNotes + " | " + withdrawalNote
      : withdrawalNote;

    sheet.getRange(target.rowNumber, 3).setValue("Refunded");
    sheet.getRange(target.rowNumber, 20).setValue(updatedNotes);
    sheet.getRange(target.rowNumber, 21).setValue(refundAmount);
    sheet.getRange(target.rowNumber, 22).setValue(processingFee);
    sheet.getRange(target.rowNumber, 23).setValue(withdrawalDate);
    sheet.getRange(target.rowNumber, 24).setValue(data.refundId);

    markPairingWithdrawn_(spreadsheet, data.registrationId, playerNumber, data.refundId);

    const primaryRow = matchingRows.find((entry) => Number(entry.values[5]) === 1);
    const recipient = String(
      primaryRow ? primaryRow.values[8] : target.values[8]
    ).trim();
    const playerName = `${target.values[6] || ""} ${target.values[7] || ""}`.trim();

    sendPlayerWithdrawalConfirmationOnce_({
      registrationId: data.registrationId,
      playerNumber,
      playerName,
      recipient,
      refundId: data.refundId,
      refundAmount,
      processingFee,
      stripeRefundStatus: data.stripeRefundStatus || ""
    });

    return jsonResponse({
      ok: true,
      registrationId: data.registrationId,
      playerNumber,
      refundId: data.refundId,
      refunded: true
    });
  } finally {
    lock.releaseLock();
  }
}

function markPairingWithdrawn_(spreadsheet, registrationId, playerNumber, refundId) {
  const sheet = spreadsheet.getSheetByName(PAIRINGS_SHEET_NAME);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const rows = sheet.getRange(2, 1, lastRow - 1, PAIRING_HEADERS.length).getValues();

  rows.forEach((row, index) => {
    if (
      String(row[3] || "").trim() === String(registrationId).trim() &&
      Number(row[4]) === Number(playerNumber)
    ) {
      sheet.getRange(index + 2, 11).setValue("Withdrawn");
      const existingNotes = String(row[11] || "").trim();
      const note = "Refunded — " + refundId;

      sheet.getRange(index + 2, 12).setValue(
        existingNotes ? existingNotes + " | " + note : note
      );
    }
  });
}

/* PUBLIC APPROVED SPONSORS */

function getApprovedSponsors() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SPONSORS_SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ok: true, sponsors: []});
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 37).getValues();

  const sponsors = rows.map((row) => {
    const company = String(row[0] || "").trim();
    const sponsorshipLevel = String(row[4] || "").trim();
    const paid = String(row[6] || "").trim().toLowerCase();
    const originalWebsite = String(row[8] || "").trim();
    const sponsorId = String(row[11] || "").trim();
    const publicDisplayName = String(row[15] || company || "").trim();
    const fulfillmentWebsite = String(row[16] || "").trim();
    const tagline = String(row[19] || "").trim();
    const materialsStatus = String(row[21] || "").trim().toLowerCase();
    const blueFeatureAssignment = String(row[27] || "").trim();
    const normalizedLevel = normalizePublicSponsorLevel_(sponsorshipLevel);

    let website = fulfillmentWebsite || originalWebsite || "";
    website = String(website).trim();

    if (website && !/^https?:\/\/[^\s]+$/i.test(website)) website = "";

    const eligible = Boolean(
      company && publicDisplayName && paid === "yes" &&
      materialsStatus === "approved" && normalizedLevel
    );

    let logoUrl = "";

    if (
      eligible && sponsorId &&
      typeof getSponsorPublicLogoUrlBySponsorId_ === "function"
    ) {
      logoUrl = String(getSponsorPublicLogoUrlBySponsorId_(sponsorId) || "").trim();

      if (logoUrl && !/^https:\/\/drive\.google\.com\//i.test(logoUrl)) {
        logoUrl = "";
      }
    }

    return {
      eligible: eligible,
      sponsor: {
        displayName: publicDisplayName,
        level: normalizedLevel,
        levelLabel: publicSponsorLevelLabel_(normalizedLevel),
        website: website,
        tagline: tagline,
        blueFeatureAssignment: normalizedLevel === "blue" ? blueFeatureAssignment : "",
        logoUrl: logoUrl
      }
    };
  }).filter((entry) => entry.eligible).map((entry) => entry.sponsor);

  const levelOrder = {blue: 0, grey: 1, hole: 2};

  sponsors.sort((first, second) => {
    const levelDifference = levelOrder[first.level] - levelOrder[second.level];
    if (levelDifference !== 0) return levelDifference;
    return first.displayName.localeCompare(second.displayName, "en", {sensitivity: "base"});
  });

  return jsonResponse({ok: true, sponsors: sponsors});
}

function normalizePublicSponsorLevel_(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text.includes("blue")) return "blue";
  if (text.includes("grey") || text.includes("gray")) return "grey";
  if (text.includes("hole")) return "hole";
  return "";
}

function publicSponsorLevelLabel_(level) {
  if (level === "blue") return "Blue Sponsor";
  if (level === "grey") return "Grey Sponsor";
  if (level === "hole") return "Hole Sponsor";
  return "";
}

/* PAID SPONSORS */

function savePaidSponsor(data) {
  if (!data.stripeSessionId) throw new Error("Stripe Session ID is required.");
  if (!data.company) throw new Error("Sponsor company is required.");

  const packagePlayerCount = sponsorIncludedPlayerCount_(data.sponsorshipName);
  const includedPlayerCount = Number(data.includedPlayerCount || 0);

  if (![0, 4].includes(includedPlayerCount)) {
    throw new Error("Invalid included sponsor player count.");
  }

  if (includedPlayerCount > 0 && includedPlayerCount !== packagePlayerCount) {
    throw new Error("Sponsor foursome entitlement does not match the sponsorship level.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSponsorsSheet(spreadsheet);
    const holdsSheet = getOrCreateHoldsSheet(spreadsheet);

    if (includedPlayerCount > 0) {
      markSponsorCapacityReserved_(
        holdsSheet, data.capacityHoldId, data.stripeSessionId, includedPlayerCount
      );
    }

    if (sponsorAlreadyExists(sheet, data.stripeSessionId)) {
      sendSponsorConfirmationOnce(data);
      return jsonResponse({
        ok: true,
        duplicate: true,
        stripeSessionId: data.stripeSessionId,
        includedPlayerCount
      });
    }

    const notes = [];
    if (data.notes) notes.push(data.notes);
    notes.push("Stripe Session: " + data.stripeSessionId);

    if (includedPlayerCount > 0) {
      notes.push("Included Foursome: Yes");
      notes.push("4 player spots reserved");
      notes.push("Capacity Hold: " + data.capacityHoldId);
    }

    const row = new Array(SPONSOR_HEADERS.length).fill("");
    row[0] = data.company || "";
    row[1] = data.contactName || "";
    row[2] = data.email || "";
    row[3] = data.phone || "";
    row[4] = data.sponsorshipName || "";
    row[5] = Number(data.sponsorAmount || 0);
    row[6] = "Yes";
    row[7] = "No";
    row[8] = data.website || "";
    row[9] = "No";
    row[10] = notes.join(" | ");
    row[37] = "Paid";
    row[38] = 0;
    row[39] = 0;

    sheet.appendRow(row);
    sendSponsorConfirmationOnce(data);

    return jsonResponse({
      ok: true,
      sponsorSaved: true,
      stripeSessionId: data.stripeSessionId,
      includedPlayerCount
    });
  } finally {
    lock.releaseLock();
  }
}

function sponsorIncludedPlayerCount_(sponsorshipName) {
  const level = String(sponsorshipName || "").trim().toLowerCase();
  if (level.includes("grey") || level.includes("gray") || level.includes("blue")) return 4;
  return 0;
}

function markSponsorCapacityReserved_(holdsSheet, holdId, stripeSessionId, expectedPlayerCount) {
  const normalizedHoldId = String(holdId || "").trim();

  if (!normalizedHoldId) {
    throw new Error("The included sponsor foursome is missing its capacity hold.");
  }

  const lastRow = holdsSheet.getLastRow();

  if (lastRow < 2) throw new Error("The sponsor capacity hold could not be found.");

  const rows = holdsSheet.getRange(2, 1, lastRow - 1, HOLD_HEADERS.length).getValues();
  const index = rows.findIndex(
    (row) => String(row[0] || "").trim() === normalizedHoldId
  );

  if (index === -1) throw new Error("The sponsor capacity hold could not be found.");

  const rowNumber = index + 2;
  const hold = rows[index];
  const heldPlayerCount = Number(hold[3] || 0);

  if (heldPlayerCount !== Number(expectedPlayerCount)) {
    throw new Error("The sponsor capacity hold does not match the included foursome.");
  }

  const currentStatus = String(hold[4] || "").trim();
  const existingStripeSessionId = String(hold[5] || "").trim();
  const incomingStripeSessionId = String(stripeSessionId || "").trim();

  if (
    existingStripeSessionId && incomingStripeSessionId &&
    existingStripeSessionId !== incomingStripeSessionId
  ) {
    throw new Error("The sponsor capacity hold is already associated with a different payment.");
  }

  if (currentStatus === "Sponsor Reserved" || currentStatus === "Converted") {
    if (!existingStripeSessionId && incomingStripeSessionId) {
      holdsSheet.getRange(rowNumber, 6).setValue(incomingStripeSessionId);
    }
    return;
  }

  if (currentStatus !== "Active") {
    throw new Error("The sponsor capacity hold is no longer active.");
  }

  holdsSheet.getRange(rowNumber, 5).setValue("Sponsor Reserved");

  if (incomingStripeSessionId) {
    holdsSheet.getRange(rowNumber, 6).setValue(incomingStripeSessionId);
  }
}

/* SPONSOR REFUNDS */

function saveSponsorRefund(data) {
  requireSponsorCapacityInternalKey_(data);

  if (!data.stripeSessionId || !data.refundId) {
    throw new Error("Sponsor refund information is incomplete.");
  }

  assertStripeRefundActive_(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sponsorSheet = getOrCreateSponsorsSheet(spreadsheet);
    const sponsorRow = findSponsorRowByStripeSession_(sponsorSheet, data.stripeSessionId);

    if (!sponsorRow) throw new Error("The sponsor payment could not be found.");

    const existingRefundId = String(
      sponsorSheet.getRange(sponsorRow, 42).getValue() || ""
    ).trim();

    if (existingRefundId && existingRefundId === String(data.refundId).trim()) {
      const capacityResult = refundSponsorCapacityHold_(
        spreadsheet, data.stripeSessionId, existingRefundId
      );

      return jsonResponse({
        ok: true,
        duplicate: true,
        refunded: true,
        stripeSessionId: data.stripeSessionId,
        refundId: existingRefundId,
        capacityReleased: capacityResult.capacityReleased,
        capacityPlayerCount: capacityResult.playerCount,
        convertedRosterNeedsRemoval: capacityResult.convertedRosterNeedsRemoval,
        convertedRosterRemoved: capacityResult.convertedRosterRemoved || false,
        convertedRosterPlayerCount: capacityResult.convertedRosterPlayerCount || 0
      });
    }

    const refundAmount = Number(data.refundAmountCents || 0) / 100;
    const processingFee = Number(data.processingFeeCents || 0) / 100;
    const refundDate = data.refundDate ? new Date(data.refundDate) : new Date();

    sponsorSheet.getRange(sponsorRow, 7).setValue("No");
    sponsorSheet.getRange(sponsorRow, 31, 1, 6).setValues([[
      "Removed — Refunded", "Removed — Refunded", "Removed — Refunded",
      "Removed — Refunded", "Removed — Refunded", "No"
    ]]);
    sponsorSheet.getRange(sponsorRow, 38, 1, 5).setValues([[
      "Refunded", refundAmount, processingFee, refundDate, data.refundId
    ]]);

    const refundNote = [
      "Refunded " + refundDate.toISOString(),
      "Stripe Refund: " + data.refundId,
      "Refund: " + formatCurrency(refundAmount),
      "Processing fee retained: " + formatCurrency(processingFee)
    ].join(" | ");

    appendCellText_(sponsorSheet, sponsorRow, 11, refundNote);
    appendCellText_(sponsorSheet, sponsorRow, 37, refundNote);

    const capacityResult = refundSponsorCapacityHold_(
      spreadsheet, data.stripeSessionId, data.refundId
    );

    return jsonResponse({
      ok: true,
      refunded: true,
      stripeSessionId: data.stripeSessionId,
      refundId: data.refundId,
      refundAmount,
      processingFeeRetained: processingFee,
      capacityReleased: capacityResult.capacityReleased,
      capacityPlayerCount: capacityResult.playerCount,
      convertedRosterNeedsRemoval: capacityResult.convertedRosterNeedsRemoval,
      convertedRosterRemoved: capacityResult.convertedRosterRemoved || false,
      convertedRosterPlayerCount: capacityResult.convertedRosterPlayerCount || 0
    });
  } finally {
    lock.releaseLock();
  }
}

function findSponsorRowByStripeSession_(sheet, stripeSessionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const target = String(stripeSessionId || "").trim();
  const notes = sheet.getRange(2, 11, lastRow - 1, 1).getValues().flat();
  const index = notes.findIndex((note) => String(note).includes(target));
  return index === -1 ? 0 : index + 2;
}

function refundSponsorCapacityHold_(spreadsheet, stripeSessionId, refundId) {
  const holdsSheet = getOrCreateHoldsSheet(spreadsheet);
  const lastRow = holdsSheet.getLastRow();

  if (lastRow < 2) {
    return {
      capacityReleased: false, playerCount: 0,
      convertedRosterNeedsRemoval: false, convertedRosterRemoved: false,
      convertedRosterPlayerCount: 0
    };
  }

  const rows = holdsSheet.getRange(2, 1, lastRow - 1, HOLD_HEADERS.length).getValues();
  const target = String(stripeSessionId || "").trim();
  const index = rows.findIndex((row) => String(row[5] || "").trim() === target);

  if (index === -1) {
    return {
      capacityReleased: false, playerCount: 0,
      convertedRosterNeedsRemoval: false, convertedRosterRemoved: false,
      convertedRosterPlayerCount: 0
    };
  }

  const rowNumber = index + 2;
  const previousStatus = String(rows[index][4] || "").trim();
  const playerCount = Number(rows[index][3] || 0);

  let convertedRosterResult = {matchedPlayerCount: 0, newlyWithdrawnCount: 0};

  if (previousStatus === "Converted") {
    convertedRosterResult = withdrawConvertedSponsorGolfers_(
      spreadsheet, target, refundId, playerCount
    );
  }

  holdsSheet.getRange(rowNumber, 5).setValue("Refunded");

  const convertedRosterRemoved = previousStatus === "Converted" &&
    convertedRosterResult.matchedPlayerCount === playerCount;

  return {
    capacityReleased:
      previousStatus === "Sponsor Reserved" ||
      previousStatus === "Active" ||
      convertedRosterRemoved,
    playerCount,
    convertedRosterNeedsRemoval: false,
    convertedRosterRemoved,
    convertedRosterPlayerCount: convertedRosterResult.matchedPlayerCount,
    previousStatus,
    refundId
  };
}

function withdrawConvertedSponsorGolfers_(
  spreadsheet, stripeSessionId, refundId, expectedPlayerCount
) {
  const playersSheet = getOrCreatePlayersSheet(spreadsheet);
  const lastRow = playersSheet.getLastRow();

  if (lastRow < 2) {
    throw new Error("The sponsor roster is marked Converted, but no player rows exist.");
  }

  const rows = playersSheet.getRange(2, 1, lastRow - 1, PLAYER_HEADERS.length).getValues();
  const target = String(stripeSessionId || "").trim();
  const matches = [];

  rows.forEach((row, index) => {
    if (String(row[0] || "").trim() === target) {
      matches.push({row, rowNumber: index + 2});
    }
  });

  const expected = Number(expectedPlayerCount || 0);

  if (expected <= 0 || matches.length !== expected) {
    throw new Error(
      "The sponsor roster is marked Converted, but its player rows could not be matched safely by Stripe Session ID."
    );
  }

  let newlyWithdrawnCount = 0;

  matches.forEach((match) => {
    const row = match.row;
    const rowNumber = match.rowNumber;
    const currentStatus = String(row[2] || "").trim();
    const existingRefundId = String(row[23] || "").trim();

    if (existingRefundId && existingRefundId !== String(refundId).trim()) {
      throw new Error(
        "A sponsor-funded golfer already has a different refund record and requires manual review."
      );
    }

    const alreadyInactive = currentStatus === "Sponsor Refunded" ||
      currentStatus === "Refunded" || currentStatus === "Withdrawn";

    if (currentStatus !== "Paid" && !alreadyInactive) {
      throw new Error(
        "A sponsor-funded golfer has an unexpected player status and requires manual review."
      );
    }

    if (!alreadyInactive) {
      playersSheet.getRange(rowNumber, 3).setValue("Sponsor Refunded");
      newlyWithdrawnCount++;
    }

    const existingNotes = String(
      playersSheet.getRange(rowNumber, 20).getValue() || ""
    ).trim();
    const refundMarker = "Sponsor Stripe Refund: " + refundId;

    if (!existingNotes.includes(refundMarker)) {
      appendCellText_(playersSheet, rowNumber, 20, [
        "Sponsor payment refunded " + new Date().toISOString(),
        refundMarker,
        "No player-level payment was charged"
      ].join(" | "));
    }

    if (!existingRefundId) {
      playersSheet.getRange(rowNumber, 23).setValue(new Date());
      playersSheet.getRange(rowNumber, 24).setValue(refundId);
    }

    markSponsorPairingWithdrawn_(spreadsheet, target, Number(row[5]), refundId);
  });

  return {matchedPlayerCount: matches.length, newlyWithdrawnCount};
}

function markSponsorPairingWithdrawn_(
  spreadsheet, registrationId, playerNumber, refundId
) {
  const sheet = spreadsheet.getSheetByName(PAIRINGS_SHEET_NAME);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const rows = sheet.getRange(2, 1, lastRow - 1, PAIRING_HEADERS.length).getValues();

  rows.forEach((row, index) => {
    if (
      String(row[3] || "").trim() === String(registrationId || "").trim() &&
      Number(row[4]) === Number(playerNumber)
    ) {
      const rowNumber = index + 2;

      if (String(row[10] || "").trim() !== "Withdrawn") {
        sheet.getRange(rowNumber, 11).setValue("Withdrawn");
      }

      const existingNotes = String(
        sheet.getRange(rowNumber, 12).getValue() || ""
      ).trim();
      const note = "Sponsor refunded — " + refundId;

      if (!existingNotes.includes(note)) {
        appendCellText_(sheet, rowNumber, 12, note);
      }
    }
  });
}

/* PAID DONATIONS */

function savePaidDonation(data) {
  if (!data.stripeSessionId) throw new Error("Stripe Session ID is required.");
  if (!data.donorName || !data.email) throw new Error("Donor information is required.");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateDonationsSheet(spreadsheet);
    const existingRow = findDonationRowByStripeSession_(sheet, data.stripeSessionId);

    if (existingRow) {
      const thankYouStatus = sendDonationConfirmationOnce(data);

      if (thankYouStatus) {
        sheet.getRange(existingRow, 17).setValue(thankYouStatus);
      }

      return jsonResponse({
        ok: true, duplicate: true, stripeSessionId: data.stripeSessionId
      });
    }

    const anonymous = normalizeTournamentYesNo_(data.anonymous);
    const publicRecognition = publicRecognitionAllowed_(data.publicRecognition, anonymous);
    const registeredPlayer = normalizeTournamentYesNo_(data.registeredPlayer);
    const notes = [];

    if (data.notes) notes.push(data.notes);
    notes.push("Stripe Session: " + data.stripeSessionId);

    const row = [
      data.donorName || "",
      data.email || "",
      Number(data.donationAmount || 0),
      new Date(),
      anonymous,
      notes.join(" | "),
      data.phone || "",
      registeredPlayer,
      publicRecognition,
      publicRecognition === "Yes" ? String(data.publicRecognitionName || "").trim() : "",
      "Paid",
      data.stripeSessionId,
      0,
      0,
      "",
      "",
      "Pending"
    ];

    sheet.appendRow(row);

    const rowNumber = sheet.getLastRow();
    const thankYouStatus = sendDonationConfirmationOnce(data);
    sheet.getRange(rowNumber, 17).setValue(thankYouStatus || "Not Sent");

    return jsonResponse({
      ok: true,
      donationSaved: true,
      stripeSessionId: data.stripeSessionId,
      thankYouStatus: thankYouStatus || "Not Sent"
    });
  } finally {
    lock.releaseLock();
  }
}

/* DONATION REFUNDS - ADMIN ONLY */

function saveDonationRefund(data) {
  requireSponsorCapacityInternalKey_(data);

  if (!data.stripeSessionId || !data.refundId) {
    throw new Error("Donation refund information is incomplete.");
  }

  assertStripeRefundActive_(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateDonationsSheet(spreadsheet);
    const rowNumber = findDonationRowByStripeSession_(sheet, data.stripeSessionId);

    if (!rowNumber) throw new Error("The donation payment could not be found.");

    const existingRefundId = String(sheet.getRange(rowNumber, 16).getValue() || "").trim();

    if (existingRefundId && existingRefundId === String(data.refundId).trim()) {
      return jsonResponse({
        ok: true, duplicate: true, refunded: true, refundId: existingRefundId
      });
    }

    const refundAmount = Number(data.refundAmountCents || 0) / 100;
    const processingFee = Number(data.processingFeeCents || 0) / 100;
    const refundDate = data.refundDate ? new Date(data.refundDate) : new Date();

    sheet.getRange(rowNumber, 11, 1, 6).setValues([[
      "Refunded", data.stripeSessionId, refundAmount,
      processingFee, refundDate, data.refundId
    ]]);

    appendCellText_(sheet, rowNumber, 6, [
      "Refunded " + refundDate.toISOString(),
      "Stripe Refund: " + data.refundId,
      "Refund: " + formatCurrency(refundAmount),
      "Processing fee retained: " + formatCurrency(processingFee)
    ].join(" | "));

    return jsonResponse({
      ok: true,
      refunded: true,
      stripeSessionId: data.stripeSessionId,
      refundId: data.refundId,
      refundAmount,
      processingFeeRetained: processingFee
    });
  } finally {
    lock.releaseLock();
  }
}

function findDonationRowByStripeSession_(sheet, stripeSessionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const target = String(stripeSessionId || "").trim();
  if (!target) return 0;

  if (sheet.getMaxColumns() >= 12) {
    const sessionIds = sheet.getRange(2, 12, lastRow - 1, 1).getValues().flat();
    const currentIndex = sessionIds.findIndex((value) => String(value).trim() === target);
    if (currentIndex !== -1) return currentIndex + 2;
  }

  const notes = sheet.getRange(2, 6, lastRow - 1, 1).getValues().flat();
  const legacyIndex = notes.findIndex((note) => String(note).includes(target));
  return legacyIndex === -1 ? 0 : legacyIndex + 2;
}

/* IN-KIND CONTRIBUTIONS */

function createInKindDonation(data) {
  const metadata = normalizeInKindDonationData_(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = requireInKindSheet_(spreadsheet);
    const submissionId = allocateInKindSubmissionId_(sheet);
    const submittedAt = new Date();

    sheet.appendRow([
      submissionId,
      submittedAt,
      sheetSafeInKindText_(metadata.donorBusiness),
      sheetSafeInKindText_(metadata.contactName),
      sheetSafeInKindText_(metadata.email),
      sheetSafeInKindText_(metadata.phone),
      sheetSafeInKindText_(metadata.contributionType),
      sheetSafeInKindText_(metadata.contributionTypeWriteIn),
      sheetSafeInKindText_(metadata.intendedUse),
      sheetSafeInKindText_(metadata.intendedUseWriteIn),
      sheetSafeInKindText_(metadata.itemServiceName),
      sheetSafeInKindText_(metadata.description),
      metadata.estimatedRetailValue,
      metadata.quantity,
      sheetSafeInKindText_(metadata.restrictionsExpiration),
      sheetSafeInKindText_(metadata.redemptionInstructions),
      sheetSafeInKindText_(metadata.websiteSocial),
      "",
      sheetSafeInKindText_(metadata.dropOffPickupPlan),
      metadata.publicRecognition,
      sheetSafeInKindText_(metadata.publicRecognitionName),
      "Submitted",
      "",
      "",
      "",
      "",
      "",
      "No Attachments",
      sheetSafeInKindText_(metadata.notes)
    ]);

    return jsonResponse({ok: true, submissionId});
  } finally {
    lock.releaseLock();
  }
}

function uploadInKindDonationFile(data) {
  const submissionId = requireInKindSubmissionId_(data && data.submissionId);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = requireInKindSheet_(spreadsheet);
    const rowNumber = findInKindSubmissionRow_(sheet, submissionId);

    if (!rowNumber) {
      throw new Error("The in-kind contribution submission could not be found.");
    }

    const existingLinks = cleanInKindText_(
      sheet.getRange(rowNumber, 18).getDisplayValue(), 20000
    );
    const existingFileCount = existingLinks
      ? existingLinks.split(/\r?\n/).filter(Boolean).length
      : 0;

    if (existingFileCount >= IN_KIND_MAX_FILES) {
      throw new Error("A maximum of 3 supporting files may be uploaded.");
    }

    const fileName = sanitizeInKindFileName_(data && data.fileName);
    const mimeType = cleanInKindText_(data && data.mimeType, 200);
    const base64Data = String((data && data.base64Data) || "");

    if (IN_KIND_ALLOWED_MIME_TYPES.indexOf(mimeType) === -1) {
      throw new Error("Unsupported supporting file type.");
    }

    const extension = getInKindFileExtension_(fileName);

    if (IN_KIND_ALLOWED_EXTENSIONS.indexOf(extension) === -1) {
      throw new Error("Unsupported supporting file type.");
    }

    if (!base64Data) throw new Error("The supporting file is empty.");

    let bytes;

    try {
      bytes = Utilities.base64Decode(base64Data);
    } catch (error) {
      throw new Error("The supporting file could not be decoded.");
    }

    if (bytes.length > IN_KIND_MAX_FILE_BYTES) {
      throw new Error("Each supporting file must be 4 MB or smaller.");
    }

    const donorBusiness = cleanInKindText_(
      sheet.getRange(rowNumber, 3).getDisplayValue(), 200
    );
    const contributionFolder = getOrCreateInKindSubmissionFolder_(
      submissionId, donorBusiness
    );

    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const file = contributionFolder.createFile(blob);
    const fileUrl = file.getUrl();

    appendInKindCellText_(sheet, rowNumber, 18, fileUrl);

    const currentAttachmentStatus = cleanInKindText_(
      sheet.getRange(rowNumber, 28).getDisplayValue(), 200
    );

    if (currentAttachmentStatus !== "Attachment Upload Issue") {
      sheet.getRange(rowNumber, 28).setValue("Complete");
    }

    return jsonResponse({ok: true, submissionId, fileUrl});
  } catch (error) {
    markInKindAttachmentIssue_(submissionId);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function finalizeInKindDonation(data) {
  const submissionId = requireInKindSubmissionId_(data && data.submissionId);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = requireInKindSheet_(spreadsheet);
  const rowNumber = findInKindSubmissionRow_(sheet, submissionId);

  if (!rowNumber) {
    throw new Error("The in-kind contribution submission could not be found.");
  }

  if (data && data.attachmentIssue === true) {
    sheet.getRange(rowNumber, 28).setValue("Attachment Upload Issue");
  }

  const row = sheet.getRange(rowNumber, 1, 1, IN_KIND_HEADERS.length).getDisplayValues()[0];
  const email = cleanInKindText_(row[4], 320);
  let notificationStatus = cleanInKindText_(row[26], 5000);

  if (notificationStatus.indexOf("Submitted confirmation sent") === -1) {
    try {
      sendInKindSubmittedConfirmation_(row);
      notificationStatus = appendInKindStatusText_(
        notificationStatus, "Submitted confirmation sent"
      );
    } catch (error) {
      notificationStatus = appendInKindStatusText_(
        notificationStatus,
        "Submitted confirmation failed: " + inKindErrorMessage_(error)
      );
    }
  }

  if (notificationStatus.indexOf("Admin alert sent") === -1) {
    try {
      sendInKindAdminAlert_(row);
      notificationStatus = appendInKindStatusText_(notificationStatus, "Admin alert sent");
    } catch (error) {
      notificationStatus = appendInKindStatusText_(
        notificationStatus, "Admin alert failed: " + inKindErrorMessage_(error)
      );
    }
  }

  sheet.getRange(rowNumber, 27).setValue(notificationStatus);
  return jsonResponse({ok: true, submissionId, donorEmail: email});
}

function handleInKindDonationStatusEdit(e) {
  if (!e || !e.range) return;

  const range = e.range;
  const sheet = range.getSheet();

  if (sheet.getName() !== IN_KIND_SHEET_NAME) return;

  if (
    range.getRow() <= 1 ||
    range.getNumRows() !== 1 ||
    range.getNumColumns() !== 1
  ) {
    return;
  }

  const statusColumn = getInKindHeaderColumn_(sheet, "Status");
  if (range.getColumn() !== statusColumn) return;

  const oldStatus = cleanInKindText_(e.oldValue, 100);
  const newStatus = cleanInKindText_(e.value, 100);

  if (!newStatus || oldStatus === newStatus) return;
  if (IN_KIND_STATUSES.indexOf(newStatus) === -1) return;

  const rowNumber = range.getRow();
  const reviewerColumn = getInKindHeaderColumn_(sheet, "Reviewer");
  const reviewDateColumn = getInKindHeaderColumn_(sheet, "Review Date");
  const decisionDateColumn = getInKindHeaderColumn_(sheet, "Accepted / Declined Date");
  const receivedDateColumn = getInKindHeaderColumn_(sheet, "Received Date");
  const notificationColumn = getInKindHeaderColumn_(sheet, "Donor Notification Status");

  if (newStatus === "Under Review") {
    setInKindReviewerIfBlank_(sheet, rowNumber, reviewerColumn);
    setInKindDateIfBlank_(sheet, rowNumber, reviewDateColumn);
    return;
  }

  if (newStatus === "Accepted" || newStatus === "Declined") {
    setInKindReviewerIfBlank_(sheet, rowNumber, reviewerColumn);
    setInKindDateIfBlank_(sheet, rowNumber, reviewDateColumn);
    setInKindDateIfBlank_(sheet, rowNumber, decisionDateColumn);

    const marker = newStatus === "Accepted" ? "Accepted email sent" : "Declined email sent";
    const failurePrefix = newStatus === "Accepted"
      ? "Accepted email failed: "
      : "Declined email failed: ";

    let notificationStatus = cleanInKindText_(
      sheet.getRange(rowNumber, notificationColumn).getDisplayValue(), 5000
    );

    if (notificationStatus.indexOf(marker) !== -1) return;

    const row = sheet.getRange(
      rowNumber, 1, 1, IN_KIND_HEADERS.length
    ).getDisplayValues()[0];

    try {
      if (newStatus === "Accepted") {
        sendInKindAcceptedEmail_(row);
      } else {
        sendInKindDeclinedEmail_(row);
      }
      notificationStatus = appendInKindStatusText_(notificationStatus, marker);
    } catch (error) {
      notificationStatus = appendInKindStatusText_(
        notificationStatus, failurePrefix + inKindErrorMessage_(error)
      );
    }

    sheet.getRange(rowNumber, notificationColumn).setValue(notificationStatus);
    return;
  }

  if (newStatus === "Received") {
    setInKindDateIfBlank_(sheet, rowNumber, receivedDateColumn);
  }
}

function setupInKindDonations() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  let sheet = null;

  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === IN_KIND_SOURCE_SHEET_ID) {
      sheet = sheets[i];
      break;
    }
  }

  if (!sheet) {
    throw new Error("The existing Silent Auction Donations sheet could not be found.");
  }

  if (sheet.getName() !== IN_KIND_SHEET_NAME) sheet.setName(IN_KIND_SHEET_NAME);

  if (sheet.getMaxColumns() < IN_KIND_HEADERS.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(), IN_KIND_HEADERS.length - sheet.getMaxColumns()
    );
  }

  if (sheet.getMaxRows() < 2) sheet.insertRowsAfter(1, 1);

  sheet.getRange(1, 1, 1, IN_KIND_HEADERS.length).setValues([IN_KIND_HEADERS]);
  sheet.setFrozenRows(1);

  const dataRowCount = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 13, dataRowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(2, 2, dataRowCount, 1).setNumberFormat("m/d/yyyy h:mm am/pm");
  sheet.getRange(2, 24, dataRowCount, 3).setNumberFormat("m/d/yyyy h:mm am/pm");

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(IN_KIND_STATUSES, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, 22, dataRowCount, 1).setDataValidation(statusRule);

  const recognitionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Yes", "No"], true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, 20, dataRowCount, 1).setDataValidation(recognitionRule);
  DriveApp.getFolderById(IN_KIND_FOLDER_ID).setName(IN_KIND_FOLDER_NAME);

  return {ok: true, sheetName: sheet.getName(), folderName: IN_KIND_FOLDER_NAME};
}

function installInKindDonationStatusTrigger() {
  const handlerName = "handleInKindDonationStatusEdit";
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === handlerName) ScriptApp.deleteTrigger(trigger);
  });

  ScriptApp.newTrigger(handlerName)
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  return {ok: true, handler: handlerName};
}

function normalizeInKindDonationData_(data) {
  data = data || {};

  const donorBusiness = cleanInKindText_(data.donorBusiness, 200);
  const contactName = cleanInKindText_(data.contactName, 200);
  const email = cleanInKindText_(data.email, 320);
  const phone = cleanInKindText_(data.phone, 100);
  const contributionType = cleanInKindText_(data.contributionType, 200);
  const contributionTypeWriteIn = cleanInKindText_(data.contributionTypeWriteIn, 500);
  const intendedUse = cleanInKindText_(data.intendedUse, 200);
  const intendedUseWriteIn = cleanInKindText_(data.intendedUseWriteIn, 500);
  const itemServiceName = cleanInKindText_(data.itemServiceName, 300);
  const description = cleanInKindText_(data.description, 5000);
  const estimatedRetailValue = Number(data.estimatedRetailValue);
  const quantity = Number(data.quantity);
  const publicRecognition = cleanInKindText_(data.publicRecognition, 20) === "Yes"
    ? "Yes" : "No";

  let publicRecognitionName = cleanInKindText_(data.publicRecognitionName, 300);

  if (
    !donorBusiness || !contactName || !email ||
    !phone || !itemServiceName || !description
  ) {
    throw new Error("Required in-kind donor or contribution information is missing.");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("A valid donor email address is required.");
  }

  if (IN_KIND_CONTRIBUTION_TYPES.indexOf(contributionType) === -1) {
    throw new Error("The contribution type is invalid.");
  }

  if (contributionType === "Other — Write In" && !contributionTypeWriteIn) {
    throw new Error("A contribution type write-in is required.");
  }

  if (IN_KIND_INTENDED_USES.indexOf(intendedUse) === -1) {
    throw new Error("The intended use is invalid.");
  }

  if (intendedUse === "Other — Write In" && !intendedUseWriteIn) {
    throw new Error("An intended-use write-in is required.");
  }

  if (!isFinite(estimatedRetailValue) || estimatedRetailValue <= 0) {
    throw new Error("Estimated retail value must be greater than zero.");
  }

  if (!isFinite(quantity) || quantity < 1 || Math.floor(quantity) !== quantity) {
    throw new Error("Quantity must be a whole number of at least one.");
  }

  if (publicRecognition === "Yes" && !publicRecognitionName) {
    publicRecognitionName = donorBusiness;
  }

  if (publicRecognition === "No") publicRecognitionName = "";

  return {
    donorBusiness,
    contactName,
    email,
    phone,
    contributionType,
    contributionTypeWriteIn,
    intendedUse,
    intendedUseWriteIn,
    itemServiceName,
    description,
    estimatedRetailValue,
    quantity,
    restrictionsExpiration: cleanInKindText_(data.restrictionsExpiration, 2000),
    redemptionInstructions: cleanInKindText_(data.redemptionInstructions, 3000),
    websiteSocial: cleanInKindText_(data.websiteSocial, 1000),
    dropOffPickupPlan: cleanInKindText_(data.dropOffPickupPlan, 2000),
    publicRecognition,
    publicRecognitionName,
    notes: cleanInKindText_(data.notes, 5000)
  };
}

function requireInKindSheet_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(IN_KIND_SHEET_NAME);

  if (!sheet) {
    throw new Error(
      "The In-Kind Donations sheet is not configured. Run setupInKindDonations first."
    );
  }

  return sheet;
}

function allocateInKindSubmissionId_(sheet) {
  const lastRow = sheet.getLastRow();
  let maxSequence = 0;

  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();

    values.forEach(function (row) {
      const match = String(row[0] || "").match(/^IK-2026-(\d+)$/);
      if (match) maxSequence = Math.max(maxSequence, Number(match[1]) || 0);
    });
  }

  return "IK-2026-" + String(maxSequence + 1).padStart(4, "0");
}

function requireInKindSubmissionId_(value) {
  const submissionId = cleanInKindText_(value, 100);

  if (!/^IK-2026-\d{4,}$/.test(submissionId)) {
    throw new Error("Invalid in-kind contribution submission ID.");
  }

  return submissionId;
}

function findInKindSubmissionRow_(sheet, submissionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === submissionId) return i + 2;
  }

  return 0;
}

function getInKindHeaderColumn_(sheet, headerName) {
  const headers = sheet.getRange(1, 1, 1, IN_KIND_HEADERS.length).getDisplayValues()[0];
  const index = headers.indexOf(headerName);

  if (index === -1) throw new Error("Missing In-Kind Donations column: " + headerName);

  return index + 1;
}

function getOrCreateInKindSubmissionFolder_(submissionId, donorBusiness) {
  const root = DriveApp.getFolderById(IN_KIND_FOLDER_ID);
  const safeDonor = sanitizeInKindDriveName_(donorBusiness || "Donor");
  const folderName = (submissionId + " - " + safeDonor).slice(0, 180);
  const existing = root.getFoldersByName(folderName);
  if (existing.hasNext()) return existing.next();
  return root.createFolder(folderName);
}

function markInKindAttachmentIssue_(submissionId) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(IN_KIND_SHEET_NAME);
    if (!sheet) return;

    const rowNumber = findInKindSubmissionRow_(sheet, submissionId);
    if (rowNumber) sheet.getRange(rowNumber, 28).setValue("Attachment Upload Issue");
  } catch (ignored) {
    console.error("Unable to mark in-kind attachment issue", ignored);
  }
}

function sendInKindSubmittedConfirmation_(row) {
  const submissionId = cleanInKindText_(row[0], 100);
  const donorBusiness = cleanInKindText_(row[2], 200);
  const email = cleanInKindText_(row[4], 320);
  const itemName = cleanInKindText_(row[10], 300);

  if (!email) throw new Error("Donor email is missing.");

  const subject = "CSM Chad Miller Memorial — Contribution Submitted for Review";
  const body = [
    "Thank you for offering to support the CSM Chad Miller Memorial Golf Tournament.",
    "",
    "Your contribution has been submitted for review. Submission does not constitute acceptance.",
    "The tournament team will contact you after review regarding acceptance and delivery or fulfillment.",
    "",
    "Submission ID: " + submissionId,
    "Donor / Business: " + donorBusiness,
    "Proposed Contribution: " + itemName,
    "",
    "Please keep your submission ID for reference.",
    "",
    EVENT_DATE,
    EVENT_LOCATION,
    "",
    "CSM Chad Miller Memorial Golf Tournament"
  ].join("\n");

  MailApp.sendEmail(email, subject, body, {name: EMAIL_SENDER_NAME});
}

function sendInKindAdminAlert_(row) {
  const attachmentStatus = cleanInKindText_(row[27], 300);

  const body = [
    "A new in-kind contribution has been submitted for review.",
    "",
    "Submission ID: " + cleanInKindText_(row[0], 100),
    "Donor / Business: " + cleanInKindText_(row[2], 200),
    "Contact Name: " + cleanInKindText_(row[3], 200),
    "Email: " + cleanInKindText_(row[4], 320),
    "Phone: " + cleanInKindText_(row[5], 100),
    "Contribution Type: " + inKindDisplayChoice_(row[6], row[7]),
    "Intended Use: " + inKindDisplayChoice_(row[8], row[9]),
    "Item / Service: " + cleanInKindText_(row[10], 300),
    "Description: " + cleanInKindText_(row[11], 5000),
    "Estimated Retail Value: " + cleanInKindText_(row[12], 100),
    "Quantity: " + cleanInKindText_(row[13], 100),
    "Restrictions / Expiration: " + cleanInKindText_(row[14], 2000),
    "Redemption Instructions: " + cleanInKindText_(row[15], 3000),
    "Website / Social: " + cleanInKindText_(row[16], 1000),
    "File Links: " + cleanInKindText_(row[17], 5000),
    "Drop-Off / Pickup Plan: " + cleanInKindText_(row[18], 2000),
    "Public Recognition: " + cleanInKindText_(row[19], 20),
    "Recognition Name: " + cleanInKindText_(row[20], 300),
    "Attachment Status: " + attachmentStatus,
    "Notes: " + cleanInKindText_(row[28], 5000),
    "",
    "Review and update the Status in the In-Kind Donations tab of the tournament management workbook."
  ].join("\n");

  MailApp.sendEmail(
    IN_KIND_ADMIN_EMAIL,
    "CSM Chad Miller Memorial — New In-Kind Contribution " + cleanInKindText_(row[0], 100),
    body,
    {name: EMAIL_SENDER_NAME}
  );
}

function sendInKindAcceptedEmail_(row) {
  const email = cleanInKindText_(row[4], 320);
  if (!email) throw new Error("Donor email is missing.");

  const body = [
    "Thank you for supporting the CSM Chad Miller Memorial Golf Tournament.",
    "",
    "We are pleased to confirm that your proposed contribution has been accepted.",
    "",
    "Submission ID: " + cleanInKindText_(row[0], 100),
    "Contribution: " + cleanInKindText_(row[10], 300),
    "",
    "The tournament team may follow up with you regarding delivery, pickup, redemption, or fulfillment details.",
    "",
    EVENT_DATE,
    EVENT_LOCATION,
    "",
    "CSM Chad Miller Memorial Golf Tournament"
  ].join("\n");

  MailApp.sendEmail(
    email,
    "CSM Chad Miller Memorial — In-Kind Contribution Accepted",
    body,
    {name: EMAIL_SENDER_NAME}
  );
}

function sendInKindDeclinedEmail_(row) {
  const email = cleanInKindText_(row[4], 320);
  if (!email) throw new Error("Donor email is missing.");

  const body = [
    "Thank you for offering to support the CSM Chad Miller Memorial Golf Tournament.",
    "",
    "After review, we are unable to accept the proposed contribution at this time.",
    "We sincerely appreciate your willingness to support the memorial and The Honor Foundation.",
    "",
    "Submission ID: " + cleanInKindText_(row[0], 100),
    "Contribution: " + cleanInKindText_(row[10], 300),
    "",
    "CSM Chad Miller Memorial Golf Tournament"
  ].join("\n");

  MailApp.sendEmail(
    email,
    "CSM Chad Miller Memorial — In-Kind Contribution Review",
    body,
    {name: EMAIL_SENDER_NAME}
  );
}

function setInKindReviewerIfBlank_(sheet, rowNumber, columnNumber) {
  const cell = sheet.getRange(rowNumber, columnNumber);
  if (cleanInKindText_(cell.getDisplayValue(), 320)) return;

  let reviewer = "Tournament Admin";

  try {
    reviewer = Session.getActiveUser().getEmail() || reviewer;
  } catch (ignored) {
  }

  cell.setValue(reviewer);
}

function setInKindDateIfBlank_(sheet, rowNumber, columnNumber) {
  const cell = sheet.getRange(rowNumber, columnNumber);
  if (!cell.getValue()) cell.setValue(new Date());
}

function appendInKindCellText_(sheet, rowNumber, columnNumber, value) {
  const cell = sheet.getRange(rowNumber, columnNumber);
  const existing = cleanInKindText_(cell.getDisplayValue(), 20000);
  const nextValue = cleanInKindText_(value, 10000);

  if (!nextValue || existing.indexOf(nextValue) !== -1) return;

  cell.setValue(existing ? existing + "\n" + nextValue : nextValue);
}

function appendInKindStatusText_(existing, value) {
  const current = cleanInKindText_(existing, 5000);
  const addition = cleanInKindText_(value, 1000);
  if (!addition || current.indexOf(addition) !== -1) return current;
  return current ? current + " | " + addition : addition;
}

function inKindDisplayChoice_(preset, writeIn) {
  const presetValue = cleanInKindText_(preset, 300);
  const writeInValue = cleanInKindText_(writeIn, 500);
  if (presetValue === "Other — Write In" && writeInValue) return writeInValue;
  return presetValue;
}

function cleanInKindText_(value, maxLength) {
  const text = String(value == null ? "" : value).trim();
  const limit = Number(maxLength) || 1000;
  return text.slice(0, limit);
}

function sheetSafeInKindText_(value) {
  const text = cleanInKindText_(value, 10000);
  if (/^[=+\-@]/.test(text)) return "'" + text;
  return text;
}

function sanitizeInKindDriveName_(value) {
  const text = cleanInKindText_(value, 120)
    .replace(/[\\/:*?"<>|\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || "Donor";
}

function sanitizeInKindFileName_(value) {
  const text = cleanInKindText_(value, 180).replace(/[\\/\r\n]+/g, "_").trim();

  if (!text || text === "." || text === "..") {
    throw new Error("Invalid supporting file name.");
  }

  return text;
}

function getInKindFileExtension_(fileName) {
  const parts = String(fileName || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function inKindErrorMessage_(error) {
  const message = error && error.message ? error.message : String(error || "Unknown error");
  return cleanInKindText_(message, 500);
}

/* SHARED REVENUE HELPERS */

function normalizeTournamentYesNo_(value) {
  if (value === true) return "Yes";
  const text = String(value || "").trim().toLowerCase();
  return ["yes", "y", "true", "1", "on"].includes(text) ? "Yes" : "No";
}

function publicRecognitionAllowed_(requested, anonymous) {
  if (normalizeTournamentYesNo_(anonymous) === "Yes") return "No";
  return normalizeTournamentYesNo_(requested);
}

function assertStripeRefundActive_(data) {
  const status = String(data.stripeRefundStatus || "").trim().toLowerCase();

  if (status === "failed" || status === "canceled" || status === "cancelled") {
    throw new Error("Stripe did not confirm an active refund.");
  }
}

function appendCellText_(sheet, row, column, value) {
  const existing = String(sheet.getRange(row, column).getValue() || "").trim();
  sheet.getRange(row, column).setValue(existing ? existing + " | " + value : value);
}

/* CONFIRMATION EMAILS */

function sendPlayerConfirmationOnce(data) {
  const sessionId = data.stripeSessionId || data.registrationId;
  if (emailAlreadySent("player", sessionId)) return;

  const players = data.players || [];
  if (players.length === 0) return;

  const primary = players[0];
  if (!primary.email) return;

  const total = Number(data.paymentAmount || 0) * players.length;
  const namesPlain = players.map(
    (player, index) => `${index + 1}. ${player.firstName || ""} ${player.lastName || ""}`.trim()
  ).join("\n");

  const namesHtml = players.map(
    (player) => `<li>${escapeHtml(player.firstName)} ${escapeHtml(player.lastName)}</li>`
  ).join("");

  const manageUrl = sessionId && data.withdrawalToken
    ? WEBSITE_URL + "/register/player/manage?session_id=" +
      encodeURIComponent(sessionId) + "&token=" +
      encodeURIComponent(data.withdrawalToken)
    : "";

  const managePlain = manageUrl ? `

REGISTRATION CHANGES / REFUNDS
Player registrations may be cancelled for a refund through ${REFUND_DEADLINE_TEXT}. Refunds are returned to the original payment method less the non-refundable payment-processing fee attributable to the registration.

Manage or withdraw golfers from this registration:
${manageUrl}

Keep this private link secure. It provides access to manage the golfers included in this transaction.` : `

REGISTRATION CHANGES / REFUNDS
Player registrations may be cancelled for a refund through ${REFUND_DEADLINE_TEXT}. Refunds are returned to the original payment method less the non-refundable payment-processing fee attributable to the registration.

If you need to make a registration change, please contact the tournament organizers.`;

  const manageHtml = manageUrl ? `
      <div style="
        margin:24px 0;
        padding:20px;
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:12px;
      ">
        <h3 style="margin-top:0;">
          Registration Changes / Refunds
        </h3>

        <p>
          Player registrations may be cancelled for a refund through
          <strong>${REFUND_DEADLINE_TEXT}</strong>.
          Refunds are returned to the original payment method less the
          non-refundable payment-processing fee attributable to the
          registration.
        </p>

        <p style="margin:24px 0;">
          <a
            href="${escapeHtml(manageUrl)}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#0f2742;
              color:#ffffff;
              text-decoration:none;
              border-radius:999px;
              font-weight:bold;
            "
          >
            Manage Registration
          </a>
        </p>

        <p style="
          margin-bottom:0;
          font-size:13px;
          color:#64748b;
        ">
          Keep this private link secure. It provides access to manage the
          golfers included in this transaction.
        </p>
      </div>
      ` : `
      <div style="
        margin:24px 0;
        padding:20px;
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:12px;
      ">
        <h3 style="margin-top:0;">
          Registration Changes / Refunds
        </h3>

        <p style="margin-bottom:0;">
          Player registrations may be cancelled for a refund through
          <strong>${REFUND_DEADLINE_TEXT}</strong>.
          Refunds are returned to the original payment method less the
          non-refundable payment-processing fee attributable to the
          registration. Please contact the tournament organizers if you
          need to make a registration change.
        </p>
      </div>
      `;

  const subject = "You're Registered — CSM Chad Miller Memorial Golf Tournament";

  const plainBody = `Hi ${primary.firstName || ""},

Your registration and payment have been received.

Registered golfers:
${namesPlain}

Payment: ${formatCurrency(total)}

EVENT DETAILS
${EVENT_DATE}
${EVENT_LOCATION}

7:00 AM — Registration, range open, and breakfast
8:00 AM — Gathering and opening prayer
8:20 AM — Depart for starting holes
8:30 AM — Tournament begins

Your registered group will remain together. Final pairing, shotgun, and starting-hole information will be communicated closer to the tournament.
${managePlain}

Thank you for supporting the CSM Chad Miller Memorial Golf Tournament and The Honor Foundation.

CSM Chad Miller Memorial Golf Tournament`;

  const htmlBody = emailWrapper(`
      <h2>You're registered.</h2>

      <p>
        Hi ${escapeHtml(primary.firstName)},
      </p>

      <p>
        Your registration and payment have been successfully received.
      </p>

      <h3>Registered Golfers</h3>

      <ul>
        ${namesHtml}
      </ul>

      <p>
        <strong>Payment:</strong>
        ${formatCurrency(total)}
      </p>

      ${eventDetailsHtml()}

      <p>
        Your registered group will remain together. Final pairing,
        shotgun, and starting-hole information will be communicated
        closer to the tournament.
      </p>

      ${manageHtml}

      <p>
        Thank you for supporting the CSM Chad Miller Memorial Golf
        Tournament and The Honor Foundation.
      </p>
      `);

  sendConfirmationEmail(
    "player", sessionId, primary.email, subject, plainBody, htmlBody
  );
}

function sendPlayerWithdrawalConfirmationOnce_(data) {
  if (!data.recipient || !data.refundId) return;

  const emailKey = `${data.registrationId || ""}|${data.playerNumber || ""}|${data.refundId || ""}`;
  if (emailAlreadySent("withdrawal", emailKey)) return;

  const subject = "Player Withdrawal Confirmed — CSM Chad Miller Memorial";

  const plainBody = `Your player withdrawal has been processed.

Golfer: ${data.playerName || ""}
Refund submitted: ${formatCurrency(data.refundAmount)}
Non-refundable processing fee retained: ${formatCurrency(data.processingFee)}
Stripe refund reference: ${data.refundId || ""}

The golfer has been removed from the active tournament field. The refund was submitted to the original payment method. The time required for the credit to appear is determined by the card issuer or financial institution.

${EVENT_DATE}
${EVENT_LOCATION}

If you did not request this withdrawal or believe there is an error, please contact the tournament organizers.

CSM Chad Miller Memorial Golf Tournament`;

  const htmlBody = emailWrapper(`
      <h2>Player withdrawal confirmed.</h2>

      <p>
        The requested golfer has been removed from the active tournament
        field and the applicable refund has been submitted.
      </p>

      <div style="
        margin:24px 0;
        padding:20px;
        background:#f8fafc;
        border-radius:12px;
      ">
        <p>
          <strong>Golfer:</strong>
          ${escapeHtml(data.playerName)}
          <br>
          <strong>Refund submitted:</strong>
          ${formatCurrency(data.refundAmount)}
          <br>
          <strong>Non-refundable processing fee retained:</strong>
          ${formatCurrency(data.processingFee)}
          <br>
          <strong>Stripe refund reference:</strong>
          ${escapeHtml(data.refundId)}
        </p>

        <p style="margin-bottom:0;">
          The refund was submitted to the original payment method. The
          time required for the credit to appear is determined by the
          card issuer or financial institution.
        </p>
      </div>

      ${eventDetailsHtml()}

      <p>
        If you did not request this withdrawal or believe there is an
        error, please contact the tournament organizers.
      </p>
      `);

  sendConfirmationEmail(
    "withdrawal", emailKey, data.recipient, subject, plainBody, htmlBody
  );
}

function sendSponsorConfirmationOnce(data) {
  const sessionId = data.stripeSessionId;
  if (emailAlreadySent("sponsor", sessionId)) return;
  if (!data.email) return;

  const includedPlayerCount = Number(data.includedPlayerCount || 0);

  const foursomePlain = includedPlayerCount === 4 ? `

INCLUDED FOURSOME
Your sponsorship includes one foursome (4 golfers). Four player spots have been reserved for your sponsorship. You will provide the golfer information through your private sponsor fulfillment link; no additional player-registration payment is required for those four golfers.` : "";

  const foursomeHtml = includedPlayerCount === 4 ? `
      <div style="
        margin:24px 0;
        padding:20px;
        background:#f1f5f9;
        border-radius:12px;
      ">
        <h3 style="margin-top:0;">
          Included Foursome
        </h3>

        <p style="margin-bottom:0;">
          Your sponsorship includes <strong>one foursome (4 golfers)</strong>.
          Four player spots have been reserved for your sponsorship. You will
          provide the golfer information through your private sponsor
          fulfillment link; no additional player-registration payment is
          required for those four golfers.
        </p>
      </div>
      ` : "";

  const subject = "Sponsorship Confirmed — CSM Chad Miller Memorial";

  const plainBody = `Hi ${data.contactName || ""},

Thank you for supporting the CSM Chad Miller Memorial Golf Tournament.

Company / Organization: ${data.company || ""}
Sponsorship: ${data.sponsorshipName || ""}
Payment: ${formatCurrency(data.sponsorAmount)}
${foursomePlain}

EVENT DETAILS
${EVENT_DATE}
${EVENT_LOCATION}

Our tournament team will follow up regarding your logo, signage, banner, and any other sponsorship materials required for your sponsorship level.

Thank you for supporting the memorial tournament and The Honor Foundation.

CSM Chad Miller Memorial Golf Tournament`;

  const htmlBody = emailWrapper(`
      <h2>Sponsorship confirmed.</h2>

      <p>
        Hi ${escapeHtml(data.contactName)},
      </p>

      <p>
        Thank you for supporting the CSM Chad Miller Memorial Golf
        Tournament.
      </p>

      <p>
        <strong>Company / Organization:</strong>
        ${escapeHtml(data.company)}
        <br>
        <strong>Sponsorship:</strong>
        ${escapeHtml(data.sponsorshipName)}
        <br>
        <strong>Payment:</strong>
        ${formatCurrency(data.sponsorAmount)}
      </p>

      ${foursomeHtml}

      ${eventDetailsHtml()}

      <p>
        Our tournament team will follow up regarding your logo,
        signage, banner, and any other sponsorship materials required
        for your sponsorship level.
      </p>

      <p>
        Thank you for supporting the memorial tournament and The Honor
        Foundation.
      </p>
      `);

  sendConfirmationEmail(
    "sponsor", sessionId, data.email, subject, plainBody, htmlBody
  );
}

function sendDonationConfirmationOnce(data) {
  const sessionId = data.stripeSessionId;
  if (emailAlreadySent("donation", sessionId)) return "Sent";
  if (!data.email) return "Not Sent";

  const subject = "Thank You — CSM Chad Miller Memorial";

  const recognitionText = publicRecognitionAllowed_(
    data.publicRecognition, data.anonymous
  ) === "Yes"
    ? "You also elected to be recognized publicly as a supporter of the tournament."
    : "Your donation will remain private from public recognition unless you tell us otherwise.";

  const plainBody = `Hi ${data.donorName || ""},

Thank you for your contribution to the CSM Chad Miller Memorial Golf Tournament.

Contribution: ${formatCurrency(data.donationAmount)}

Your contribution has been successfully received and recorded.

${recognitionText}

${EVENT_DATE}
${EVENT_LOCATION}

Thank you for supporting the memorial tournament and its mission of benefiting The Honor Foundation.

CSM Chad Miller Memorial Golf Tournament`;

  const htmlBody = emailWrapper(`
      <h2>Thank you for your support.</h2>

      <p>
        Hi ${escapeHtml(data.donorName)},
      </p>

      <p>
        Thank you for your contribution to the CSM Chad Miller
        Memorial Golf Tournament.
      </p>

      <p>
        <strong>Contribution:</strong>
        ${formatCurrency(data.donationAmount)}
      </p>

      <p>
        Your contribution has been successfully received and recorded.
      </p>

      <p>
        ${escapeHtml(recognitionText)}
      </p>

      ${eventDetailsHtml()}

      <p>
        Thank you for supporting the memorial tournament and its
        mission of benefiting The Honor Foundation.
      </p>
      `);

  sendConfirmationEmail(
    "donation", sessionId, data.email, subject, plainBody, htmlBody
  );

  return "Sent";
}

function sendVolunteerConfirmationOnce(data) {
  const volunteerKey = `${data.firstName || ""}|${data.lastName || ""}|${data.email || ""}`
    .toLowerCase();

  if (emailAlreadySent("volunteer", volunteerKey)) return;
  if (!data.email) return;

  const subject = "Volunteer Registration Confirmed — CSM Chad Miller Memorial";

  const plainBody = `Hi ${data.firstName || ""},

Thank you for volunteering for the CSM Chad Miller Memorial Golf Tournament.

Preferred Assignment: ${data.assignment || ""}
T-Shirt Size: ${data.shirtSize || ""}

EVENT DETAILS
${EVENT_DATE}
${EVENT_LOCATION}

Volunteer arrival time: 6:00 AM

Your preferred assignment has been recorded. Final assignments and additional tournament-day instructions will be sent before the event.

Thank you for helping us honor Command Sergeant Major Chad Miller and support The Honor Foundation.

CSM Chad Miller Memorial Golf Tournament`;

  const htmlBody = emailWrapper(`
      <h2>You're on the volunteer team.</h2>

      <p>
        Hi ${escapeHtml(data.firstName)},
      </p>

      <p>
        Thank you for volunteering for the CSM Chad Miller Memorial
        Golf Tournament.
      </p>

      <p>
        <strong>Preferred Assignment:</strong>
        ${escapeHtml(data.assignment)}
        <br>
        <strong>T-Shirt Size:</strong>
        ${escapeHtml(data.shirtSize)}
      </p>

      <div style="
        margin:24px 0;
        padding:20px;
        background:#f1f5f9;
        border-radius:12px;
      ">
        <h3 style="margin-top:0;">
          Tournament Day
        </h3>

        <p>
          <strong>${EVENT_DATE}</strong>
          <br>
          ${EVENT_LOCATION}
        </p>

        <p style="margin-bottom:0;">
          <strong>Volunteer arrival:</strong> 6:00 AM
        </p>
      </div>

      <p>
        Your preferred assignment has been recorded. Final assignments
        and additional tournament-day instructions will be sent before
        the event.
      </p>

      <p>
        Thank you for helping us honor Command Sergeant Major Chad Miller and
        support The Honor Foundation.
      </p>
      `);

  sendConfirmationEmail(
    "volunteer", volunteerKey, data.email, subject, plainBody, htmlBody
  );
}

function sendConfirmationEmail(type, sessionId, recipient, subject, plainBody, htmlBody) {
  if (!recipient) return;

  MailApp.sendEmail(recipient, subject, plainBody, {
    htmlBody: htmlBody,
    name: EMAIL_SENDER_NAME
  });

  markEmailSent(type, sessionId);
}

function emailAlreadySent(type, sessionId) {
  if (!sessionId) return false;
  const properties = PropertiesService.getScriptProperties();
  return properties.getProperty(emailPropertyKey(type, sessionId)) === "true";
}

function markEmailSent(type, sessionId) {
  if (!sessionId) return;
  PropertiesService.getScriptProperties()
    .setProperty(emailPropertyKey(type, sessionId), "true");
}

function emailPropertyKey(type, sessionId) {
  return "confirmationEmail." + type + "." + sessionId;
}

/* EMAIL DESIGN */

function eventDetailsHtml() {
  return `
    <div style="
      margin:24px 0;
      padding:20px;
      background:#f1f5f9;
      border-radius:12px;
    ">
      <h3 style="margin-top:0;">
        Event Details
      </h3>

      <p>
        <strong>${EVENT_DATE}</strong>
        <br>
        ${EVENT_LOCATION}
      </p>

      <p style="margin-bottom:0;">
        <strong>7:00 AM</strong> — Registration, range open, and breakfast
        <br>
        <strong>8:00 AM</strong> — Gathering and opening prayer
        <br>
        <strong>8:20 AM</strong> — Depart for starting holes
        <br>
        <strong>8:30 AM</strong> — Tournament begins
      </p>
    </div>
  `;
}

function emailWrapper(content) {
  return `
    <div style="
      margin:0;
      padding:32px 16px;
      background:#f8fafc;
      font-family:Arial,Helvetica,sans-serif;
      color:#1e293b;
      line-height:1.6;
    ">
      <div style="
        max-width:640px;
        margin:0 auto;
        padding:32px;
        background:#ffffff;
        border-radius:16px;
      ">
        ${content}

        <hr style="
          margin:32px 0 20px;
          border:none;
          border-top:1px solid #e2e8f0;
        ">

        <p style="
          margin:0;
          font-size:13px;
          color:#64748b;
        ">
          CSM Chad Miller Memorial Golf Tournament
          <br>
          Southern Pines, North Carolina
        </p>
      </div>
    </div>
  `;
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return "$" + amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(value) {
  const text = value === null || value === undefined ? "" : String(value);

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* PAIRING ENGINE */

function buildPairings() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const playersSheet = getOrCreatePlayersSheet(spreadsheet);
  const pairingsSheet = getOrCreatePairingsSheet(spreadsheet);
  const registrations = getPaidRegistrations(playersSheet);

  const foursomes = registrations
    .filter((registration) => registration.players.length === 4)
    .sort(sortRegistrations);

  const threesomes = registrations
    .filter((registration) => registration.players.length === 3)
    .sort(sortRegistrations);

  const pairs = registrations
    .filter((registration) => registration.players.length === 2)
    .sort(sortRegistrations);

  const individuals = registrations
    .filter((registration) => registration.players.length === 1)
    .sort(sortRegistrations);

  const groups = [];

  foursomes.forEach((registration) => {
    groups.push([registration]);
  });

  threesomes.forEach((registration) => {
    const group = [registration];
    if (individuals.length > 0) group.push(individuals.shift());
    groups.push(group);
  });

  while (pairs.length >= 2) {
    groups.push([pairs.shift(), pairs.shift()]);
  }

  if (pairs.length === 1) {
    const group = [pairs.shift()];
    if (individuals.length > 0) group.push(individuals.shift());
    if (individuals.length > 0) group.push(individuals.shift());
    groups.push(group);
  }

  while (individuals.length > 0) {
    const group = [];

    while (individuals.length > 0 && countPlayersInGroup(group) < 4) {
      group.push(individuals.shift());
    }

    groups.push(group);
  }

  if (groups.length > 32) {
    throw new Error(
      "Pairing system created more than 32 groups. Review player registrations."
    );
  }

  const outputRows = [];

  groups.forEach((group, groupIndex) => {
    const groupNumber = groupIndex + 1;
    const assignment = getStartingAssignment(groupNumber);
    const groupPlayerCount = countPlayersInGroup(group);

    const pairingStatus = groupPlayerCount === 4
      ? "Complete"
      : `Needs ${4 - groupPlayerCount} Player${4 - groupPlayerCount === 1 ? "" : "s"}`;

    const registrationCount = group.length;
    let groupNotes = "";

    if (groupPlayerCount === 4 && registrationCount === 1) {
      groupNotes = "Registered foursome";
    } else if (groupPlayerCount === 4 && registrationCount > 1) {
      groupNotes = "Auto-paired";
    } else {
      groupNotes = "Awaiting additional player(s)";
    }

    group.forEach((registration) => {
      registration.players.forEach((player) => {
        outputRows.push([
          groupNumber,
          assignment.shotgun,
          assignment.hole,
          registration.registrationId,
          player.playerNumber,
          player.firstName,
          player.lastName,
          player.handicap,
          registration.teamName,
          player.tee,
          pairingStatus,
          groupNotes
        ]);
      });
    });
  });

  clearPairingsData(pairingsSheet);

  if (outputRows.length > 0) {
    pairingsSheet.getRange(
      2, 1, outputRows.length, PAIRING_HEADERS.length
    ).setValues(outputRows);
  }

  pairingsSheet.autoResizeColumns(1, PAIRING_HEADERS.length);

  SpreadsheetApp.getUi().alert(
    "Pairings Updated",
    `${outputRows.length} paid golfers placed into ${groups.length} groups.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function getPaidRegistrations(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const rows = sheet.getRange(2, 1, lastRow - 1, PLAYER_HEADERS.length).getValues();
  const registrationMap = new Map();

  rows.forEach((row) => {
    const registrationId = String(row[0] || "").trim();
    const registrationDate = row[1];
    const paymentStatus = String(row[2] || "").trim().toLowerCase();

    if (!registrationId || paymentStatus !== "paid") return;

    if (!registrationMap.has(registrationId)) {
      registrationMap.set(registrationId, {
        registrationId,
        registrationDate,
        teamName: String(row[4] || ""),
        players: []
      });
    }

    registrationMap.get(registrationId).players.push({
      playerNumber: Number(row[5]) || 1,
      firstName: String(row[6] || ""),
      lastName: String(row[7] || ""),
      handicap: String(row[11] || ""),
      tee: String(row[12] || "")
    });
  });

  const registrations = Array.from(registrationMap.values());

  registrations.forEach((registration) => {
    registration.players.sort((a, b) => a.playerNumber - b.playerNumber);
  });

  return registrations.filter(
    (registration) => registration.players.length >= 1 && registration.players.length <= 4
  );
}

function sortRegistrations(a, b) {
  const aTime = a.registrationDate instanceof Date ? a.registrationDate.getTime() : 0;
  const bTime = b.registrationDate instanceof Date ? b.registrationDate.getTime() : 0;
  return aTime - bTime;
}

function countPlayersInGroup(group) {
  return group.reduce((total, registration) => total + registration.players.length, 0);
}

function getStartingAssignment(groupNumber) {
  if (groupNumber <= 18) {
    return {shotgun: 1, hole: SHOTGUN_ONE_HOLES[groupNumber - 1]};
  }

  const shotgunTwoIndex = groupNumber - 19;

  if (shotgunTwoIndex >= 0 && shotgunTwoIndex < SHOTGUN_TWO_HOLES.length) {
    return {shotgun: 2, hole: SHOTGUN_TWO_HOLES[shotgunTwoIndex]};
  }

  throw new Error(`No starting-hole assignment exists for Group ${groupNumber}.`);
}

/* SHEET HELPERS */

function getOrCreatePlayersSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(PLAYERS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(PLAYERS_SHEET_NAME);
  sheet.getRange(1, 1, 1, PLAYER_HEADERS.length).setValues([PLAYER_HEADERS]);
  sheet.getRange(1, 1, 1, PLAYER_HEADERS.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
  return sheet;
}

function getOrCreateHoldsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(HOLDS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(HOLDS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HOLD_HEADERS.length).setValues([HOLD_HEADERS]);
    sheet.getRange(1, 1, 1, HOLD_HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getOrCreatePairingsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(PAIRINGS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(PAIRINGS_SHEET_NAME);
  sheet.getRange(1, 1, 1, PAIRING_HEADERS.length).setValues([PAIRING_HEADERS]);
  sheet.getRange(1, 1, 1, PAIRING_HEADERS.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
  return sheet;
}

function getOrCreateSponsorsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SPONSORS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SPONSORS_SHEET_NAME);
  ensureSheetHeaderRow_(sheet, SPONSOR_HEADERS);
  return sheet;
}

function getOrCreateDonationsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(DONATIONS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(DONATIONS_SHEET_NAME);
  ensureSheetHeaderRow_(sheet, DONATION_HEADERS);
  return sheet;
}

function ensureSheetHeaderRow_(sheet, headers) {
  const missingColumns = headers.length - sheet.getMaxColumns();

  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function getOrCreateVolunteersSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(VOLUNTEERS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(VOLUNTEERS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, VOLUNTEER_HEADERS.length).setValues([VOLUNTEER_HEADERS]);
    sheet.getRange(1, 1, 1, VOLUNTEER_HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function clearPairingsData(sheet) {
  const maxRows = sheet.getMaxRows();
  if (maxRows > 1) {
    sheet.getRange(2, 1, maxRows - 1, PAIRING_HEADERS.length).clearContent();
  }
}

/* CAPACITY HELPERS */

function countPaidPlayers(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const statuses = sheet.getRange(2, 3, lastRow - 1, 1).getValues().flat();
  return statuses.filter(
    (status) => String(status).trim().toLowerCase() === "paid"
  ).length;
}

function countActiveHolds(sheet) {
  return countCurrentActiveHoldsReadOnly_(sheet);
}

function cleanupExpiredHolds(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const rows = sheet.getRange(2, 1, lastRow - 1, HOLD_HEADERS.length).getValues();
  const now = Date.now();

  rows.forEach((row, index) => {
    const expiry = new Date(row[2]).getTime();

    if (
      String(row[4] || "").trim() === "Active" &&
      Number.isFinite(expiry) &&
      expiry <= now
    ) {
      sheet.getRange(index + 2, 5).setValue("Expired");
    }
  });
}

function updateHoldStatus(sheet, holdId, status, stripeSessionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const holdIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const index = holdIds.indexOf(holdId);
  if (index === -1) return;

  const row = index + 2;
  sheet.getRange(row, 5).setValue(status);
  if (stripeSessionId) sheet.getRange(row, 6).setValue(stripeSessionId);
}

/* DUPLICATE PROTECTION */

function registrationAlreadyExists(sheet, registrationId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  return ids.includes(registrationId);
}

function sponsorAlreadyExists(sheet, stripeSessionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const notes = sheet.getRange(2, 11, lastRow - 1, 1).getValues().flat();
  return notes.some((note) => String(note).includes(stripeSessionId));
}

function donationAlreadyExists(sheet, stripeSessionId) {
  return Boolean(findDonationRowByStripeSession_(sheet, stripeSessionId));
}

function volunteerAlreadyExists(sheet, firstName, lastName, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const rows = sheet.getRange(2, 1, lastRow - 1, VOLUNTEER_HEADERS.length).getValues();

  return rows.some((row) =>
    String(row[0]).trim().toLowerCase() === String(firstName).trim().toLowerCase() &&
    String(row[1]).trim().toLowerCase() === String(lastName).trim().toLowerCase() &&
    String(row[2]).trim().toLowerCase() === String(email).trim().toLowerCase()
  );
}

/* GENERAL HELPERS */

function buildPlayerNotes(data) {
  const notes = [];
  if (data.needsPairing) notes.push("Needs pairing");
  if (data.stripeSessionId) notes.push("Stripe Session: " + data.stripeSessionId);
  return notes.join(" | ");
}

function hashWithdrawalToken_(token) {
  if (!token) return "";

  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(token),
    Utilities.Charset.UTF_8
  );

  return digest.map((byte) => {
    const value = (byte + 256) % 256;
    return value.toString(16).padStart(2, "0");
  }).join("");
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* PLAYER CHECKOUT HOLD OWNERSHIP */

function cmmPlayerCheckoutV2HoldId_(attemptId) {
  const value = String(attemptId || "").trim();

  if (!value || value.length > 100) {
    throw new Error("A valid registration attempt ID is required.");
  }

  return "PLAYER-" + hashWithdrawalToken_("player-capacity-v2:" + value);
}

function cmmPlayerCheckoutV2FindHold_(sheet, holdId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const rows = sheet.getRange(2, 1, lastRow - 1, HOLD_HEADERS.length).getValues();
  const index = rows.findIndex(
    row => String(row[0] || "").trim() === String(holdId || "").trim()
  );

  return index < 0 ? null : {rowNumber: index + 2, values: rows[index]};
}

function cmmPlayerCheckoutV2RequireOwnedHold_(sheet, data) {
  const expected = cmmPlayerCheckoutV2HoldId_(data.registrationAttemptId);

  if (String(data.holdId || "").trim() !== expected) {
    throw new Error("This checkout attempt does not own the requested player hold.");
  }

  const hold = cmmPlayerCheckoutV2FindHold_(sheet, expected);

  if (!hold) throw new Error("The player checkout hold could not be found.");

  return hold;
}

function getPlayerCapacityHold(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOLDS_SHEET_NAME);

  if (!sheet) throw new Error("The player checkout hold could not be found.");

  const hold = cmmPlayerCheckoutV2RequireOwnedHold_(sheet, data);
  const expiry = new Date(hold.values[2]).getTime();

  return jsonResponse({
    ok: true,
    holdId: String(hold.values[0]),
    playerCount: Number(hold.values[3]),
    holdStatus: String(hold.values[4] || "").trim(),
    stripeSessionId: String(hold.values[5] || "").trim(),
    expiresAt: Number.isFinite(expiry) ? new Date(expiry).toISOString() : null
  });
}

function attachPlayerCheckout(data) {
  const sessionId = String(data.stripeSessionId || "").trim();

  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    throw new Error("Invalid Stripe Checkout Session ID.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getOrCreateHoldsSheet(SpreadsheetApp.getActiveSpreadsheet());
    const hold = cmmPlayerCheckoutV2RequireOwnedHold_(sheet, data);
    const status = String(hold.values[4] || "").trim();
    const currentSession = String(hold.values[5] || "").trim();

    if (currentSession && currentSession !== sessionId) {
      throw new Error("This player hold already belongs to a different Stripe checkout.");
    }

    if (status === "Converted" && currentSession === sessionId) {
      return jsonResponse({ok: true, alreadyRegistered: true});
    }

    const expiry = new Date(hold.values[2]).getTime();

    if (
      status !== "Active" ||
      !Number.isFinite(expiry) ||
      expiry <= Date.now()
    ) {
      throw new Error("This player checkout hold is no longer active.");
    }

    sheet.getRange(hold.rowNumber, 6).setValue(sessionId);

    return jsonResponse({
      ok: true,
      holdId: String(hold.values[0]),
      stripeSessionId: sessionId
    });
  } finally {
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }
}

/*
Manual administrator check.
Expires only holds whose recorded deadline has passed.
Does not delete paid players, live holds, or sponsor reservations.
*/

function checkAndCleanCapacityHolds() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    cleanupExpiredHolds(
      getOrCreateHoldsSheet(SpreadsheetApp.getActiveSpreadsheet())
    );

    SpreadsheetApp.flush();

    const result = JSON.parse(getCapacity().getContent());
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }
}
/*
 * CSM Chad Miller Memorial — isolated 2027 inquiry storage.
 * Add to the existing bound project without replacing 2026 handlers.
 * Reuses requireSponsorCapacityInternalKey_ and jsonResponse.
 * The live doGet router must dispatch get2027Capabilities to
 * get2027Capabilities(), and doPost must dispatch save2027Inquiry to
 * save2027Inquiry(data) BEFORE the legacy paid-registration fallback.
 * No emails are sent by this file; no payment or capacity is created.
 */
function get2027Capabilities() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('2027 Player Interest') || !ss.getSheetByName('2027 Sponsor Inquiries')) {
    return jsonResponse({ ok: false, eventYear: 2027 });
  }
  return jsonResponse({ ok: true, eventYear: 2027, inquirySchema: '2027-inquiry-v1' });
}

function inquiry2027Text_(value, label, max, required) {
  var result = typeof value === 'string' ? value.trim() : '';
  if ((required && !result) || result.length > max) throw new Error('Invalid ' + label + '.');
  return result;
}
function inquiry2027Cell_(value) {
  return typeof value === 'string' && /^[=+\-@]/.test(value) ? "'" + value : value;
}

function inquiry2027CompareCell_(value) {
  return typeof value === 'string' && /^'[=+\-@]/.test(value) ? value.slice(1) : value;
}

function save2027Inquiry(data) {
  requireSponsorCapacityInternalKey_(data);
  if (data.eventYear !== 2027 || (data.type !== 'player' && data.type !== 'sponsor') || data.contactConsent !== true) throw new Error('Invalid 2027 inquiry.');
  if (!/^INQ-2027-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(String(data.submissionId || ''))) throw new Error('Invalid inquiry reference.');
  var name = inquiry2027Text_(data.name, 'name', 120, true);
  var email = inquiry2027Text_(data.email, 'email', 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email.');
  var phone = inquiry2027Text_(data.phone, 'phone', 40, false);
  var notes = inquiry2027Text_(data.notes, 'notes', 2000, false);
  var organization = inquiry2027Text_(data.organization, 'organization', 180, data.type === 'sponsor');
  var website = inquiry2027Text_(data.website, 'website', 500, false);
  if (website && !/^https?:\/\/[^\s/@]+(?:[/:?#]|$)/i.test(website)) throw new Error('Invalid website.');
  var interest = inquiry2027Text_(data.interest, 'interest', 180, false);
  var count = data.type === 'player' ? Number(data.playersInterested) : 0;
  if (data.type === 'player' && (!Number.isInteger(count) || count < 1 || count > 4)) throw new Error('Invalid player interest count.');
  var sheetName = data.type === 'player' ? '2027 Player Interest' : '2027 Sponsor Inquiries';
  var headers = data.type === 'player'
    ? ['Submission ID','Submitted At','Event Year','Name','Email','Phone','Players Interested','Notes','Contact Consent','Status']
    : ['Submission ID','Submitted At','Event Year','Organization','Contact Name','Email','Phone','Website','Interest','Notes','Contact Consent','Status'];
  var details = data.type === 'player'
    ? [2027,name,email,phone,count,notes,'Yes','New interest']
    : [2027,organization,name,email,phone,website,interest,notes,'Yes','New inquiry'];
  details = details.map(inquiry2027Cell_);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error('2027 inquiry sheet is missing.');
    var actualHeaders = sheet.getRange(1,1,1,headers.length).getValues()[0];
    if (JSON.stringify(actualHeaders) !== JSON.stringify(headers)) throw new Error('2027 inquiry headers do not match.');
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var existing = sheet.getRange(2,1,lastRow - 1,headers.length).getValues();
      for (var i = 0; i < existing.length; i++) {
        if (existing[i][0] === data.submissionId) {
          // Keep human-managed Status out of the retry comparison.
          if (JSON.stringify(existing[i].slice(2,-1).map(inquiry2027CompareCell_)) !== JSON.stringify(details.slice(0,-1).map(inquiry2027CompareCell_))) throw new Error('This reference already has different details. Reload the form before a new inquiry.');
          return jsonResponse({ ok: true, eventYear: 2027, inquiryType: data.type, submissionId: data.submissionId, reused: true });
        }
      }
    }
    sheet.appendRow([data.submissionId,new Date().toISOString()].concat(details));
    return jsonResponse({ ok: true, eventYear: 2027, inquiryType: data.type, submissionId: data.submissionId });
  } finally { lock.releaseLock(); }
}
