import { NextRequest, NextResponse } from "next/server";

import {
  followUpStages,
  type FollowUpPriority,
  type FollowUpStage
} from "@/lib/followUpPlanner";
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

function isValidFollowUpStage(value: unknown): value is FollowUpStage {
  return typeof value === "string" && followUpStages.includes(value as FollowUpStage);
}

function isValidFollowUpPriority(value: unknown): value is FollowUpPriority {
  return value === "High" || value === "Medium" || value === "Low";
}

function isValidIsoDate(value: unknown, allowEmpty = false) {
  if (allowEmpty && value === "") {
    return true;
  }

  return typeof value === "string" && !Number.isNaN(Date.parse(value));
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

  if ("followUpStage" in data) {
    if (!isValidFollowUpStage(data.followUpStage)) {
      return null;
    }

    updates.followUpStage = data.followUpStage;
  }

  if ("lastContactedAt" in data) {
    if (!isValidIsoDate(data.lastContactedAt, true)) {
      return null;
    }

    updates.lastContactedAt = data.lastContactedAt as string;
  }

  if ("nextAction" in data) {
    if (typeof data.nextAction !== "string") {
      return null;
    }

    updates.nextAction = data.nextAction;
  }

  if ("followUpDueAt" in data) {
    if (!isValidIsoDate(data.followUpDueAt)) {
      return null;
    }

    updates.followUpDueAt = data.followUpDueAt as string;
  }

  if ("followUpPriority" in data) {
    if (!isValidFollowUpPriority(data.followUpPriority)) {
      return null;
    }

    updates.followUpPriority = data.followUpPriority;
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
