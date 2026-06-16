import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { addQuotationToInquiry, getInquiryRecordById, type QuotationMode } from "@/lib/inquiryStore";
import {
  calculateQuotation,
  type QuotationInput,
  type QuotationResult,
  type TradeTerm
} from "@/lib/quotationCalculator";
import {
  reviewQuotation,
  type QuotationReview,
  type QuotationReviewInput
} from "@/lib/quotationReviewer";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const tradeTerms: TradeTerm[] = ["FOB", "EXW", "CIF", "DDP"];

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function toNumber(value: unknown) {
  const parsedValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function isTradeTerm(value: unknown): value is TradeTerm {
  return typeof value === "string" && tradeTerms.includes(value as TradeTerm);
}

function buildQuotationInput(value: unknown): QuotationInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;
  const productCost = toNumber(data.productCost);
  const packagingCost = toNumber(data.packagingCost);
  const domesticHandlingCost = toNumber(data.domesticHandlingCost);
  const profitMargin = toNumber(data.profitMargin);
  const quantity = toNumber(data.quantity);

  if (
    productCost === null ||
    packagingCost === null ||
    domesticHandlingCost === null ||
    profitMargin === null ||
    quantity === null ||
    quantity <= 0 ||
    !isTradeTerm(data.tradeTerm)
  ) {
    return null;
  }

  return {
    productCost,
    packagingCost,
    domesticHandlingCost,
    profitMargin,
    quantity,
    currency: typeof data.currency === "string" && data.currency.trim() ? data.currency : "USD",
    tradeTerm: data.tradeTerm,
    fobPort: typeof data.fobPort === "string" ? data.fobPort : "",
    leadTime: typeof data.leadTime === "string" ? data.leadTime : "",
    paymentTerm: typeof data.paymentTerm === "string" ? data.paymentTerm : "",
    quotationNote: typeof data.quotationNote === "string" ? data.quotationNote : ""
  };
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

function buildMockQuotationEmail(
  input: QuotationInput,
  quotation: QuotationResult,
  inquiryProduct: string,
  buyerName: string
) {
  const portText = input.tradeTerm === "FOB" ? ` ${quotation.fobPort || "Ningbo"}` : "";

  // DeepSeek 不可用时的本地报价邮件 fallback，避免报价流程中断。
  return `Dear ${buyerName || "Buyer"},

Thank you for your inquiry. Based on the current information, we prepared a draft quotation for ${inquiryProduct} with a quantity of ${quotation.quantity.toLocaleString("en-US")} pcs.

The suggested unit price is ${formatMoney(quotation.suggestedUnitPrice, quotation.currency)} per pc, and the estimated total amount is ${formatMoney(quotation.totalAmount, quotation.currency)}. The trade term is ${quotation.tradeTerm}${portText}. Lead time is ${quotation.leadTime || "to be confirmed after sample approval"}, and payment term is ${quotation.paymentTerm || "30% deposit, 70% before shipment"}.

This quotation is valid for 7 days and should be reviewed after final confirmation of specifications, packaging and shipping requirements. ${input.quotationNote ? `Additional note: ${input.quotationNote}` : ""}

Best regards,
MirrorPro Supply Sales Team`;
}

function buildDeepSeekPrompt(input: QuotationInput, quotation: QuotationResult, inquiryProduct: string) {
  return `You are a B2B export sales assistant for a mirror manufacturer.

Write a professional English quotation email. Return plain email text only, not JSON and not markdown.

Requirements:
- Use professional B2B foreign trade English.
- Recap the buyer's product and quantity.
- Include unit price, quantity, total amount, trade term, FOB port when relevant, lead time and payment term.
- State that the quotation is valid for 7 days.
- Do not use exaggerated phrases: best price, lowest price, top quality, perfect product.
- Do not promise information that is not confirmed.
- Keep the email between 150 and 220 English words.
- End exactly with:
Best regards,
MirrorPro Supply Sales Team

Inquiry product:
${inquiryProduct}

Quotation input:
${JSON.stringify(input, null, 2)}

Calculated quotation:
${JSON.stringify(quotation, null, 2)}`;
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
    throw new Error("DeepSeek review response did not contain JSON.");
  }

  return JSON.parse(withoutCodeFence.slice(jsonStart, jsonEnd + 1));
}

async function generateQuotationEmail(
  input: QuotationInput,
  quotation: QuotationResult,
  inquiryProduct: string,
  buyerName: string
) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return {
      quotationEmail: buildMockQuotationEmail(input, quotation, inquiryProduct, buyerName),
      quotationMode: "mock" as QuotationMode
    };
  }

  try {
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
            content: "You are a careful B2B export sales assistant. Write concise quotation emails."
          },
          {
            role: "user",
            content: buildDeepSeekPrompt(input, quotation, inquiryProduct)
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek quotation request failed: ${response.status}`);
    }

    const payload = (await response.json()) as DeepSeekChatResponse;
    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("DeepSeek quotation response is empty.");
    }

    return {
      quotationEmail: content,
      quotationMode: "deepseek" as QuotationMode
    };
  } catch (error) {
    console.error("DeepSeek quotation failed, fallback to mock:", error);

    return {
      quotationEmail: buildMockQuotationEmail(input, quotation, inquiryProduct, buyerName),
      quotationMode: "mock" as QuotationMode
    };
  }
}

function buildReviewPrompt(input: QuotationReviewInput, localReview: QuotationReview) {
  return `You are a cautious B2B export quotation reviewer.

Review the quotation email and improve only the business wording. Do not change any price numbers, quantity, trade term, FOB port, lead time or payment term.

Return valid JSON only with this schema:
{
  "improvementSuggestions": ["string"],
  "revisedQuotationEmail": "string",
  "salesReminder": "string"
}

Rules:
- Keep the calculated prices exactly as provided.
- Do not use best price, lowest price, top quality, perfect product or any quantity.
- If risk items exist, address them in the revised wording without inventing unconfirmed information.
- The revised email must end exactly with:
Best regards,
MirrorPro Supply Sales Team

Quotation:
${JSON.stringify(input.quotation, null, 2)}

Quotation input:
${JSON.stringify(input.quotationInput, null, 2)}

Original quotation email:
${input.quotationEmail}

Local review:
${JSON.stringify(localReview, null, 2)}`;
}

function mergeDeepSeekReview(value: unknown, localReview: QuotationReview): QuotationReview {
  if (!value || typeof value !== "object") {
    return localReview;
  }

  const result = value as Record<string, unknown>;
  const suggestions = Array.isArray(result.improvementSuggestions)
    ? result.improvementSuggestions.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : localReview.improvementSuggestions;

  return {
    ...localReview,
    improvementSuggestions: suggestions.length > 0 ? suggestions : localReview.improvementSuggestions,
    revisedQuotationEmail:
      typeof result.revisedQuotationEmail === "string" && result.revisedQuotationEmail.trim()
        ? result.revisedQuotationEmail
        : localReview.revisedQuotationEmail,
    salesReminder:
      typeof result.salesReminder === "string" && result.salesReminder.trim()
        ? result.salesReminder
        : localReview.salesReminder
  };
}

async function enhanceQuotationReviewWithDeepSeek(reviewInput: QuotationReviewInput) {
  const localReview = reviewQuotation(reviewInput);
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return localReview;
  }

  try {
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
            content: "You review B2B export quotation emails and return valid JSON only."
          },
          {
            role: "user",
            content: buildReviewPrompt(reviewInput, localReview)
          }
        ],
        temperature: 0.2,
        response_format: {
          type: "json_object"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek quotation review failed: ${response.status}`);
    }

    const payload = (await response.json()) as DeepSeekChatResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek quotation review response is empty.");
    }

    return mergeDeepSeekReview(extractJsonObject(content), localReview);
  } catch (error) {
    console.error("DeepSeek quotation review failed, fallback to local review:", error);

    return localReview;
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const inquiryRecord = await getInquiryRecordById(id);

  if (!inquiryRecord) {
    return NextResponse.json({ error: "Inquiry record not found." }, { status: 404 });
  }

  const body = await request.json();
  const quotationInput = buildQuotationInput(body);

  if (!quotationInput) {
    return NextResponse.json({ error: "Invalid quotation input." }, { status: 400 });
  }

  const quotation = calculateQuotation(quotationInput);
  const { quotationEmail, quotationMode } = await generateQuotationEmail(
    quotationInput,
    quotation,
    inquiryRecord.interestedProduct,
    inquiryRecord.name
  );
  const quotationReview = await enhanceQuotationReviewWithDeepSeek({
    inquiry: inquiryRecord,
    quotation,
    quotationEmail,
    quotationInput
  });
  const quotationRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    quotationInput,
    quotation,
    quotationEmail,
    quotationMode,
    quotationReview
  };
  const updatedInquiry = await addQuotationToInquiry(id, quotationRecord);

  if (!updatedInquiry) {
    return NextResponse.json({ error: "Failed to save quotation record." }, { status: 500 });
  }

  return NextResponse.json({
    quotation,
    quotationEmail,
    quotationMode,
    quotationReview
  });
}
