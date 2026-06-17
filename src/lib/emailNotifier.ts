import { Resend } from "resend";

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

function formatList(items: string[]) {
  return items.length > 0 ? items.join(", ") : "None";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildNotificationText({ inquiryRecord, aiAnalysis, crmDetailUrl }: InquiryNotificationInput) {
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
    `Missing Information: ${formatList(aiAnalysis.missingInformation)}`,
    `Required Questions: ${formatList(aiAnalysis.requiredQuestions)}`,
    `CRM Detail URL: ${crmDetailUrl}`
  ].join("\n");
}

function buildNotificationHtml({ inquiryRecord, aiAnalysis, crmDetailUrl }: InquiryNotificationInput) {
  const rows = [
    ["Customer Name", inquiryRecord.name],
    ["Email", inquiryRecord.email],
    ["Company", inquiryRecord.company],
    ["Country", inquiryRecord.country],
    ["Interested Product", inquiryRecord.interestedProduct],
    ["Quantity", inquiryRecord.quantity],
    ["Original Message", inquiryRecord.message],
    ["Customer Type", aiAnalysis.customerType],
    ["Purchase Intent", aiAnalysis.purchaseIntent],
    ["Quotation Readiness", aiAnalysis.quotationReadiness],
    ["Missing Information", formatList(aiAnalysis.missingInformation)],
    ["Required Questions", formatList(aiAnalysis.requiredQuestions)]
  ];

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h2 style="margin: 0 0 16px;">New Website Inquiry</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <td style="border: 1px solid #e5e7eb; padding: 8px 10px; background: #f9fafb; font-weight: 600; width: 210px;">${escapeHtml(
                    label
                  )}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px 10px;">${escapeHtml(
                    value
                  )}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
      <p style="margin-top: 18px;">
        <a href="${escapeHtml(
          crmDetailUrl
        )}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;">
          View CRM Detail
        </a>
      </p>
      <p style="margin-top: 12px; color: #4b5563;">CRM Detail URL: ${escapeHtml(crmDetailUrl)}</p>
    </div>
  `;
}

export async function sendInquiryNotification(
  input: InquiryNotificationInput
): Promise<InquiryNotificationResult> {
  const notificationEnabled = process.env.EMAIL_NOTIFICATION_ENABLED === "true";
  const resendApiKey = process.env.RESEND_API_KEY;
  const salesNotificationEmail = process.env.SALES_NOTIFICATION_EMAIL;
  const fromEmail = process.env.FROM_EMAIL;
  const subject = buildNotificationSubject(input.inquiryRecord);
  const text = buildNotificationText(input);
  const html = buildNotificationHtml(input);

  if (!notificationEnabled) {
    console.log("[InquiryNotification:Mock]", {
      subject,
      to: salesNotificationEmail || "Not configured",
      crmDetailUrl: input.crmDetailUrl,
      summary: text
    });

    return {
      notificationSent: false,
      notificationMode: "mock",
      notificationWarning: "Email notification is disabled. Mock notification generated."
    };
  }

  if (!resendApiKey || !salesNotificationEmail || !fromEmail) {
    return {
      notificationSent: false,
      notificationMode: "mock",
      notificationWarning: "Email notification is enabled but email provider configuration is incomplete."
    };
  }

  try {
    // 真实邮件发送只在服务端执行，避免把 RESEND_API_KEY 暴露到前端。
    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: salesNotificationEmail,
      subject,
      html,
      text
    });

    if (error) {
      console.log("[InquiryNotification:ResendError]", {
        message: error.message
      });

      return {
        notificationSent: false,
        notificationMode: "mock",
        notificationWarning: "Email sending failed. Inquiry was saved successfully."
      };
    }

    return {
      notificationSent: true,
      notificationMode: "email"
    };
  } catch (error) {
    console.log("[InquiryNotification:ResendError]", {
      message: error instanceof Error ? error.message : "Unknown email sending error"
    });

    return {
      notificationSent: false,
      notificationMode: "mock",
      notificationWarning: "Email sending failed. Inquiry was saved successfully."
    };
  }
}
