import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AnalysisMode, LeadPriority, PurchaseIntent, QuotationReadiness } from "@/lib/aiInquiryAnalyzer";
import type { QuotationInput, QuotationResult } from "@/lib/quotationCalculator";
import type { QuotationReview } from "@/lib/quotationReviewer";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const inquiryRecordStatuses = [
  "New",
  "Contacted",
  "Quoted",
  "Follow-up",
  "Closed",
  "Lost"
] as const;

export type InquiryRecordStatus = (typeof inquiryRecordStatuses)[number];

export type StorageMode = "supabase" | "local-json";

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
  leadScore: number;
  leadPriority: LeadPriority;
  leadScoreReason: string;
  recommendedFollowUpTime: string;
  salesStrategy: string;
  mode: AnalysisMode;
  fallbackReason?: string;
  status: InquiryRecordStatus;
  source: "Website Inquiry";
  followUpNote?: string;
  updatedAt?: string;
  quotations?: QuotationRecord[];
};

type DbInquiryRecord = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company: string;
  country: string;
  interested_product: string;
  quantity: string;
  message: string;
  customer_type: string;
  purchase_intent: PurchaseIntent;
  inquiry_summary: string;
  suggested_reply_email: string;
  whatsapp_follow_up_message: string;
  next_follow_up_suggestion: string;
  quotation_readiness: QuotationReadiness;
  missing_information: string[];
  required_questions: string[];
  quotation_risk: string;
  recommended_next_action: string;
  lead_score?: number | null;
  lead_priority?: LeadPriority | null;
  lead_score_reason?: string | null;
  recommended_follow_up_time?: string | null;
  sales_strategy?: string | null;
  mode: AnalysisMode;
  fallback_reason?: string | null;
  status: InquiryRecordStatus;
  source: "Website Inquiry";
  follow_up_note?: string | null;
  updated_at?: string | null;
  quotations?: QuotationRecord[] | null;
};

const storageDirectory = path.join(process.cwd(), "storage");
const inquiriesFilePath = path.join(storageDirectory, "inquiries.json");

export const localJsonStorageWarning =
  "Local JSON storage is not available or not persistent in the current deployment environment.";
export const supabaseUnavailableWarning =
  "Supabase is not configured. Falling back to local JSON storage for development only.";

export function toDbRecord(record: InquiryRecord): DbInquiryRecord {
  // Supabase insert 只写入 inquiries 表明确需要的业务字段。
  // fallbackReason / saved / saveWarning / storageMode 属于运行时调试信息，不默认写入数据库，避免缺列时报 PGRST204。
  return {
    id: record.id,
    created_at: record.createdAt,
    name: record.name,
    email: record.email,
    company: record.company,
    country: record.country,
    interested_product: record.interestedProduct,
    quantity: record.quantity,
    message: record.message,
    customer_type: record.customerType,
    purchase_intent: record.purchaseIntent,
    inquiry_summary: record.inquirySummary,
    suggested_reply_email: record.suggestedReplyEmail,
    whatsapp_follow_up_message: record.whatsappFollowUpMessage,
    next_follow_up_suggestion: record.nextFollowUpSuggestion,
    quotation_readiness: record.quotationReadiness,
    missing_information: record.missingInformation,
    required_questions: record.requiredQuestions,
    quotation_risk: record.quotationRisk,
    recommended_next_action: record.recommendedNextAction,
    lead_score: record.leadScore,
    lead_priority: record.leadPriority,
    lead_score_reason: record.leadScoreReason,
    recommended_follow_up_time: record.recommendedFollowUpTime,
    sales_strategy: record.salesStrategy,
    mode: record.mode,
    status: record.status,
    source: record.source,
    follow_up_note: record.followUpNote ?? null,
    updated_at: record.updatedAt ?? null,
    quotations: record.quotations ?? []
  };
}

export function fromDbRecord(row: DbInquiryRecord): InquiryRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    email: row.email,
    company: row.company,
    country: row.country,
    interestedProduct: row.interested_product,
    quantity: row.quantity,
    message: row.message,
    customerType: row.customer_type,
    purchaseIntent: row.purchase_intent,
    inquirySummary: row.inquiry_summary,
    suggestedReplyEmail: row.suggested_reply_email,
    whatsappFollowUpMessage: row.whatsapp_follow_up_message,
    nextFollowUpSuggestion: row.next_follow_up_suggestion,
    quotationReadiness: row.quotation_readiness,
    missingInformation: row.missing_information ?? [],
    requiredQuestions: row.required_questions ?? [],
    quotationRisk: row.quotation_risk,
    recommendedNextAction: row.recommended_next_action,
    leadScore: row.lead_score ?? 0,
    leadPriority: row.lead_priority ?? "Low",
    leadScoreReason: row.lead_score_reason ?? "Lead scoring was not available for this record.",
    recommendedFollowUpTime: row.recommended_follow_up_time ?? "Not specified",
    salesStrategy: row.sales_strategy ?? "No sales strategy recorded.",
    mode: row.mode,
    fallbackReason: row.fallback_reason ?? undefined,
    status: row.status,
    source: row.source,
    followUpNote: row.follow_up_note ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    quotations: row.quotations ?? []
  };
}

function getSupabaseClient() {
  return getSupabaseServerClient();
}

async function ensureStorageFile() {
  // 本地 MVP fallback 使用 JSON 文件；生产环境应使用 Supabase 或其他数据库。
  await mkdir(storageDirectory, { recursive: true });

  try {
    await readFile(inquiriesFilePath, "utf8");
  } catch {
    await writeFile(inquiriesFilePath, "[]", "utf8");
  }
}

async function getLocalInquiryRecordsWithStatus(): Promise<{
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
    console.error("Failed to read local inquiry records:", error);

    return {
      records: [],
      warning: localJsonStorageWarning
    };
  }
}

async function saveLocalInquiryRecord(record: InquiryRecord) {
  try {
    await ensureStorageFile();
    const { records } = await getLocalInquiryRecordsWithStatus();
    const nextRecords = [record, ...records];

    await writeFile(inquiriesFilePath, JSON.stringify(nextRecords, null, 2), "utf8");

    return {
      saved: true,
      storageMode: "local-json" as StorageMode,
      recordId: record.id
    };
  } catch (error) {
    console.error("Failed to save local inquiry record:", error);
    throw new Error(localJsonStorageWarning);
  }
}

export async function getInquiryRecordsWithStatus(): Promise<{
  records: InquiryRecord[];
  storageMode: StorageMode;
  warning?: string;
}> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return {
        records: ((data ?? []) as DbInquiryRecord[]).map(fromDbRecord),
        storageMode: "supabase"
      };
    } catch (error) {
      console.error("Failed to read Supabase inquiry records:", error);
    }
  }

  const localResult = await getLocalInquiryRecordsWithStatus();

  return {
    records: localResult.records,
    storageMode: "local-json",
    warning: localResult.warning ?? supabaseUnavailableWarning
  };
}

export async function getInquiryRecords(): Promise<InquiryRecord[]> {
  const result = await getInquiryRecordsWithStatus();

  return result.records;
}

export async function saveInquiryRecord(record: InquiryRecord) {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await supabase.from("inquiries").insert(toDbRecord(record));

      if (error) {
        throw error;
      }

      return {
        saved: true,
        storageMode: "supabase" as StorageMode,
        recordId: record.id
      };
    } catch (error) {
      console.error("Failed to save Supabase inquiry record:", error);
    }
  }

  return saveLocalInquiryRecord(record);
}

export async function getInquiryRecordById(id: string) {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.from("inquiries").select("*").eq("id", id).single();

      if (error) {
        throw error;
      }

      return fromDbRecord(data as DbInquiryRecord);
    } catch (error) {
      console.error("Failed to read Supabase inquiry record:", error);
    }
  }

  const records = await getInquiryRecords();

  return records.find((record) => record.id === id) ?? null;
}

function toDbUpdates(updates: InquiryRecordUpdate) {
  return {
    ...(updates.status ? { status: updates.status } : {}),
    ...("followUpNote" in updates ? { follow_up_note: updates.followUpNote ?? null } : {}),
    updated_at: updates.updatedAt ?? new Date().toISOString()
  };
}

export async function updateInquiryRecord(id: string, updates: InquiryRecordUpdate) {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .update(toDbUpdates(updates))
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return fromDbRecord(data as DbInquiryRecord);
    } catch (error) {
      console.error("Failed to update Supabase inquiry record:", error);
    }
  }

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

  await ensureStorageFile();
  await writeFile(inquiriesFilePath, JSON.stringify(nextRecords, null, 2), "utf8");

  return updatedRecord;
}

export async function addQuotationToInquiry(id: string, quotationRecord: QuotationRecord) {
  const currentRecord = await getInquiryRecordById(id);

  if (!currentRecord) {
    return null;
  }

  const updatedQuotations = [quotationRecord, ...(currentRecord.quotations ?? [])];
  const updatedAt = new Date().toISOString();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .update({
          quotations: updatedQuotations,
          updated_at: updatedAt
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return fromDbRecord(data as DbInquiryRecord);
    } catch (error) {
      console.error("Failed to save Supabase quotation record:", error);
    }
  }

  const records = await getInquiryRecords();
  const targetIndex = records.findIndex((record) => record.id === id);

  if (targetIndex === -1) {
    return null;
  }

  // 报价历史保存在当前询盘记录内，方便本地 JSON CRM 演示。
  const updatedRecord: InquiryRecord = {
    ...records[targetIndex],
    quotations: updatedQuotations,
    updatedAt
  };
  const nextRecords = [...records];
  nextRecords[targetIndex] = updatedRecord;

  await ensureStorageFile();
  await writeFile(inquiriesFilePath, JSON.stringify(nextRecords, null, 2), "utf8");

  return updatedRecord;
}
