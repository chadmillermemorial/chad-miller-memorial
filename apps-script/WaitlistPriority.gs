const WAITLIST_PRIORITY_SHEET = "Waitlist";
const WAITLIST_OFFER_NOTE_PREFIX = "WAITLIST_OFFER_TOKEN:";
const WAITLIST_OFFER_HOURS = 48;

const WAITLIST_AUTOMATION_HANDLER =
  "processAutomaticWaitlistOffers";

/* =========================================================
   AUTOMATIC WAITLIST SETUP

   Creates one background trigger that checks every 5 minutes
   for newly available tournament capacity.

   BEST-FIT RULE:
   - Preserve original waitlist order.
   - Starting from the oldest entry, offer capacity to the
     earliest person whose requested group will fit.
   - If that group is too large for current capacity, skip
     them temporarily and continue down the list.
   - The skipped entry keeps its original place in line.
========================================================= */

function setupAutomaticWaitlistOffers() {
  // The inaugural event has concluded; preserve all waitlist records.
  return { closed: true, eventYear: 2026 };

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  /*
    Remove old copies of this trigger so repeated setup
    does not create duplicates.
  */
  ScriptApp.getProjectTriggers()
    .filter(
      trigger =>
        trigger.getHandlerFunction() ===
        WAITLIST_AUTOMATION_HANDLER
    )
    .forEach(
      trigger =>
        ScriptApp.deleteTrigger(trigger)
    );

  /*
    Check the waitlist every 5 minutes.
  */
  ScriptApp.newTrigger(
    WAITLIST_AUTOMATION_HANDLER
  )
    .timeBased()
    .everyMinutes(5)
    .create();

  /*
    Run once immediately.
  */
  processAutomaticWaitlistOffers();

  spreadsheet.toast(
    "Automatic waitlist offers are active and will check every 5 minutes.",
    "Waitlist Automation",
    7
  );
}


/* =========================================================
   AUTOMATIC WAITLIST PROCESSOR
========================================================= */

function processAutomaticWaitlistOffers() {
  // Closed after the 2026 tournament: never issue old enrollment offers.
  return { closed: true, eventYear: 2026 };

  const lock =
    LockService.getScriptLock();

  /*
    If another registration/refund/waitlist operation currently
    owns the script lock, simply let the next 5-minute run handle
    the waitlist rather than risking overlapping capacity changes.
  */
  try {
    lock.waitLock(10000);
  } catch (error) {
    return;
  }

  try {
    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();

    const waitlistSheet =
      spreadsheet.getSheetByName(
        WAITLIST_PRIORITY_SHEET
      );

    if (
      !waitlistSheet ||
      waitlistSheet.getLastRow() < 2
    ) {
      return;
    }

    /*
      Expire any old private offers first.

      Once an offer expires, the spots committed to that
      offer can immediately be considered for the next
      eligible waitlist entry.
    */
    expireWaitlistOffers_(
      waitlistSheet
    );

    const playersSheet =
      getOrCreatePlayersSheet(
        spreadsheet
      );

    const holdsSheet =
      getOrCreateHoldsSheet(
        spreadsheet
      );

    cleanupExpiredHolds(
      holdsSheet
    );

    const paidPlayers =
      countPaidPlayers(
        playersSheet
      );

    const activeHolds =
      countActiveHolds(
        holdsSheet
      );

    /*
      Physical tournament capacity that is not already occupied
      by a paid golfer or an active Stripe checkout hold.
    */
    const physicalRemaining =
      Math.max(
        MAX_PLAYERS -
          paidPlayers -
          activeHolds,
        0
      );

    if (
      physicalRemaining <= 0
    ) {
      return;
    }

    const waitlistRows =
      waitlistSheet
        .getRange(
          2,
          1,
          waitlistSheet.getLastRow() - 1,
          12
        )
        .getValues();

    /*
      Existing Registration Offered entries do not create a
      capacity hold until their recipient actually begins
      checkout.

      Therefore, subtract all currently active private offers
      from physical capacity before issuing any new offers.
    */
    let alreadyOfferedPlayers = 0;

    waitlistRows.forEach(
      row => {
        const status =
          String(
            row[7] || ""
          )
            .trim()
            .toLowerCase();

        const deadline =
          row[9];

        if (
          status !==
          "registration offered"
        ) {
          return;
        }

        if (
          !(deadline instanceof Date) ||
          isNaN(
            deadline.getTime()
          ) ||
          deadline.getTime() <=
            Date.now()
        ) {
          return;
        }

        const offeredCount =
          Number(
            row[6] || 0
          );

        if (
          [1, 2, 3, 4].includes(
            offeredCount
          )
        ) {
          alreadyOfferedPlayers +=
            offeredCount;
        }
      }
    );

    let availableToOffer =
      Math.max(
        physicalRemaining -
          alreadyOfferedPlayers,
        0
      );

    if (
      availableToOffer <= 0
    ) {
      return;
    }

    /*
      Build the eligible list.

      Row order represents original waitlist order. Date Added
      is also used as the primary sort when available, with
      sheet row as the tie-breaker.
    */
    const eligibleEntries = [];

    waitlistRows.forEach(
      (values, index) => {
        const row =
          index + 2;

        const status =
          String(
            values[7] || ""
          )
            .trim()
            .toLowerCase();

        if (
          status !== "waiting" &&
          status !== "contacted"
        ) {
          return;
        }

        const waitlistId =
          String(
            values[0] || ""
          ).trim();

        const firstName =
          String(
            values[2] || ""
          ).trim();

        const lastName =
          String(
            values[3] || ""
          ).trim();

        const email =
          String(
            values[4] || ""
          ).trim();

        const playersRequested =
          Number(
            values[6] || 0
          );

        if (
          !waitlistId ||
          !email ||
          ![1, 2, 3, 4].includes(
            playersRequested
          )
        ) {
          return;
        }

        const dateAdded =
          values[1];

        eligibleEntries.push({
          row,
          waitlistId,
          firstName,
          lastName,
          email,
          playersRequested,

          dateAdded:
            dateAdded instanceof Date &&
            !isNaN(
              dateAdded.getTime()
            )
              ? dateAdded.getTime()
              : Number.MAX_SAFE_INTEGER,
        });
      }
    );

    eligibleEntries.sort(
      (a, b) => {
        if (
          a.dateAdded !==
          b.dateAdded
        ) {
          return (
            a.dateAdded -
            b.dateAdded
          );
        }

        return a.row - b.row;
      }
    );

    /*
      BEST-FIT WITH WAITLIST ORDER

      Work from oldest to newest.

      If an entry requests more golfers than currently fit,
      leave that person in Waiting/Contacted status and keep
      searching for the earliest later entry that does fit.
    */
    for (
      let index = 0;
      index <
        eligibleEntries.length;
      index++
    ) {
      if (
        availableToOffer <= 0
      ) {
        break;
      }

      const entry =
        eligibleEntries[index];

      if (
        entry.playersRequested >
        availableToOffer
      ) {
        /*
          Temporarily skip this person.
          Their status and waitlist position are unchanged.
        */
        continue;
      }

      const offered =
        issueAutomaticWaitlistOffer_(
          spreadsheet,
          waitlistSheet,
          entry
        );

      if (offered) {
        availableToOffer -=
          entry.playersRequested;
      }
    }

    SpreadsheetApp.flush();

  } finally {
    lock.releaseLock();
  }
}


/* =========================================================
   ISSUE ONE AUTOMATIC WAITLIST OFFER
========================================================= */

function issueAutomaticWaitlistOffer_(
  spreadsheet,
  sheet,
  entry
) {
  // Also block direct/manual calls to the 2026 offer sender.
  return false;

  /*
    Re-read status immediately before making the offer.
    This protects against stale data if the row was changed
    before this function reached it.
  */
  const currentStatus =
    String(
      sheet
        .getRange(
          entry.row,
          8
        )
        .getDisplayValue() || ""
    )
      .trim()
      .toLowerCase();

  if (
    currentStatus !== "waiting" &&
    currentStatus !== "contacted"
  ) {
    return false;
  }

  /*
    Create the secure private registration token.
  */
  const offerToken =
    createWaitlistOfferToken_(
      sheet,
      entry.row
    );

  const now =
    new Date();

  const deadline =
    new Date(
      now.getTime() +
        WAITLIST_OFFER_HOURS *
          60 *
          60 *
          1000
    );

  /*
    H = Status
    I = Date Contacted
    J = Response Deadline
  */
  sheet
    .getRange(
      entry.row,
      8
    )
    .setValue(
      "Registration Offered"
    );

  sheet
    .getRange(
      entry.row,
      9
    )
    .setValue(now);

  sheet
    .getRange(
      entry.row,
      10
    )
    .setValue(deadline);

  appendWaitlistPriorityNote_(
    sheet,
    entry.row,
    `Automatic private registration offer sent for ${entry.playersRequested} player spot(s).`
  );

  SpreadsheetApp.flush();

  const registrationUrl =
    "https://www.chadmillermemorial.org/register/player" +
    "?waitlistId=" +
    encodeURIComponent(
      entry.waitlistId
    ) +
    "&offerToken=" +
    encodeURIComponent(
      offerToken
    );

  const formattedDeadline =
    Utilities.formatDate(
      deadline,
      Session.getScriptTimeZone(),
      "EEEE, MMMM d, yyyy 'at' h:mm a"
    );

  const greeting =
    entry.firstName
      ? `Hi ${entry.firstName},`
      : "Hello,";

  const subject =
    "CSM Chad Miller Memorial — Registration Spot Available";

  const body = [
    greeting,
    "",
    "A registration spot is now available for you from the CSM Chad Miller Memorial Golf Tournament waitlist.",
    "",
    `Your offer covers ${entry.playersRequested} golfer${entry.playersRequested === 1 ? "" : "s"}.`,
    "",
    `This private registration offer expires ${formattedDeadline}.`,
    "",
    "Use your private registration link:",
    registrationUrl,
    "",
    "Your spot is not confirmed until registration and payment are completed.",
    "",
    "Tournament:",
    "CSM Chad Miller Memorial Golf Tournament",
    "Friday, October 9, 2026",
    "Hyland Golf Course",
    "Southern Pines, NC",
    "",
    "If you no longer plan to attend, you may simply allow this offer to expire.",
    "",
    "CSM Chad Miller Memorial Golf Tournament"
  ].join("\n");

  /*
    If email delivery throws an Apps Script error, restore the
    person to Waiting so the next automation run may try again.
  */
  try {
    GmailApp.sendEmail(
      entry.email,
      subject,
      body,
      {
        name:
          "CSM Chad Miller Memorial Golf Tournament",
      }
    );

    return true;

  } catch (error) {
    sheet
      .getRange(
        entry.row,
        8
      )
      .setValue(
        "Waiting"
      );

    sheet
      .getRange(
        entry.row,
        9
      )
      .clearContent();

    sheet
      .getRange(
        entry.row,
        10
      )
      .clearContent();

    clearWaitlistOfferToken_(
      sheet.getRange(
        entry.row,
        1
      )
    );

    appendWaitlistPriorityNote_(
      sheet,
      entry.row,
      "Automatic registration offer email failed; entry returned to Waiting."
    );

    SpreadsheetApp.flush();

    return false;
  }
}


/* =========================================================
   WAITLIST PRIORITY STATE

   Public registration should remain closed whenever there
   is anyone still active in the waitlist process.

   Active statuses:
   - Waiting
   - Contacted
   - Registration Offered
========================================================= */

function getWaitlistPriorityState_(
  spreadsheet
) {
  const sheet =
    spreadsheet.getSheetByName(
      WAITLIST_PRIORITY_SHEET
    );

  if (
    !sheet ||
    sheet.getLastRow() < 2
  ) {
    return {
      priorityActive: false,
      waitingCount: 0,
      offersOutstanding: 0,
    };
  }

  /*
    Expire any offers whose 48-hour window has ended
    before calculating the current state.
  */
  expireWaitlistOffers_(
    sheet
  );

  const rows =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        12
      )
      .getValues();

  let waitingCount = 0;
  let offersOutstanding = 0;

  rows.forEach(
    row => {
      const status =
        String(
          row[7] || ""
        )
          .trim()
          .toLowerCase();

      if (
        status === "waiting" ||
        status === "contacted"
      ) {
        waitingCount++;
      }

      if (
        status ===
        "registration offered"
      ) {
        offersOutstanding++;
      }
    }
  );

  return {
    priorityActive:
      waitingCount > 0 ||
      offersOutstanding > 0,

    waitingCount,
    offersOutstanding,
  };
}


/* =========================================================
   VALIDATE A WAITLIST OFFER

   A valid offer must have:

   - Correct Waitlist ID
   - Correct private offer token
   - Status = Registration Offered
   - Deadline has not expired

   playerCount is optional. When supplied, it cannot exceed
   the number of golfers requested by the waitlist entry.
========================================================= */

function validateWaitlistOffer_(
  spreadsheet,
  waitlistId,
  offerToken,
  playerCount
) {
  const sheet =
    spreadsheet.getSheetByName(
      WAITLIST_PRIORITY_SHEET
    );

  if (!sheet) {
    return {
      valid: false,
      reason:
        "Waitlist sheet was not found.",
    };
  }

  if (
    !waitlistId ||
    !offerToken
  ) {
    return {
      valid: false,
      reason:
        "Waitlist offer information is missing.",
    };
  }

  expireWaitlistOffers_(
    sheet
  );

  const row =
    findWaitlistOfferRow_(
      sheet,
      waitlistId
    );

  if (!row) {
    return {
      valid: false,
      reason:
        "Waitlist offer was not found.",
    };
  }

  const status =
    String(
      sheet
        .getRange(
          row,
          8
        )
        .getValue() || ""
    )
      .trim()
      .toLowerCase();

  if (
    status !==
    "registration offered"
  ) {
    return {
      valid: false,
      reason:
        "This waitlist offer is no longer active.",
    };
  }

  const deadline =
    sheet
      .getRange(
        row,
        10
      )
      .getValue();

  if (
    !(deadline instanceof Date) ||
    isNaN(
      deadline.getTime()
    ) ||
    deadline.getTime() <=
      Date.now()
  ) {
    return {
      valid: false,
      reason:
        "This waitlist offer has expired.",
    };
  }

  const storedToken =
    getWaitlistOfferToken_(
      sheet.getRange(
        row,
        1
      )
    );

  if (
    !storedToken ||
    storedToken !==
      String(
        offerToken
      ).trim()
  ) {
    return {
      valid: false,
      reason:
        "This waitlist offer link is not valid.",
    };
  }

  const playersRequested =
    Number(
      sheet
        .getRange(
          row,
          7
        )
        .getValue() || 0
    );

  if (
    playerCount &&
    Number(
      playerCount
    ) >
      playersRequested
  ) {
    return {
      valid: false,
      reason:
        "This offer does not cover that many golfers.",
    };
  }

  return {
    valid: true,
    row,

    waitlistId:
      String(
        sheet
          .getRange(
            row,
            1
          )
          .getValue() || ""
      ).trim(),

    firstName:
      String(
        sheet
          .getRange(
            row,
            3
          )
          .getValue() || ""
      ).trim(),

    lastName:
      String(
        sheet
          .getRange(
            row,
            4
          )
          .getValue() || ""
      ).trim(),

    email:
      String(
        sheet
          .getRange(
            row,
            5
          )
          .getValue() || ""
      ).trim(),

    playersRequested,

    deadline:
      deadline.toISOString(),
  };
}


/* =========================================================
   CREATE / REPLACE PRIVATE OFFER TOKEN
========================================================= */

function createWaitlistOfferToken_(
  sheet,
  row
) {
  const token =
    Utilities.getUuid()
      .replace(/-/g, "") +
    Utilities.getUuid()
      .replace(/-/g, "");

  setWaitlistOfferToken_(
    sheet.getRange(
      row,
      1
    ),
    token
  );

  return token;
}


/* =========================================================
   EXPIRE OLD OFFERS
========================================================= */

function expireWaitlistOffers_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    return;
  }

  const rows =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        12
      )
      .getValues();

  const now =
    Date.now();

  rows.forEach(
    (
      rowValues,
      index
    ) => {
      const row =
        index + 2;

      const status =
        String(
          rowValues[7] || ""
        )
          .trim()
          .toLowerCase();

      if (
        status !==
        "registration offered"
      ) {
        return;
      }

      const deadline =
        rowValues[9];

      if (
        deadline instanceof Date &&
        !isNaN(
          deadline.getTime()
        ) &&
        deadline.getTime() <=
          now
      ) {
        sheet
          .getRange(
            row,
            8
          )
          .setValue(
            "Expired"
          );

        clearWaitlistOfferToken_(
          sheet.getRange(
            row,
            1
          )
        );

        appendWaitlistPriorityNote_(
          sheet,
          row,
          "Registration offer expired automatically."
        );
      }
    }
  );
}


/* =========================================================
   FIND WAITLIST ID
========================================================= */

function findWaitlistOfferRow_(
  sheet,
  waitlistId
) {
  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    return 0;
  }

  const ids =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getDisplayValues();

  const target =
    String(
      waitlistId || ""
    )
      .trim()
      .toUpperCase();

  for (
    let index = 0;
    index < ids.length;
    index++
  ) {
    const current =
      String(
        ids[index][0] || ""
      )
        .trim()
        .toUpperCase();

    if (
      current ===
      target
    ) {
      return (
        index + 2
      );
    }
  }

  return 0;
}


/* =========================================================
   OFFER TOKEN STORAGE

   Stored as a note on column A so we do not need another
   visible spreadsheet column.
========================================================= */

function getWaitlistOfferToken_(
  cell
) {
  const note =
    String(
      cell.getNote() || ""
    );

  const line =
    note
      .split("\n")
      .find(
        item =>
          item.startsWith(
            WAITLIST_OFFER_NOTE_PREFIX
          )
      );

  if (!line) {
    return "";
  }

  return line
    .substring(
      WAITLIST_OFFER_NOTE_PREFIX.length
    )
    .trim();
}


function setWaitlistOfferToken_(
  cell,
  token
) {
  const existing =
    String(
      cell.getNote() || ""
    );

  const preserved =
    existing
      .split("\n")
      .filter(
        line =>
          line &&
          !line.startsWith(
            WAITLIST_OFFER_NOTE_PREFIX
          )
      );

  preserved.push(
    WAITLIST_OFFER_NOTE_PREFIX +
      token
  );

  cell.setNote(
    preserved.join(
      "\n"
    )
  );
}


function clearWaitlistOfferToken_(
  cell
) {
  const existing =
    String(
      cell.getNote() || ""
    );

  const preserved =
    existing
      .split("\n")
      .filter(
        line =>
          line &&
          !line.startsWith(
            WAITLIST_OFFER_NOTE_PREFIX
          )
      );

  cell.setNote(
    preserved.join(
      "\n"
    )
  );
}


/* =========================================================
   COMPLETE WAITLIST ENTRY AFTER PAID REGISTRATION
========================================================= */

function completeWaitlistRegistration_(
  spreadsheet,
  waitlistId,
  registrationId
) {
  if (
    !waitlistId
  ) {
    return;
  }

  const sheet =
    spreadsheet.getSheetByName(
      WAITLIST_PRIORITY_SHEET
    );

  if (!sheet) {
    return;
  }

  const row =
    findWaitlistOfferRow_(
      sheet,
      waitlistId
    );

  if (!row) {
    return;
  }

  /*
    H = Status
  */
  sheet
    .getRange(
      row,
      8
    )
    .setValue(
      "Registered"
    );

  /*
    K = Registration ID
  */
  if (
    registrationId
  ) {
    sheet
      .getRange(
        row,
        11
      )
      .setValue(
        registrationId
      );
  }

  clearWaitlistOfferToken_(
    sheet.getRange(
      row,
      1
    )
  );

  appendWaitlistPriorityNote_(
    sheet,
    row,
    "Registration completed from waitlist offer."
  );
}


/* =========================================================
   NOTES
========================================================= */

function appendWaitlistPriorityNote_(
  sheet,
  row,
  message
) {
  const cell =
    sheet.getRange(
      row,
      12
    );

  const existing =
    String(
      cell.getValue() || ""
    ).trim();

  const timestamp =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm"
    );

  const note =
    message +
    " " +
    timestamp;

  cell.setValue(
    existing
      ? existing +
        " | " +
        note
      : note
  );
}


/* =========================================================
   PUBLIC WAITLIST-OFFER VALIDATION ENDPOINT
========================================================= */

function validateWaitlistOffer(
  data
) {
  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  const result =
    validateWaitlistOffer_(
      spreadsheet,
      data.waitlistId,
      data.offerToken,
      data.playerCount || null
    );

  return jsonResponse({
    ok: true,
    ...result,
  });
}