"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { InquiryRecord, InquiryRecordStatus } from "@/lib/inquiryStore";
import type { QuotationResult, TradeTerm } from "@/lib/quotationCalculator";
import type { QuotationReview } from "@/lib/quotationReviewer";

const crmStatuses: InquiryRecordStatus[] = [
  "New",
  "Contacted",
  "Quoted",
  "Follow-up",
  "Closed",
  "Lost"
];

const tradeTerms: TradeTerm[] = ["FOB", "EXW", "CIF", "DDP"];

type QuotationFormState = {
  productCost: string;
  packagingCost: string;
  domesticHandlingCost: string;
  profitMargin: string;
  quantity: string;
  currency: string;
  tradeTerm: TradeTerm;
  fobPort: string;
  leadTime: string;
  paymentTerm: string;
  quotationNote: string;
};

type QuotationResponse = {
  quotation: QuotationResult;
  quotationEmail: string;
  quotationMode: "deepseek" | "mock";
  quotationReview: QuotationReview;
};

function getInitialQuotationForm(quantity = ""): QuotationFormState {
  return {
    productCost: "",
    packagingCost: "",
    domesticHandlingCost: "",
    profitMargin: "25",
    quantity,
    currency: "USD",
    tradeTerm: "FOB",
    fobPort: "Ningbo",
    leadTime: "30-35 days after sample approval",
    paymentTerm: "30% deposit, 70% before shipment",
    quotationNote: ""
  };
}

function parseQuantityText(quantity: string) {
  const match = quantity.replace(/,/g, "").match(/\d+/);

  return match ? match[0] : "";
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Not updated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getReadinessBadgeClass(readiness?: string) {
  return readiness === "Ready" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
}

function getReviewStatusBadgeClass(status?: string) {
  if (status === "Pass") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "Risk") {
    return "bg-red-100 text-red-800";
  }

  return "bg-amber-100 text-amber-800";
}

function getLeadPriorityBadgeClass(priority?: string) {
  if (priority === "High") {
    return "bg-red-100 text-red-800";
  }

  if (priority === "Medium") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-zinc-200 text-zinc-700";
}

function getSafeList(items?: string[]) {
  return Array.isArray(items) ? items : [];
}

export default function InquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<InquiryRecord | null>(null);
  const [status, setStatus] = useState<InquiryRecordStatus>("New");
  const [followUpNote, setFollowUpNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [quotationForm, setQuotationForm] = useState<QuotationFormState>(() => getInitialQuotationForm());
  const [quotationResult, setQuotationResult] = useState<QuotationResponse | null>(null);
  const [isGeneratingQuotation, setIsGeneratingQuotation] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadInquiryDetail() {
    try {
      const response = await fetch(`/api/inquiries/${params.id}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to load inquiry detail.");
      }

      const data = (await response.json()) as InquiryRecord;

      setRecord(data);
      setStatus(data.status);
      setFollowUpNote(data.followUpNote ?? "");
      setQuotationForm((current) => ({
        ...current,
        quantity: current.quantity || parseQuantityText(data.quantity)
      }));
    } catch (requestError) {
      console.error("Failed to load inquiry detail:", requestError);
      setError("Failed to load inquiry detail.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) {
      void loadInquiryDetail();
    }
    // params.id 是当前动态详情页的唯一数据源。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleSaveUpdate() {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/inquiries/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          followUpNote,
          updatedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save inquiry update.");
      }

      const updatedRecord = (await response.json()) as InquiryRecord;

      setRecord(updatedRecord);
      setMessage("Inquiry update saved.");
    } catch (requestError) {
      console.error("Failed to save inquiry update:", requestError);
      setError("Failed to save inquiry update.");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyText(label: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setMessage(`${label} copied.`);
      setError("");
    } catch (copyError) {
      console.error("Failed to copy text:", copyError);
      setError("Copy failed. Please copy the text manually.");
    }
  }

  function updateQuotationField(field: keyof QuotationFormState, value: string) {
    setQuotationForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleGenerateQuotation() {
    setIsGeneratingQuotation(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/inquiries/${params.id}/quotation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...quotationForm,
          productCost: Number(quotationForm.productCost),
          packagingCost: Number(quotationForm.packagingCost),
          domesticHandlingCost: Number(quotationForm.domesticHandlingCost),
          profitMargin: Number(quotationForm.profitMargin),
          quantity: Number(quotationForm.quantity)
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate quotation.");
      }

      const result = (await response.json()) as QuotationResponse;

      setQuotationResult(result);
      setMessage("Quotation generated and saved.");
      await loadInquiryDetail();
    } catch (requestError) {
      console.error("Failed to generate quotation:", requestError);
      setError("Failed to generate quotation. Please check the quotation inputs.");
    } finally {
      setIsGeneratingQuotation(false);
    }
  }

  return (
    <main className="bg-zinc-50 py-16">
      <div className="container-page">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">AI Sales CRM</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">Inquiry Detail</h1>
          </div>
          <Link href="/admin/inquiries" className="btn-base border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100">
            Back to List
          </Link>
        </div>

        {isLoading ? <p className="mt-10 text-sm font-medium text-zinc-600">Loading inquiry detail...</p> : null}
        {error ? <p className="mt-10 rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}

        {!isLoading && record ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <Panel title="Customer Information">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem label="Name" value={record.name} />
                  <InfoItem label="Email" value={record.email} />
                  <InfoItem label="Company" value={record.company} />
                  <InfoItem label="Country" value={record.country} />
                  <InfoItem label="Product" value={record.interestedProduct} />
                  <InfoItem label="Quantity" value={record.quantity} />
                  <InfoItem label="Created At" value={formatDateTime(record.createdAt)} />
                  <InfoItem label="Status" value={record.status} />
                </div>
                <InfoItem label="Original Message" value={record.message} className="mt-4" />
              </Panel>

              <Panel title="AI Analysis Result">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem label="Customer Type" value={record.customerType} />
                  <InfoItem label="Purchase Intent" value={record.purchaseIntent} />
                  <InfoItem label="Lead Score" value={`${record.leadScore ?? 0}/100`} />
                  <div>
                    <p className="text-sm font-semibold text-zinc-500">Lead Priority</p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getLeadPriorityBadgeClass(record.leadPriority)}`}>
                      {record.leadPriority ?? "Low"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-500">Quotation Readiness</p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getReadinessBadgeClass(record.quotationReadiness)}`}>
                      {record.quotationReadiness ?? "Not Ready"}
                    </span>
                  </div>
                  <InfoItem label="Mode" value={record.mode} />
                  <InfoItem label="Updated At" value={formatDateTime(record.updatedAt)} />
                </div>
                <InfoItem label="Lead Score Reason" value={record.leadScoreReason ?? "Lead scoring was not available for this record."} className="mt-4" />
                <InfoItem label="Recommended Follow-up Time" value={record.recommendedFollowUpTime ?? "Not specified"} className="mt-4" />
                <InfoItem label="Sales Strategy" value={record.salesStrategy ?? "No sales strategy recorded."} className="mt-4" />
                <InfoItem label="Inquiry Summary" value={record.inquirySummary} className="mt-4" />
                <ListItem
                  label="Missing Information"
                  items={getSafeList(record.missingInformation)}
                  emptyText="No missing information recorded."
                  className="mt-4"
                />
                <ListItem
                  label="Required Questions"
                  items={getSafeList(record.requiredQuestions)}
                  emptyText="No required questions recorded."
                  className="mt-4"
                />
                <InfoItem label="Quotation Risk" value={record.quotationRisk ?? "No quotation risk recorded."} className="mt-4" />
                <InfoItem
                  label="Recommended Next Action"
                  value={record.recommendedNextAction ?? "No recommended next action recorded."}
                  className="mt-4"
                />
                <InfoItem label="Suggested Reply Email" value={record.suggestedReplyEmail} className="mt-4" preformatted />
                <InfoItem label="WhatsApp Follow-up Message" value={record.whatsappFollowUpMessage} className="mt-4" />
                <InfoItem label="Next Follow-up Suggestion" value={record.nextFollowUpSuggestion} className="mt-4" />
              </Panel>
            </section>

            <aside className="space-y-6">
              <Panel title="Quotation Assistant">
                {record.quotationReadiness === "Not Ready" ? (
                  <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm font-medium leading-6 text-amber-800">
                    This inquiry is not fully ready for quotation. Please confirm missing specifications before sending a formal quote.
                  </p>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <QuotationInputField
                    label="Product Cost"
                    value={quotationForm.productCost}
                    onChange={(value) => updateQuotationField("productCost", value)}
                    placeholder="3.50"
                  />
                  <QuotationInputField
                    label="Packaging Cost"
                    value={quotationForm.packagingCost}
                    onChange={(value) => updateQuotationField("packagingCost", value)}
                    placeholder="0.50"
                  />
                  <QuotationInputField
                    label="Domestic Handling Cost"
                    value={quotationForm.domesticHandlingCost}
                    onChange={(value) => updateQuotationField("domesticHandlingCost", value)}
                    placeholder="0.30"
                  />
                  <QuotationInputField
                    label="Profit Margin (%)"
                    value={quotationForm.profitMargin}
                    onChange={(value) => updateQuotationField("profitMargin", value)}
                    placeholder="25"
                  />
                  <QuotationInputField
                    label="Quantity"
                    value={quotationForm.quantity}
                    onChange={(value) => updateQuotationField("quantity", value)}
                    placeholder="1000"
                  />
                  <QuotationInputField
                    label="Currency"
                    value={quotationForm.currency}
                    onChange={(value) => updateQuotationField("currency", value)}
                    placeholder="USD"
                  />
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    Trade Term
                    <select
                      value={quotationForm.tradeTerm}
                      onChange={(event) => updateQuotationField("tradeTerm", event.target.value)}
                      className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    >
                      {tradeTerms.map((tradeTerm) => (
                        <option key={tradeTerm} value={tradeTerm}>
                          {tradeTerm}
                        </option>
                      ))}
                    </select>
                  </label>
                  <QuotationInputField
                    label="FOB Port"
                    value={quotationForm.fobPort}
                    onChange={(value) => updateQuotationField("fobPort", value)}
                    placeholder="Ningbo"
                  />
                </div>

                <QuotationInputField
                  label="Lead Time"
                  value={quotationForm.leadTime}
                  onChange={(value) => updateQuotationField("leadTime", value)}
                  placeholder="30-35 days after sample approval"
                  className="mt-4"
                />
                <QuotationInputField
                  label="Payment Term"
                  value={quotationForm.paymentTerm}
                  onChange={(value) => updateQuotationField("paymentTerm", value)}
                  placeholder="30% deposit, 70% before shipment"
                  className="mt-4"
                />
                <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-700">
                  Quotation Note
                  <textarea
                    rows={4}
                    value={quotationForm.quotationNote}
                    onChange={(event) => updateQuotationField("quotationNote", event.target.value)}
                    className="resize-none rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    placeholder="Add internal quotation assumptions or buyer-specific notes."
                  />
                </label>

                <button
                  type="button"
                  onClick={handleGenerateQuotation}
                  disabled={isGeneratingQuotation}
                  className="btn-base mt-5 w-full bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {isGeneratingQuotation ? "Generating..." : "Generate Quotation"}
                </button>
              </Panel>

              {quotationResult ? (
                <Panel title="Generated Quotation">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoItem label="Base Cost" value={`${quotationResult.quotation.currency} ${quotationResult.quotation.baseCost.toFixed(2)}`} />
                    <InfoItem label="Suggested Unit Price" value={`${quotationResult.quotation.currency} ${quotationResult.quotation.suggestedUnitPrice.toFixed(2)}`} />
                    <InfoItem label="Total Amount" value={`${quotationResult.quotation.currency} ${quotationResult.quotation.totalAmount.toFixed(2)}`} />
                    <InfoItem label="Profit Amount Per Unit" value={`${quotationResult.quotation.currency} ${quotationResult.quotation.profitAmountPerUnit.toFixed(2)}`} />
                    <InfoItem label="Trade Term" value={quotationResult.quotation.tradeTerm} />
                    <InfoItem label="FOB Port" value={quotationResult.quotation.fobPort || "Not specified"} />
                    <InfoItem label="Lead Time" value={quotationResult.quotation.leadTime || "Not specified"} />
                    <InfoItem label="Payment Term" value={quotationResult.quotation.paymentTerm || "Not specified"} />
                    <InfoItem label="Quotation Mode" value={quotationResult.quotationMode === "deepseek" ? "DeepSeek" : "Mock"} />
                  </div>
                  <InfoItem label="Quotation Email" value={quotationResult.quotationEmail} className="mt-4" preformatted />
                  <button
                    type="button"
                    onClick={() => copyText("Quotation email", quotationResult.quotationEmail)}
                    className="btn-base mt-5 w-full bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    Copy Quotation Email
                  </button>
                </Panel>
              ) : null}

              {quotationResult ? (
                <Panel title="Quotation Review">
                  <ReviewBlock review={quotationResult.quotationReview} />
                  <button
                    type="button"
                    onClick={() => copyText("Revised quotation email", quotationResult.quotationReview.revisedQuotationEmail)}
                    className="btn-base mt-5 w-full bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    Copy Revised Quotation Email
                  </button>
                </Panel>
              ) : null}

              <Panel title="CRM Update">
                <label className="grid gap-2 text-sm font-medium text-zinc-700">
                  Status
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as InquiryRecordStatus)}
                    className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  >
                    {crmStatuses.map((crmStatus) => (
                      <option key={crmStatus} value={crmStatus}>
                        {crmStatus}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-700">
                  Follow-up Note
                  <textarea
                    rows={7}
                    value={followUpNote}
                    onChange={(event) => setFollowUpNote(event.target.value)}
                    className="resize-none rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    placeholder="Record quotation status, buyer feedback, next action or follow-up timing."
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSaveUpdate}
                  disabled={isSaving}
                  className="btn-base mt-5 w-full bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {isSaving ? "Saving..." : "Save Update"}
                </button>

                {message ? (
                  <p className="mt-4 rounded-md bg-brand-50 p-3 text-sm font-medium text-brand-700">{message}</p>
                ) : null}
              </Panel>

              <Panel title="Copy AI Messages">
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => copyText("Suggested reply email", record.suggestedReplyEmail)}
                    className="btn-base bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    Copy Suggested Reply Email
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText("WhatsApp message", record.whatsappFollowUpMessage)}
                    className="btn-base border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                  >
                    Copy WhatsApp Message
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText("Required questions", getSafeList(record.requiredQuestions).join("\n"))}
                    className="btn-base border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                  >
                    Copy Required Questions
                  </button>
                </div>
              </Panel>

              <Panel title="Quotation History">
                {record.quotations && record.quotations.length > 0 ? (
                  <div className="space-y-4">
                    {record.quotations.map((quotationRecord) => (
                      <div key={quotationRecord.id} className="rounded-lg bg-zinc-50 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <InfoItem label="Created At" value={formatDateTime(quotationRecord.createdAt)} />
                          <InfoItem label="Mode" value={quotationRecord.quotationMode === "deepseek" ? "DeepSeek" : "Mock"} />
                          <InfoItem
                            label="Unit Price"
                            value={`${quotationRecord.quotation.currency} ${quotationRecord.quotation.suggestedUnitPrice.toFixed(2)}`}
                          />
                          <InfoItem
                            label="Total Amount"
                            value={`${quotationRecord.quotation.currency} ${quotationRecord.quotation.totalAmount.toFixed(2)}`}
                          />
                          <InfoItem label="Trade Term" value={quotationRecord.quotation.tradeTerm} />
                          <InfoItem label="FOB Port" value={quotationRecord.quotation.fobPort || "Not specified"} />
                        </div>
                        <InfoItem label="Quotation Email" value={quotationRecord.quotationEmail} className="mt-4" preformatted />
                        {quotationRecord.quotationReview ? (
                          <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
                            <ReviewBlock review={quotationRecord.quotationReview} />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-zinc-700">No quotation history yet.</p>
                )}
              </Panel>
            </aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function ReviewBlock({ review }: { review: QuotationReview }) {
  return (
    <div>
      <p className="text-sm font-semibold text-zinc-500">Review Status</p>
      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getReviewStatusBadgeClass(review.reviewStatus)}`}>
        {review.reviewStatus}
      </span>
      <ListItem
        label="Risk Items"
        items={review.riskItems}
        emptyText="No quotation risk detected."
        className="mt-4"
      />
      <ListItem
        label="Improvement Suggestions"
        items={review.improvementSuggestions}
        emptyText="No improvement suggestion needed."
        className="mt-4"
      />
      <InfoItem label="Revised Quotation Email" value={review.revisedQuotationEmail} className="mt-4" preformatted />
      <InfoItem label="Sales Reminder" value={review.salesReminder} className="mt-4" />
    </div>
  );
}

function QuotationInputField({
  label,
  value,
  onChange,
  placeholder,
  className = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-zinc-700 ${className}`}>
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        placeholder={placeholder}
      />
    </label>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-soft">
      <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoItem({
  label,
  value,
  className = "",
  preformatted = false
}: {
  label: string;
  value: string;
  className?: string;
  preformatted?: boolean;
}) {
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      {preformatted ? (
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-zinc-800">{value}</pre>
      ) : (
        <p className="mt-2 text-sm leading-6 text-zinc-800">{value}</p>
      )}
    </div>
  );
}

function ListItem({
  label,
  items,
  emptyText,
  className = ""
}: {
  label: string;
  items: string[];
  emptyText: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      {items.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-800">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-zinc-800">{emptyText}</p>
      )}
    </div>
  );
}
