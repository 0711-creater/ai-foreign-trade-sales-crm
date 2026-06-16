import { NextRequest, NextResponse } from "next/server";

import {
  getInquiryRecordById,
  inquiryRecordStatuses,
  updateInquiryRecord,
  type InquiryRecordStatus,
  type InquiryRecordUpdate
} from "@/lib/inquiryStore";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidStatus(value: unknown): value is InquiryRecordStatus {
  return typeof value === "string" && inquiryRecordStatuses.includes(value as InquiryRecordStatus);
}

function buildAllowedUpdates(body: unknown): InquiryRecordUpdate | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const data = body as Record<string, unknown>;
  const updates: InquiryRecordUpdate = {};

  if ("status" in data) {
    if (!isValidStatus(data.status)) {
      return null;
    }

    updates.status = data.status;
  }

  if ("followUpNote" in data) {
    if (typeof data.followUpNote !== "string") {
      return null;
    }

    updates.followUpNote = data.followUpNote;
  }

  if ("updatedAt" in data) {
    if (typeof data.updatedAt !== "string") {
      return null;
    }

    updates.updatedAt = data.updatedAt;
  }

  return updates;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const record = await getInquiryRecordById(id);

  if (!record) {
    return NextResponse.json({ error: "Inquiry record not found." }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const updates = buildAllowedUpdates(body);

  if (!updates) {
    return NextResponse.json({ error: "Invalid inquiry update data." }, { status: 400 });
  }

  const updatedRecord = await updateInquiryRecord(id, updates);

  if (!updatedRecord) {
    return NextResponse.json({ error: "Inquiry record not found." }, { status: 404 });
  }

  return NextResponse.json(updatedRecord);
}
