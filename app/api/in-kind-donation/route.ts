import { NextResponse } from "next/server";
import {
  buildCreateInKindPayload,
  buildFinalizeInKindPayload,
  buildUploadInKindPayload,
  parseInKindMetadata,
  validateInKindFiles,
} from "@/lib/in-kind-donations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const googleScriptInternalKey =
  process.env.GOOGLE_SCRIPT_INTERNAL_KEY;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

class UserInputError extends Error {}

async function callAppsScript(payload: Record<string, unknown>) {
  if (!googleScriptInternalKey) {
    throw new Error("GOOGLE_SCRIPT_INTERNAL_KEY is not configured.");
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      internalKey: googleScriptInternalKey,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Tournament contribution service returned status ${response.status}.`
    );
  }

  const result = await response.json();

  if (!result?.ok) {
    throw new Error(
      result?.error || "The tournament contribution service rejected the request."
    );
  }

  return result;
}

function submissionIdFrom(value: unknown) {
  const submissionId = String(value ?? "").trim();

  if (!/^IK-2026-\d{4,}$/.test(submissionId)) {
    throw new UserInputError("Invalid in-kind contribution submission ID.");
  }

  return submissionId;
}

function donorSafeError(error: unknown) {
  if (error instanceof UserInputError) {
    return {
      status: 400,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    const validationMessages = [
      "Please complete",
      "Please enter",
      "Please choose",
      "Please provide",
      "Estimated retail value",
      "Quantity must",
      "maximum of 3",
      "4 MB",
      "Unsupported supporting file type",
    ];

    if (validationMessages.some((prefix) => error.message.includes(prefix))) {
      return {
        status: 400,
        message: error.message,
      };
    }
  }

  console.error("In-kind donation API error:", error);

  return {
    status: 502,
    message:
      "We could not complete your contribution submission. Please try again or contact the tournament team.",
  };
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.toLowerCase().includes("multipart/form-data")) {
      const form = await request.formData();
      const phase = String(form.get("phase") || "").trim();

      if (phase === "upload") {
        const submissionId = submissionIdFrom(form.get("submissionId"));
        const rawFiles = form.getAll("file");
        const files = rawFiles.filter(
          (value): value is File => value instanceof File
        );

        if (rawFiles.length !== 1 || files.length !== 1) {
          throw new UserInputError(
            "Upload exactly one supporting file at a time."
          );
        }

        validateInKindFiles(files);

        const file = files[0];
        const base64Data = Buffer.from(
          await file.arrayBuffer()
        ).toString("base64");

        const result = await callAppsScript(
          buildUploadInKindPayload(
            submissionId,
            file.name,
            file.type,
            base64Data
          )
        );

        return NextResponse.json({
          ok: true,
          submissionId,
          fileUrl: result.fileUrl || "",
        });
      }

      throw new UserInputError("Invalid in-kind contribution upload phase.");
    }

    const body = await request.json();
    const phase = String(body?.phase || "").trim();

    if (phase === "create") {
      const companyWebsite = String(
        body?.companyWebsite ?? ""
      ).trim();

      if (companyWebsite) {
        throw new UserInputError("Automated submission rejected.");
      }

      const metadata = parseInKindMetadata(body?.metadata || {});
      const result = await callAppsScript(
        buildCreateInKindPayload(metadata)
      );
      const submissionId = submissionIdFrom(result.submissionId);

      return NextResponse.json({
        ok: true,
        submissionId,
      });
    }

    if (phase === "finalize") {
      const submissionId = submissionIdFrom(body?.submissionId);
      const attachmentIssue = body?.attachmentIssue === true;

      await callAppsScript({
        ...buildFinalizeInKindPayload(submissionId),
        attachmentIssue,
      });

      return NextResponse.json({
        ok: true,
        submissionId,
        confirmationUrl:
          `/register/donate/in-kind/confirmation?submissionId=${encodeURIComponent(
            submissionId
          )}`,
      });
    }

    throw new UserInputError("Invalid in-kind contribution request phase.");
  } catch (error) {
    const safe = donorSafeError(error);

    return NextResponse.json(
      {
        ok: false,
        error: safe.message,
      },
      { status: safe.status }
    );
  }
}
