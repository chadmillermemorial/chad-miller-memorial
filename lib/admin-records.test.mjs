import assert from "node:assert/strict";
import test from "node:test";

async function loadAdminRecords() {
  try {
    return await import("./admin-records.ts");
  } catch (error) {
    assert.fail(
      `Expected lib/admin-records.ts to implement admin record classification: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

const paidBase = {
  amount_total: 10000,
  payment_status: "paid",
  created: 1787880000,
  customer_details: {
    email: "customer@example.test",
  },
};

test("classifies paid donations from trusted Stripe metadata", async () => {
  const { toAdminCheckoutRecord } = await loadAdminRecords();

  const record = toAdminCheckoutRecord({
    ...paidBase,
    id: "cs_test_donation",
    metadata: {
      paymentType: "donation",
      donorName: "Community Donor",
      email: "donor@example.test",
      publicRecognitionName: "Donor Family",
    },
  });

  assert.equal(record?.type, "donation");
  assert.equal(record?.title, "Community Donor");
  assert.equal(record?.email, "donor@example.test");
});

test("classifies paid sponsorships from trusted Stripe metadata", async () => {
  const { toAdminCheckoutRecord } = await loadAdminRecords();

  const record = toAdminCheckoutRecord({
    ...paidBase,
    id: "cs_test_sponsor",
    amount_total: 250000,
    metadata: {
      paymentType: "sponsorship",
      company: "Example Company",
      contactName: "Sponsor Contact",
      email: "sponsor@example.test",
      sponsorLevel: "Blue Sponsor",
    },
  });

  assert.equal(record?.type, "sponsorship");
  assert.equal(record?.title, "Example Company");
  assert.match(record?.subtitle || "", /Blue Sponsor/);
});

test("classifies normal player registrations without a paymentType marker", async () => {
  const { toAdminCheckoutRecord } = await loadAdminRecords();

  const record = toAdminCheckoutRecord({
    ...paidBase,
    id: "cs_test_players",
    amount_total: 30000,
    metadata: {
      playerCount: "4",
      teamName: "Test Foursome",
      p1FirstName: "Alpha",
      p1LastName: "Golfer",
      p1Email: "alpha@example.test",
      p2FirstName: "Beta",
      p2LastName: "Golfer",
      p3FirstName: "Gamma",
      p3LastName: "Golfer",
      p4FirstName: "Delta",
      p4LastName: "Golfer",
    },
  });

  assert.equal(record?.type, "player");
  assert.equal(record?.title, "Test Foursome");
  assert.match(record?.searchText || "", /Alpha Golfer/i);
  assert.match(record?.searchText || "", /Delta Golfer/i);
});

test("ignores unpaid or unrecognized Checkout sessions", async () => {
  const { toAdminCheckoutRecord } = await loadAdminRecords();

  assert.equal(
    toAdminCheckoutRecord({
      ...paidBase,
      id: "cs_test_unpaid",
      payment_status: "unpaid",
      metadata: { paymentType: "donation" },
    }),
    null
  );

  assert.equal(
    toAdminCheckoutRecord({
      ...paidBase,
      id: "cs_test_unknown",
      metadata: {},
    }),
    null
  );
});

test("filters records by type and case-insensitive name email or session search", async () => {
  const {
    filterAdminCheckoutRecords,
    toAdminCheckoutRecord,
  } = await loadAdminRecords();

  const records = [
    toAdminCheckoutRecord({
      ...paidBase,
      id: "cs_test_donation_123",
      metadata: {
        paymentType: "donation",
        donorName: "Community Donor",
        email: "donor@example.test",
      },
    }),
    toAdminCheckoutRecord({
      ...paidBase,
      id: "cs_test_sponsor_456",
      metadata: {
        paymentType: "sponsorship",
        company: "Example Company",
        contactName: "Sponsor Contact",
        email: "sponsor@example.test",
        sponsorLevel: "Grey Sponsor",
      },
    }),
  ].filter(Boolean);

  assert.equal(
    filterAdminCheckoutRecords(records, "donation", "DONOR").length,
    1
  );
  assert.equal(
    filterAdminCheckoutRecords(records, "sponsorship", "sponsor@example.test").length,
    1
  );
  assert.equal(
    filterAdminCheckoutRecords(records, "all", "cs_test_sponsor_456").length,
    1
  );
});
