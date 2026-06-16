import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AnalysisMode, PurchaseIntent, QuotationReadiness } from "@/lib/aiInquiryAnalyzer";
import type { QuotationInput, QuotationResult } from "@/lib/quotationCalculator";
import type { QuotationReview } from "@/lib/quotationReviewer";

export const inquiryRecordStatuses = [
  "New",
  "Contacted",
  "Quoted",
  "Follow-up",
  "Closed",
  "Lost"
] as const;

export type InquiryRecordStatus = (typeof inquiryRecordStatuses)[number];

export type InquiryRecordUpdate = {
  status?: InquiryRecordStatus;
  followUpNote?: string;
  updatedAt?: string;
};

export type QuotationMode = "deepseek" | "mock";

export type QuotationRecord = {
  id: string;
  createdAt: string;
  quotationInput: QuotationInput;
  quotation: QuotationResult;
  quotationEmail: string;
  quotationMode: QuotationMode;
  quotationReview?: QuotationReview;
};

export type InquiryRecord = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  company: string;
  country: string;
  interestedProduct: string;
  quantity: string;
  message: string;
  customerType: string;
  purchaseIntent: PurchaseIntent;
  inquirySummary: string;
  suggestedReplyEmail: string;
  whatsappFollowUpMessage: string;
  nextFollowUpSuggestion: string;
  quotationReadiness: QuotationReadiness;
  missingInformation: string[];
  requiredQuestions: string[];
  quotationRisk: string;
  recommendedNextAction: string;
  mode: AnalysisMode;
  fallbackReason?: string;
  status: InquiryRecordStatus;
  source: "Website Inquiry";
  followUpNote?: string;
  updatedAt?: string;
  quotations?: QuotationRecord[];
};

const storageDirectory = path.join(process.cwd(), "storage");
const inquiriesFilePath = path.join(storageDirectory, "inquiries.json");

export const localJsonStorageWarning =
  "Local JSON storage is not available or not persistent in the current deployment environment.";

async function ensureStorageFile() {
  // 本地 MVP 使用 JSON 文件保存询盘；正式项目应替换为数据库。
  await mkdir(storageDirectory, { recursive: true });

  try {
    await readFile(inquiriesFilePath, "utf8");
  } catch {
    await writeFile(inquiriesFilePath, "[]", "utf8");
  }
}

export async function getInquiryRecordsWithStatus(): Promise<{
  records: InquiryRecord[];
  warning?: string;
}> {
  try {
    await ensureStorageFile();
    const fileContent = await readFile(inquiriesFilePath, "utf8");
    const parsedRecords = JSON.parse(fileContent) as unknown;

    return {
      records: Array.isArray(parsedRecords) ? (parsedRecords as InquiryRecord[]) : []
    };
  } catch (error) {
    console.error("Failed to read inquiry records:", error);

    return {
      records: [],
      warning: localJsonStorageWarning
    };
  }
}

export async function getInquiryRecords(): Promise<InquiryRecord[]> {
  const result = await getInquiryRecordsWithStatus();

  return result.records;
}

export async function saveInquiryRecord(record: InquiryRecord) {
  try {
    await ensureStorageFile();
    const existingRecords = await getInquiryRecords();
    const nextRecords = [record, ...existingRecords];

    await writeFile(inquiriesFilePath, JSON.stringify(nextRecords, null, 2), "utf8");

    return record;
  } catch (error) {
    console.error("Failed to save inquiry record:", error);
    throw new Error(localJsonStorageWarning);
  }
}

export async function getInquiryRecordById(id: string) {
  const records = await getInquiryRecords();

  return records.find((record) => record.id === id) ?? null;
}

export async function updateInquiryRecord(id: string, updates: InquiryRecordUpdate) {
  const records = await getInquiryRecords();
  const targetIndex = records.findIndex((record) => record.id === id);

  if (targetIndex === -1) {
    return null;
  }

  // 只合并允许更新的 CRM 字段，避免覆盖原始询盘和 AI 分析内容。
  const updatedRecord: InquiryRecord = {
    ...records[targetIndex],
    ...updates,
    updatedAt: updates.updatedAt ?? new Date().toISOString()
  };

  const nextRecords = [...records];
  nextRecords[targetIndex] = updatedRecord;

  await writeFile(inquiriesFilePath, JSON.stringify(nextRecords, null, 2), "utf8");

  return updatedRecord;
}

export async function addQuotationToInquiry(id: string, quotationRecord: QuotationRecord) {
  const records = await getInquiryRecords();
  const targetIndex = records.findIndex((record) => record.id === id);

  if (targetIndex === -1) {
    return null;
  }

  // 报价历史保存在当前询盘记录内，方便本地 JSON CRM 演示。
  const existingQuotations = records[targetIndex].quotations ?? [];
  const updatedRecord: InquiryRecord = {
    ...records[targetIndex],
    quotations: [quotationRecord, ...existingQuotations],
    updatedAt: new Date().toISOString()
  };

  const nextRecords = [...records];
  nextRecords[targetIndex] = updatedRecord;

  await writeFile(inquiriesFilePath, JSON.stringify(nextRecords, null, 2), "utf8");

  return updatedRecord;
}
