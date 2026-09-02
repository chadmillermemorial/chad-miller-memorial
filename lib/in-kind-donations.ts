export const CONTRIBUTION_TYPES = [
  "Physical Item / Merchandise",
  "Gift Card / Gift Certificate",
  "Service",
  "Experience",
  "Food / Beverage",
  "Event Supply / Equipment",
  "Other — Write In",
] as const;

export const INTENDED_USES = [
  "Silent Auction",
  "Contest Prize",
  "Event Supply / Operations",
  "Food & Beverage",
  "Participant / Volunteer Support",
  "Other — Write In",
] as const;

export const MAX_IN_KIND_FILES = 3;
export const MAX_IN_KIND_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IN_KIND_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
]);

function text(value: unknown) {
  return String(value ?? "").trim();
}

export function parseInKindMetadata(input: Record<string, unknown>) {
  const donorBusiness = text(input.donorBusiness);
  const contactName = text(input.contactName);
  const email = text(input.email);
  const phone = text(input.phone);
  const contributionType = text(input.contributionType);
  const contributionTypeWriteIn = text(input.contributionTypeWriteIn);
  const intendedUse = text(input.intendedUse);
  const intendedUseWriteIn = text(input.intendedUseWriteIn);
  const itemServiceName = text(input.itemServiceName);
  const description = text(input.description);
  const estimatedRetailValue = Number(input.estimatedRetailValue);
  const quantity = Number(input.quantity);
  const publicRecognition =
    text(input.publicRecognition) === "Yes" ? "Yes" : "No";

  if (
    !donorBusiness ||
    !contactName ||
    !email ||
    !phone ||
    !itemServiceName ||
    !description
  ) {
    throw new Error(
      "Please complete all required donor and contribution fields."
    );
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!CONTRIBUTION_TYPES.includes(contributionType as never)) {
    throw new Error("Please choose a valid contribution type.");
  }

  if (
    contributionType === "Other — Write In" &&
    !contributionTypeWriteIn
  ) {
    throw new Error(
      "Please provide the contribution type write-in description."
    );
  }

  if (!INTENDED_USES.includes(intendedUse as never)) {
    throw new Error("Please choose a valid intended use.");
  }

  if (
    intendedUse === "Other — Write In" &&
    !intendedUseWriteIn
  ) {
    throw new Error(
      "Please provide the intended-use write-in description."
    );
  }

  if (
    !Number.isFinite(estimatedRetailValue) ||
    estimatedRetailValue <= 0
  ) {
    throw new Error(
      "Estimated retail value must be greater than $0."
    );
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error(
      "Quantity must be a whole number of at least 1."
    );
  }

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
    restrictionsExpiration: text(input.restrictionsExpiration),
    redemptionInstructions: text(input.redemptionInstructions),
    websiteSocial: text(input.websiteSocial),
    dropOffPickupPlan: text(input.dropOffPickupPlan),
    publicRecognition,
    publicRecognitionName:
      publicRecognition === "Yes"
        ? text(input.publicRecognitionName) || donorBusiness
        : "",
    notes: text(input.notes),
  };
}

export function validateInKindFiles<
  T extends { name: string; type: string; size: number }
>(files: T[]) {
  if (files.length > MAX_IN_KIND_FILES) {
    throw new Error(
      "A maximum of 3 supporting files may be uploaded."
    );
  }

  for (const file of files) {
    const extension =
      file.name.toLowerCase().split(".").pop() || "";

    if (file.size > MAX_IN_KIND_FILE_BYTES) {
      throw new Error(
        "Each supporting file must be 10 MB or smaller."
      );
    }

    if (
      !ALLOWED_IN_KIND_MIME_TYPES.has(file.type) ||
      !ALLOWED_EXTENSIONS.has(extension)
    ) {
      throw new Error("Unsupported supporting file type.");
    }
  }

  return files;
}

export function buildCreateInKindPayload(
  metadata: Record<string, unknown>
) {
  return {
    action: "createInKindDonation",
    ...metadata,
  };
}

export function buildUploadInKindPayload(
  submissionId: string,
  fileName: string,
  mimeType: string,
  base64Data: string
) {
  return {
    action: "uploadInKindDonationFile",
    submissionId,
    fileName,
    mimeType,
    base64Data,
  };
}

export function buildFinalizeInKindPayload(
  submissionId: string
) {
  return {
    action: "finalizeInKindDonation",
    submissionId,
  };
}
