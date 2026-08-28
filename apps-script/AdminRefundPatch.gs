/*
  CSM Chad Miller Memorial - Admin Refund Apps Script patch source

  This file is a source-controlled reference for the complete replacement
  functions merged into the deployed Code.gs. Do not add this file beside
  Code.gs without removing the original same-named functions first.
*/

function getCapacity() {
  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  const playersSheet =
    spreadsheet.getSheetByName(
      PLAYERS_SHEET_NAME
    );

  const holdsSheet =
    spreadsheet.getSheetByName(
      HOLDS_SHEET_NAME
    );

  const paidPlayers =
    playersSheet
      ? countPaidPlayers(playersSheet)
      : 0;

  const activeHolds =
    holdsSheet
      ? countCurrentActiveHoldsReadOnly_(
          holdsSheet
        )
      : 0;

  const physicalRemaining =
    Math.max(
      MAX_PLAYERS -
        paidPlayers -
        activeHolds,
      0
    );

  const waitlistState =
    getWaitlistPriorityStateReadOnly_(
      spreadsheet
    );

  const publicRegistrationOpen =
    physicalRemaining > 0 &&
    !waitlistState.priorityActive;

  return jsonResponse({
    ok: true,
    maxPlayers: MAX_PLAYERS,
    paidPlayers,
    activeHolds,
    physicalRemaining,
    remaining:
      publicRegistrationOpen
        ? physicalRemaining
        : 0,
    full:
      physicalRemaining === 0,
    publicRegistrationOpen,
    waitlistPriorityActive:
      waitlistState.priorityActive,
    waitlistWaitingCount:
      waitlistState.waitingCount,
    waitlistOffersOutstanding:
      waitlistState.offersOutstanding,
  });
}

function countCurrentActiveHoldsReadOnly_(
  sheet
) {
  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return 0;
  }

  const rows =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        HOLD_HEADERS.length
      )
      .getValues();

  const now = Date.now();

  return rows.reduce(
    (total, row) => {
      const playerCount =
        Number(row[3]) || 0;

      const status =
        String(row[4] || "")
          .trim();

      if (
        status ===
        "Sponsor Reserved"
      ) {
        return total + playerCount;
      }

      if (status !== "Active") {
        return total;
      }

      const expiresAt =
        row[2] instanceof Date
          ? row[2].getTime()
          : new Date(
              row[2]
            ).getTime();

      if (
        Number.isFinite(expiresAt) &&
        expiresAt <= now
      ) {
        return total;
      }

      return total + playerCount;
    },
    0
  );
}

function getWaitlistPriorityStateReadOnly_(
  spreadsheet
) {
  const sheet =
    spreadsheet.getSheetByName(
      "Waitlist"
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

  const rows =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        12
      )
      .getValues();

  const now = Date.now();

  let waitingCount = 0;
  let offersOutstanding = 0;

  rows.forEach((row) => {
    const status =
      String(row[7] || "")
        .trim()
        .toLowerCase();

    if (
      status === "waiting" ||
      status === "contacted"
    ) {
      waitingCount++;
      return;
    }

    if (
      status !==
      "registration offered"
    ) {
      return;
    }

    const deadline = row[9];

    const deadlineTime =
      deadline instanceof Date
        ? deadline.getTime()
        : new Date(
            deadline
          ).getTime();

    if (
      Number.isFinite(
        deadlineTime
      ) &&
      deadlineTime <= now
    ) {
      return;
    }

    offersOutstanding++;
  });

  return {
    priorityActive:
      waitingCount > 0 ||
      offersOutstanding > 0,
    waitingCount,
    offersOutstanding,
  };
}

function saveSponsorRefund(data) {
  requireSponsorCapacityInternalKey_(
    data
  );

  if (
    !data.stripeSessionId ||
    !data.refundId
  ) {
    throw new Error(
      "Sponsor refund information is incomplete."
    );
  }

  assertStripeRefundActive_(data);

  const lock =
    LockService.getScriptLock();

  lock.waitLock(10000);

  try {
    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();

    const sponsorSheet =
      getOrCreateSponsorsSheet(
        spreadsheet
      );

    const sponsorRow =
      findSponsorRowByStripeSession_(
        sponsorSheet,
        data.stripeSessionId
      );

    if (!sponsorRow) {
      throw new Error(
        "The sponsor payment could not be found."
      );
    }

    const existingRefundId =
      String(
        sponsorSheet
          .getRange(
            sponsorRow,
            42
          )
          .getValue() || ""
      ).trim();

    if (
      existingRefundId &&
      existingRefundId ===
        String(data.refundId).trim()
    ) {
      /*
        Stripe may have succeeded while a prior
        roster/capacity synchronization attempt
        failed. Re-run the idempotent cleanup on
        duplicate delivery so recovery does not
        require another Stripe refund.
      */
      const capacityResult =
        refundSponsorCapacityHold_(
          spreadsheet,
          data.stripeSessionId,
          existingRefundId
        );

      return jsonResponse({
        ok: true,
        duplicate: true,
        refunded: true,
        stripeSessionId:
          data.stripeSessionId,
        refundId:
          existingRefundId,
        capacityReleased:
          capacityResult.capacityReleased,
        capacityPlayerCount:
          capacityResult.playerCount,
        convertedRosterNeedsRemoval:
          capacityResult.convertedRosterNeedsRemoval,
        convertedRosterRemoved:
          capacityResult.convertedRosterRemoved || false,
        convertedRosterPlayerCount:
          capacityResult.convertedRosterPlayerCount || 0,
      });
    }

    const refundAmount =
      Number(
        data.refundAmountCents || 0
      ) / 100;

    const processingFee =
      Number(
        data.processingFeeCents || 0
      ) / 100;

    const refundDate =
      data.refundDate
        ? new Date(data.refundDate)
        : new Date();

    sponsorSheet
      .getRange(
        sponsorRow,
        7
      )
      .setValue("No");

    // AE:AJ — remove active production/recognition status.
    sponsorSheet
      .getRange(
        sponsorRow,
        31,
        1,
        6
      )
      .setValues([[
        "Removed — Refunded",
        "Removed — Refunded",
        "Removed — Refunded",
        "Removed — Refunded",
        "Removed — Refunded",
        "No",
      ]]);

    // AL:AP — refund tracking.
    sponsorSheet
      .getRange(
        sponsorRow,
        38,
        1,
        5
      )
      .setValues([[
        "Refunded",
        refundAmount,
        processingFee,
        refundDate,
        data.refundId,
      ]]);

    const refundNote =
      [
        "Refunded " +
          refundDate.toISOString(),
        "Stripe Refund: " +
          data.refundId,
        "Refund: " +
          formatCurrency(
            refundAmount
          ),
        "Processing fee retained: " +
          formatCurrency(
            processingFee
          ),
      ].join(" | ");

    appendCellText_(
      sponsorSheet,
      sponsorRow,
      11,
      refundNote
    );

    appendCellText_(
      sponsorSheet,
      sponsorRow,
      37,
      refundNote
    );

    const capacityResult =
      refundSponsorCapacityHold_(
        spreadsheet,
        data.stripeSessionId,
        data.refundId
      );

    return jsonResponse({
      ok: true,
      refunded: true,
      stripeSessionId:
        data.stripeSessionId,
      refundId:
        data.refundId,
      refundAmount,
      processingFeeRetained:
        processingFee,
      capacityReleased:
        capacityResult.capacityReleased,
      capacityPlayerCount:
        capacityResult.playerCount,
      convertedRosterNeedsRemoval:
        capacityResult.convertedRosterNeedsRemoval,
      convertedRosterRemoved:
        capacityResult.convertedRosterRemoved || false,
      convertedRosterPlayerCount:
        capacityResult.convertedRosterPlayerCount || 0,
    });

  } finally {
    lock.releaseLock();
  }
}

function findSponsorRowByStripeSession_(
  sheet,
  stripeSessionId
) {
  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return 0;
  }

  const target =
    String(
      stripeSessionId || ""
    ).trim();

  const notes =
    sheet
      .getRange(
        2,
        11,
        lastRow - 1,
        1
      )
      .getValues()
      .flat();

  const index =
    notes.findIndex(
      (note) =>
        String(note).includes(
          target
        )
    );

  return index === -1
    ? 0
    : index + 2;
}

function refundSponsorCapacityHold_(
  spreadsheet,
  stripeSessionId,
  refundId
) {
  const holdsSheet =
    getOrCreateHoldsSheet(
      spreadsheet
    );

  const lastRow =
    holdsSheet.getLastRow();

  if (lastRow < 2) {
    return {
      capacityReleased: false,
      playerCount: 0,
      convertedRosterNeedsRemoval:
        false,
      convertedRosterRemoved:
        false,
      convertedRosterPlayerCount:
        0,
    };
  }

  const rows =
    holdsSheet
      .getRange(
        2,
        1,
        lastRow - 1,
        HOLD_HEADERS.length
      )
      .getValues();

  const target =
    String(
      stripeSessionId || ""
    ).trim();

  const index =
    rows.findIndex(
      (row) =>
        String(
          row[5] || ""
        ).trim() === target
    );

  if (index === -1) {
    return {
      capacityReleased: false,
      playerCount: 0,
      convertedRosterNeedsRemoval:
        false,
      convertedRosterRemoved:
        false,
      convertedRosterPlayerCount:
        0,
    };
  }

  const rowNumber =
    index + 2;

  const previousStatus =
    String(
      rows[index][4] || ""
    ).trim();

  const playerCount =
    Number(
      rows[index][3] || 0
    );

  let convertedRosterResult = {
    matchedPlayerCount: 0,
    newlyWithdrawnCount: 0,
  };

  if (
    previousStatus ===
    "Converted"
  ) {
    /*
      Contract for sponsor-included golfer rosters:
      their Players/Pairings Registration ID is the
      sponsor Stripe Checkout Session ID. This gives
      refund cleanup one immutable transaction key.
    */
    convertedRosterResult =
      withdrawConvertedSponsorGolfers_(
        spreadsheet,
        target,
        refundId,
        playerCount
      );
  }

  /*
    Only mark the hold Refunded after any converted
    roster has been safely matched and withdrawn.
    If matching fails, throw before changing the hold
    so an idempotent retry can recover later.
  */
  holdsSheet
    .getRange(
      rowNumber,
      5
    )
    .setValue(
      "Refunded"
    );

  const convertedRosterRemoved =
    previousStatus ===
      "Converted" &&
    convertedRosterResult
      .matchedPlayerCount ===
      playerCount;

  return {
    capacityReleased:
      previousStatus ===
        "Sponsor Reserved" ||
      previousStatus ===
        "Active" ||
      convertedRosterRemoved,
    playerCount,
    convertedRosterNeedsRemoval:
      false,
    convertedRosterRemoved,
    convertedRosterPlayerCount:
      convertedRosterResult
        .matchedPlayerCount,
    previousStatus,
    refundId,
  };
}

function withdrawConvertedSponsorGolfers_(
  spreadsheet,
  stripeSessionId,
  refundId,
  expectedPlayerCount
) {
  const playersSheet =
    getOrCreatePlayersSheet(
      spreadsheet
    );

  const lastRow =
    playersSheet.getLastRow();

  if (lastRow < 2) {
    throw new Error(
      "The sponsor roster is marked Converted, but no player rows exist."
    );
  }

  const rows =
    playersSheet
      .getRange(
        2,
        1,
        lastRow - 1,
        PLAYER_HEADERS.length
      )
      .getValues();

  const target =
    String(
      stripeSessionId || ""
    ).trim();

  const matches = [];

  rows.forEach(
    (row, index) => {
      if (
        String(
          row[0] || ""
        ).trim() === target
      ) {
        matches.push({
          row,
          rowNumber:
            index + 2,
        });
      }
    }
  );

  const expected =
    Number(
      expectedPlayerCount || 0
    );

  if (
    expected <= 0 ||
    matches.length !== expected
  ) {
    throw new Error(
      "The sponsor roster is marked Converted, but its player rows could not be matched safely by Stripe Session ID."
    );
  }

  let newlyWithdrawnCount = 0;

  matches.forEach(
    (match) => {
      const row = match.row;
      const rowNumber =
        match.rowNumber;

      const currentStatus =
        String(
          row[2] || ""
        ).trim();

      const existingRefundId =
        String(
          row[23] || ""
        ).trim();

      if (
        existingRefundId &&
        existingRefundId !==
          String(refundId).trim()
      ) {
        throw new Error(
          "A sponsor-funded golfer already has a different refund record and requires manual review."
        );
      }

      const alreadyInactive =
        currentStatus ===
          "Sponsor Refunded" ||
        currentStatus ===
          "Refunded" ||
        currentStatus ===
          "Withdrawn";

      if (
        currentStatus !== "Paid" &&
        !alreadyInactive
      ) {
        throw new Error(
          "A sponsor-funded golfer has an unexpected player status and requires manual review."
        );
      }

      if (!alreadyInactive) {
        playersSheet
          .getRange(
            rowNumber,
            3
          )
          .setValue(
            "Sponsor Refunded"
          );

        newlyWithdrawnCount++;
      }

      const existingNotes =
        String(
          playersSheet
            .getRange(
              rowNumber,
              20
            )
            .getValue() || ""
        ).trim();

      const refundMarker =
        "Sponsor Stripe Refund: " +
        refundId;

      if (
        !existingNotes.includes(
          refundMarker
        )
      ) {
        appendCellText_(
          playersSheet,
          rowNumber,
          20,
          [
            "Sponsor payment refunded " +
              new Date().toISOString(),
            refundMarker,
            "No player-level payment was charged",
          ].join(" | ")
        );
      }

      if (!existingRefundId) {
        playersSheet
          .getRange(
            rowNumber,
            23
          )
          .setValue(
            new Date()
          );

        playersSheet
          .getRange(
            rowNumber,
            24
          )
          .setValue(
            refundId
          );
      }

      markSponsorPairingWithdrawn_(
        spreadsheet,
        target,
        Number(row[5]),
        refundId
      );
    }
  );

  return {
    matchedPlayerCount:
      matches.length,
    newlyWithdrawnCount,
  };
}

function markSponsorPairingWithdrawn_(
  spreadsheet,
  registrationId,
  playerNumber,
  refundId
) {
  const sheet =
    spreadsheet.getSheetByName(
      PAIRINGS_SHEET_NAME
    );

  if (!sheet) {
    return;
  }

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  const rows =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        PAIRING_HEADERS.length
      )
      .getValues();

  rows.forEach(
    (row, index) => {
      if (
        String(
          row[3] || ""
        ).trim() ===
          String(
            registrationId || ""
          ).trim() &&
        Number(row[4]) ===
          Number(playerNumber)
      ) {
        const rowNumber =
          index + 2;

        if (
          String(
            row[10] || ""
          ).trim() !==
          "Withdrawn"
        ) {
          sheet
            .getRange(
              rowNumber,
              11
            )
            .setValue(
              "Withdrawn"
            );
        }

        const existingNotes =
          String(
            sheet
              .getRange(
                rowNumber,
                12
              )
              .getValue() || ""
          ).trim();

        const note =
          "Sponsor refunded — " +
          refundId;

        if (
          !existingNotes.includes(
            note
          )
        ) {
          appendCellText_(
            sheet,
            rowNumber,
            12,
            note
          );
        }
      }
    }
  );
}
