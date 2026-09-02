/*
  CSM Chad Miller Memorial - In-Kind Donation Security Router Patch

  Source-controlled reference for the bound Apps Script Code.gs.
  The live Code.gs should run this gate immediately after parsing the
  incoming JSON payload and before dispatching any action.

  This reuses the existing Google Script internal key already used by
  sponsor-capacity requests. Vercel sends GOOGLE_SCRIPT_INTERNAL_KEY as
  data.internalKey, and Apps Script compares it against the existing
  SPONSOR_CAPACITY_INTERNAL_KEY script property.

  ROUTER INSERTION:

  if (
    data.action === "createInKindDonation" ||
    data.action === "uploadInKindDonationFile" ||
    data.action === "finalizeInKindDonation"
  ) {
    requireSponsorCapacityInternalKey_(data);
  }
*/
