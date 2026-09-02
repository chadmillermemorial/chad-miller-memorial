import assert from "node:assert/strict";
import test from "node:test";

async function loadModule() {
  return await import("./in-kind-donations.ts");
}

test("accepts presets and free-text description", async () => {
  const { parseInKindMetadata } = await loadModule();
  const value = parseInKindMetadata({
    donorBusiness: "Pinehurst Example",
    contactName: "Alex Donor",
    email: "alex@example.com",
    phone: "910-555-0100",
    contributionType: "Experience",
    contributionTypeWriteIn: "",
    intendedUse: "Silent Auction",
    intendedUseWriteIn: "",
    itemServiceName: "Golf Experience",
    description: "Round of golf for four guests.",
    estimatedRetailValue: "500",
    quantity: "1",
    restrictionsExpiration: "Expires 12/31/2027",
    redemptionInstructions: "Call to schedule.",
    websiteSocial: "https://example.com",
    dropOffPickupPlan: "Electronic certificate",
    publicRecognition: "Yes",
    publicRecognitionName: "Pinehurst Example",
    notes: "",
  });

  assert.equal(value.estimatedRetailValue, 500);
  assert.equal(value.quantity, 1);
  assert.equal(value.description, "Round of golf for four guests.");
});

test("requires contribution type write-in when Other is selected", async () => {
  const { parseInKindMetadata } = await loadModule();
  assert.throws(
    () => parseInKindMetadata({
      donorBusiness: "Donor",
      contactName: "Alex",
      email: "alex@example.com",
      phone: "9105550100",
      contributionType: "Other — Write In",
      contributionTypeWriteIn: "",
      intendedUse: "Other — Write In",
      intendedUseWriteIn: "Tournament support",
      itemServiceName: "Custom contribution",
      description: "Written description is supplied.",
      estimatedRetailValue: "25",
      quantity: "1",
      publicRecognition: "No",
    }),
    /write-in/i
  );
});

test("defaults recognition name to donor business", async () => {
  const { parseInKindMetadata } = await loadModule();
  const value = parseInKindMetadata({
    donorBusiness: "Example Family",
    contactName: "Alex",
    email: "alex@example.com",
    phone: "9105550100",
    contributionType: "Physical Item / Merchandise",
    intendedUse: "Contest Prize",
    itemServiceName: "Golf Bag",
    description: "New golf bag.",
    estimatedRetailValue: "250",
    quantity: "1",
    publicRecognition: "Yes",
    publicRecognitionName: "",
  });
  assert.equal(value.publicRecognitionName, "Example Family");
});

test("rejects invalid file count, size and type", async () => {
  const {
    validateInKindFiles,
    MAX_IN_KIND_FILE_BYTES,
  } = await loadModule();

  const makeFile = (name, type, size = 10) => ({ name, type, size });

  assert.throws(
    () => validateInKindFiles([
      makeFile("1.pdf", "application/pdf"),
      makeFile("2.pdf", "application/pdf"),
      makeFile("3.pdf", "application/pdf"),
      makeFile("4.pdf", "application/pdf"),
    ]),
    /maximum of 3/i
  );

  assert.throws(
    () => validateInKindFiles([
      makeFile("large.pdf", "application/pdf", MAX_IN_KIND_FILE_BYTES + 1),
    ]),
    /10 MB/i
  );

  assert.throws(
    () => validateInKindFiles([
      makeFile("script.exe", "application/octet-stream"),
    ]),
    /file type/i
  );
});
