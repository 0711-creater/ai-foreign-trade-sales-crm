import type { InquiryRecord } from "@/lib/inquiryStore";
import type { QuotationInput, QuotationResult } from "@/lib/quotationCalculator";

export type QuotationReviewStatus = "Pass" | "Warning" | "Risk";

export type QuotationReview = {
  reviewStatus: QuotationReviewStatus;
  riskItems: string[];
  improvementSuggestions: string[];
  revisedQuotationEmail: string;
  salesReminder: string;
};

export type QuotationReviewInput = {
  inquiry: InquiryRecord;
  quotation: QuotationResult;
  quotationEmail: string;
  quotationInput: QuotationInput;
};

const riskyWordingList = ["best price", "lowest price", "top quality", "perfect product", "any quantity"];

function hasQuotationValidity(email: string) {
  return /valid\s+for\s+\d+\s+days/i.test(email) || /validity/i.test(email);
}

function replaceRiskyWording(email: string) {
  return email
    .replace(/\bbest price\b/gi, "accurate quotation")
    .replace(/\blowest price\b/gi, "competitive quotation")
    .replace(/\btop quality\b/gi, "quality-controlled production")
    .replace(/\bperfect product\b/gi, "suitable product")
    .replace(/\bany quantity\b/gi, "the confirmed quantity");
}

function ensureQuotationValidity(email: string) {
  if (hasQuotationValidity(email)) {
    return email;
  }

  return email.replace(
    /Best regards,\s*MirrorPro Supply Sales Team/i,
    "This quotation is valid for 7 days and should be reviewed after final confirmation of specifications, packaging and shipping requirements.\n\nBest regards,\nMirrorPro Supply Sales Team"
  );
}

function buildSalesReminder(riskItems: string[]) {
  if (riskItems.length === 0) {
    return "Review the buyer details and calculated prices once more before sending the quotation.";
  }

  return "Before sending this quotation, confirm the flagged risk items with the buyer or internally, especially specifications, trade term, payment term, lead time and quotation validity.";
}

export function reviewQuotation(input: QuotationReviewInput): QuotationReview {
  const riskItems: string[] = [];
  const improvementSuggestions: string[] = [];
  const emailLower = input.quotationEmail.toLowerCase();
  let hasSevereRisk = false;

  if (input.quotation.tradeTerm === "FOB" && !input.quotation.fobPort.trim()) {
    riskItems.push("FOB port is missing.");
    improvementSuggestions.push("Add the preferred FOB port before sending the quotation.");
    hasSevereRisk = true;
  }

  if (!input.quotation.paymentTerm.trim()) {
    riskItems.push("Payment term is missing.");
    improvementSuggestions.push("Add a clear payment term, such as 30% deposit and 70% before shipment.");
  }

  if (!input.quotation.leadTime.trim()) {
    riskItems.push("Lead time is missing.");
    improvementSuggestions.push("Add the estimated production lead time before sending the quotation.");
  }

  const riskyWording = riskyWordingList.find((wording) => emailLower.includes(wording));

  if (riskyWording) {
    riskItems.push(`Email contains risky wording such as ${riskyWording}.`);
    improvementSuggestions.push("Replace risky wording with accurate quotation, competitive quotation or suitable quotation.");
  }

  if (input.inquiry.quotationReadiness === "Not Ready") {
    riskItems.push("Inquiry is not fully ready for quotation.");
    improvementSuggestions.push("Confirm missing product specifications and packaging requirements before sending the final quotation.");
  }

  if (!hasQuotationValidity(input.quotationEmail)) {
    riskItems.push("Quotation validity is missing.");
    improvementSuggestions.push("Add quotation validity period, such as valid for 7 days.");
  }

  if (
    input.quotation.baseCost <= 0 ||
    input.quotation.suggestedUnitPrice <= 0 ||
    input.quotation.totalAmount <= 0 ||
    input.quotation.profitAmountPerUnit < 0
  ) {
    riskItems.push("Quotation price fields are abnormal.");
    improvementSuggestions.push("Review cost inputs, margin and quantity before using this quotation.");
    hasSevereRisk = true;
  }

  const reviewStatus: QuotationReviewStatus =
    riskItems.length === 0 ? "Pass" : hasSevereRisk ? "Risk" : "Warning";
  const revisedQuotationEmail = ensureQuotationValidity(replaceRiskyWording(input.quotationEmail));

  return {
    reviewStatus,
    riskItems,
    improvementSuggestions,
    revisedQuotationEmail,
    salesReminder: buildSalesReminder(riskItems)
  };
}
