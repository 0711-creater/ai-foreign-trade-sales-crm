import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  analyzeInquiry,
  type FallbackReason,
  type InquiryAnalysisResult,
  type InquiryData
} from "@/lib/aiInquiryAnalyzer";
import { sendInquiryNotification } from "@/lib/emailNotifier";
import type { InquiryRecord } from "@/lib/inquiryStore";
import { localJsonStorageWarning, saveInquiryRecord } from "@/lib/inquiryStore";

export const runtime = "nodejs";

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

class DeepSeekFallbackError extends Error {
  reason: FallbackReason;

  constructor(reason: FallbackReason) {
    super(reason);
    this.reason = reason;
  }
}

const REQUIRED_FIELDS: Array<keyof InquiryData> = [
  "name",
  "email",
  "company",
  "country",
  "interestedProduct",
  "quantity",
  "message"
];

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function isInquiryData(value: unknown): value is InquiryData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return REQUIRED_FIELDS.every((field) => typeof data[field] === "string");
}

function extractJsonObject(content: string) {
  const trimmedContent = content.trim();
  const withoutCodeFence = trimmedContent
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const jsonStart = withoutCodeFence.indexOf("{");
  const jsonEnd = withoutCodeFence.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new DeepSeekFallbackError("Invalid JSON response from DeepSeek");
  }

  try {
    return JSON.parse(withoutCodeFence.slice(jsonStart, jsonEnd + 1));
  } catch {
    throw new DeepSeekFallbackError("Invalid JSON response from DeepSeek");
  }
}

function toStringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toStringArrayOrFallback(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const stringValues = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );

  return stringValues.length > 0 ? stringValues : fallback;
}

function validateDeepSeekResult(value: unknown, fallback: InquiryAnalysisResult): InquiryAnalysisResult {
  if (!value || typeof value !== "object") {
    throw new Error("DeepSeek JSON result is not an object.");
  }

  const result = value as Record<string, unknown>;

  return {
    customerType: toStringOrFallback(result.customerType, fallback.customerType),
    purchaseIntent: toStringOrFallback(result.purchaseIntent, fallback.purchaseIntent) as InquiryAnalysisResult["purchaseIntent"],
    inquirySummary: toStringOrFallback(result.inquirySummary, fallback.inquirySummary),
    suggestedReplyEmail: toStringOrFallback(result.suggestedReplyEmail, fallback.suggestedReplyEmail),
    whatsappFollowUpMessage: toStringOrFallback(
      result.whatsappFollowUpMessage,
      fallback.whatsappFollowUpMessage
    ),
    nextFollowUpSuggestion: toStringOrFallback(
      result.nextFollowUpSuggestion,
      fallback.nextFollowUpSuggestion
    ),
    quotationReadiness:
      result.quotationReadiness === "Ready" || result.quotationReadiness === "Not Ready"
        ? result.quotationReadiness
        : fallback.quotationReadiness,
    missingInformation: toStringArrayOrFallback(result.missingInformation, fallback.missingInformation),
    requiredQuestions: toStringArrayOrFallback(result.requiredQuestions, fallback.requiredQuestions),
    quotationRisk: toStringOrFallback(result.quotationRisk, fallback.quotationRisk),
    recommendedNextAction: toStringOrFallback(
      result.recommendedNextAction,
      fallback.recommendedNextAction
    ),
    mode: "deepseek"
  };
}

function buildDeepSeekPrompt(inquiryData: InquiryData) {
  return `You are a B2B export sales assistant for a mirror manufacturer.

Analyze this buyer inquiry and return JSON only. Do not include markdown.

Required JSON schema:
{
  "customerType": "string",
  "purchaseIntent": "string",
  "inquirySummary": "string",
  "suggestedReplyEmail": "string",
  "whatsappFollowUpMessage": "string",
  "nextFollowUpSuggestion": "string",
  "quotationReadiness": "Ready or Not Ready",
  "missingInformation": ["string"],
  "requiredQuestions": ["string"],
  "quotationRisk": "string",
  "recommendedNextAction": "string",
  "mode": "deepseek"
}

Business rules:
- Normalize buyer names, country names and product names.
- Convert casual terms into professional B2B wording: cheap -> cost-effective, low price -> competitive price, fast delivery -> shorter lead time, custom logo -> logo customization.
- If quantity is 1000 or more, purchase intent should normally be High unless sample or urgent context is stronger.
- If message mentions sample, use Sample Stage.
- If message mentions urgent, use Urgent Inquiry.
- The inquirySummary should be structured for a sales person and include these labels: Buyer, Company, Buyer Location, Destination Market, Product, Quantity, Request.
- In inquirySummary, Destination Market must be only the country or market name, such as "United Kingdom" or "Mexico". Do not write "for the UK market" in the Destination Market field.
- In natural sentences outside the Destination Market field, you may write "for the Mexico market". Do not say "shipped to Mexico" unless the buyer explicitly asks for CIF, CFR, DDP or door delivery.
- If the buyer mentions FOB, the suggestedReplyEmail must ask for the preferred FOB port and may say: "We can quote based on FOB Ningbo or your preferred FOB port after confirming the final specifications."
- Do not mix FOB with destination delivery. FOB is port-based, not shipment to the destination country.
- The suggestedReplyEmail must be 120-180 English words and include greeting, thanks, buyer requirement recap, product fit, MOQ/customization/lead time, and questions about final size, mirror thickness, frame material/color, whether LED/anti-fog/backlit is required, logo requirement, packaging requirement, preferred FOB port and target delivery schedule.
- The suggestedReplyEmail must end exactly with:
Best regards,
MirrorPro Supply Sales Team
- For quantities such as 1000 pcs, use a careful sentence like "1,000 pcs is within our regular production range." Do not say "we can accommodate any quantity."
- Do not output these phrases anywhere: [Your Name], Your Name, best price, lowest price, top quality, perfect product.
- Avoid exaggerated or over-promising claims such as any quantity requirement, best quality, perfect product, top supplier or lowest price.
- WhatsApp follow-up must mention the product, quantity and the need to confirm FOB port/specifications. Keep it professional, concise and 1-2 sentences.
- Do not write "best FOB price" in WhatsApp follow-up. Use "accurate FOB quotation", "suitable FOB quotation", or "updated FOB price and lead time" instead.
- The nextFollowUpSuggestion should recommend confirming specifications, packaging, FOB port and target delivery schedule first, then preparing a formal quotation.
- Add a Quotation Readiness Checker for pre-quotation review.
- quotationReadiness must be "Not Ready" if any key information is missing: final size, material, quantity, packaging, logo requirement, preferred FOB port, delivery schedule or target price.
- Also check mirror-specific details such as mirror thickness and frame color. If they are missing, include them in missingInformation.
- If the buyer has provided product, quantity, size, destination market, trade term and lead time request, but still lacks packaging, logo requirement, preferred FOB port or target price, quotationReadiness must still be "Not Ready".
- Only set quotationReadiness to "Ready" when the key product specifications, quantity, packaging, logo requirement, target price, preferred FOB port and delivery schedule are generally clear.
- missingInformation must be a concise string array, using labels such as Final size, Material, Mirror thickness, Frame color, Logo requirement, Packaging requirement, Target price, Preferred FOB port and Delivery schedule.
- requiredQuestions must be a practical string array of questions the sales person should ask the buyer before quotation.
- quotationRisk must explain the pricing risk if the inquiry is incomplete.
- recommendedNextAction must tell the sales person whether to ask for missing details first or prepare a formal quotation.
- Return valid JSON only.

Inquiry data:
${JSON.stringify(inquiryData, null, 2)}`;
}

function withFallbackReason(
  fallback: InquiryAnalysisResult,
  fallbackReason: FallbackReason
): InquiryAnalysisResult {
  return {
    ...fallback,
    mode: "mock",
    fallbackReason
  };
}

function getDeepSeekFallbackReason(status: number, responseText: string): FallbackReason {
  const lowerResponseText = responseText.toLowerCase();

  if (status === 401) {
    return "Invalid DeepSeek API key";
  }

  if (status === 402) {
    return "Insufficient DeepSeek API balance";
  }

  if (status === 429) {
    return "DeepSeek rate limit reached";
  }

  // 不把完整响应返回给前端，只用响应内容判断是否属于模型配置错误。
  if (
    status === 404 ||
    lowerResponseText.includes("model_not_found") ||
    lowerResponseText.includes("model not found") ||
    lowerResponseText.includes("model does not exist")
  ) {
    return "DeepSeek model not found";
  }

  return "DeepSeek API request failed";
}

async function callDeepSeek(inquiryData: InquiryData, fallback: InquiryAnalysisResult) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return withFallbackReason(fallback, "Missing DEEPSEEK_API_KEY");
  }

  const baseUrl = normalizeBaseUrl(process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com");
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a careful B2B export sales assistant. Always output valid JSON only."
        },
        {
          role: "user",
          content: buildDeepSeekPrompt(inquiryData)
        }
      ],
      temperature: 0.2,
      response_format: {
        type: "json_object"
      }
    })
  });

  if (!response.ok) {
    const responseText = await response.text();

    throw new DeepSeekFallbackError(getDeepSeekFallbackReason(response.status, responseText));
  }

  let payload: DeepSeekChatResponse;

  try {
    payload = (await response.json()) as DeepSeekChatResponse;
  } catch {
    throw new DeepSeekFallbackError("Invalid JSON response from DeepSeek");
  }

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new DeepSeekFallbackError("Invalid JSON response from DeepSeek");
  }

  const parsedResult = extractJsonObject(content);

  return validateDeepSeekResult(parsedResult, fallback);
}

async function saveAnalyzedInquiry(inquiryData: InquiryData, analysisResult: InquiryAnalysisResult) {
  const recordId = randomUUID();
  const inquiryRecord: InquiryRecord = {
    id: recordId,
    createdAt: new Date().toISOString(),
    name: inquiryData.name,
    email: inquiryData.email,
    company: inquiryData.company,
    country: inquiryData.country,
    interestedProduct: inquiryData.interestedProduct,
    quantity: inquiryData.quantity,
    message: inquiryData.message,
    customerType: analysisResult.customerType,
    purchaseIntent: analysisResult.purchaseIntent,
    inquirySummary: analysisResult.inquirySummary,
    suggestedReplyEmail: analysisResult.suggestedReplyEmail,
    whatsappFollowUpMessage: analysisResult.whatsappFollowUpMessage,
    nextFollowUpSuggestion: analysisResult.nextFollowUpSuggestion,
    quotationReadiness: analysisResult.quotationReadiness,
    missingInformation: analysisResult.missingInformation,
    requiredQuestions: analysisResult.requiredQuestions,
    quotationRisk: analysisResult.quotationRisk,
    recommendedNextAction: analysisResult.recommendedNextAction,
    mode: analysisResult.mode,
    fallbackReason: analysisResult.fallbackReason,
    status: "New",
    source: "Website Inquiry"
  };

  try {
    const saveResult = await saveInquiryRecord(inquiryRecord);
    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const crmDetailUrl = `${appBaseUrl.replace(/\/$/, "")}/admin/inquiries/${saveResult.recordId}`;
    const notificationResult = await sendInquiryNotification({
      inquiryRecord,
      aiAnalysis: analysisResult,
      crmDetailUrl
    });

    return {
      ...saveResult,
      ...notificationResult
    };
  } catch (error) {
    // 存储失败不应该阻断询盘分析结果返回，方便 MVP 演示时继续查看 AI 输出。
    console.error("Failed to save inquiry record:", error);

    return {
      recordId,
      saved: false,
      saveWarning:
        error instanceof Error && error.message ? error.message : localJsonStorageWarning,
      notificationSent: false,
      notificationMode: "mock" as const,
      notificationWarning: "Inquiry was not saved, so notification was skipped."
    };
  }
}

export async function POST(request: NextRequest) {
  let inquiryData: InquiryData;

  try {
    const body = await request.json();

    if (!isInquiryData(body)) {
      return NextResponse.json({ error: "Invalid inquiry data." }, { status: 400 });
    }

    inquiryData = body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const mockFallback = analyzeInquiry(inquiryData);
  let analysisResult: InquiryAnalysisResult;

  try {
    analysisResult = await callDeepSeek(inquiryData, mockFallback);
  } catch (error) {
    // DeepSeek 调用失败时自动回退到本地 Mock，避免前端询盘流程中断。
    console.error("DeepSeek analysis failed, fallback to mock:", error);
    const fallbackReason =
      error instanceof DeepSeekFallbackError ? error.reason : "DeepSeek API request failed";

    analysisResult = withFallbackReason(mockFallback, fallbackReason);
  }

  const saveResult = await saveAnalyzedInquiry(inquiryData, analysisResult);

  return NextResponse.json({
    ...analysisResult,
    ...saveResult
  });
}
