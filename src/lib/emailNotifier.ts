import type { InquiryAnalysisResult } from "@/lib/aiInquiryAnalyzer";
import type { InquiryRecord } from "@/lib/inquiryStore";

export type InquiryNotificationInput = {
  inquiryRecord: InquiryRecord;
  aiAnalysis: InquiryAnalysisResult;
  crmDetailUrl: string;
};

export type InquiryNotificationResult = {
  notificationSent: boolean;
  notificationMode: "mock" | "email";
  notificationWarning?: string;
};

function buildNotificationSubject(inquiryRecord: InquiryRecord) {
  return `New Website Inquiry - ${inquiryRecord.company} - ${inquiryRecord.interestedProduct}`;
}

function buildNotificationBody({ inquiryRecord, aiAnalysis, crmDetailUrl }: InquiryNotificationInput) {
  return [
    `Customer Name: ${inquiryRecord.name}`,
    `Email: ${inquiryRecord.email}`,
    `Company: ${inquiryRecord.company}`,
    `Country: ${inquiryRecord.country}`,
    `Interested Product: ${inquiryRecord.interestedProduct}`,
    `Quantity: ${inquiryRecord.quantity}`,
    `Original Message: ${inquiryRecord.message}`,
    `Customer Type: ${aiAnalysis.customerType}`,
    `Purchase Intent: ${aiAnalysis.purchaseIntent}`,
    `Quotation Readiness: ${aiAnalysis.quotationReadiness}`,
    `Missing Information: ${aiAnalysis.missingInformation.join(", ") || "None"}`,
    `Required Questions: ${aiAnalysis.requiredQuestions.join(" | ") || "None"}`,
    `CRM Detail URL: ${crmDetailUrl}`
  ].join("\n");
}

export async function sendInquiryNotification(
  input: InquiryNotificationInput
): Promise<InquiryNotificationResult> {
  const notificationEnabled = process.env.EMAIL_NOTIFICATION_ENABLED === "true";
  const salesNotificationEmail = process.env.SALES_NOTIFICATION_EMAIL;
  const fromEmail = process.env.FROM_EMAIL;
  const subject = buildNotificationSubject(input.inquiryRecord);
  const body = buildNotificationBody(input);

  if (!notificationEnabled) {
    console.log("[InquiryNotification:Mock]", {
      subject,
      to: salesNotificationEmail || "Not configured",
      crmDetailUrl: input.crmDetailUrl,
      summary: body
    });

    return {
      notificationSent: false,
      notificationMode: "mock",
      notificationWarning: "Email notification is disabled. Mock notification generated."
    };
  }

  if (!salesNotificationEmail || !fromEmail) {
    return {
      notificationSent: false,
      notificationMode: "mock",
      notificationWarning: "Email notification is enabled, but SALES_NOTIFICATION_EMAIL or FROM_EMAIL is missing."
    };
  }

  // 真实邮件服务预留点：后续可在这里接入 Resend、SMTP 或其他邮件服务。
  console.log("[InquiryNotification:EmailPlaceholder]", {
    subject,
    to: salesNotificationEmail,
    from: fromEmail,
    crmDetailUrl: input.crmDetailUrl,
    summary: body
  });

  return {
    notificationSent: false,
    notificationMode: "mock",
    notificationWarning: "Real email provider is not configured yet. Mock notification generated."
  };
}
