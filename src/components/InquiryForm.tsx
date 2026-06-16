"use client";

import { useState } from "react";
import type { InquiryAnalysisResult, InquiryData } from "@/lib/aiInquiryAnalyzer";

type InquiryFormProps = {
  defaultProductName?: string;
};

type FormState = {
  name: string;
  company: string;
  email: string;
  country: string;
  quantity: string;
  product: string;
  message: string;
};

function createInitialForm(defaultProductName = ""): FormState {
  return {
    name: "",
    company: "",
    email: "",
    country: "",
    quantity: "",
    product: defaultProductName,
    message: ""
  };
}

function mapFormToInquiryData(form: FormState): InquiryData {
  return {
    name: form.name,
    email: form.email,
    company: form.company,
    country: form.country,
    interestedProduct: form.product,
    quantity: form.quantity,
    message: form.message
  };
}

export default function InquiryForm({ defaultProductName }: InquiryFormProps) {
  const [form, setForm] = useState<FormState>(() => createInitialForm(defaultProductName));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<InquiryAnalysisResult | null>(null);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleInquirySubmit() {
    const requiredFields = [form.name, form.company, form.email, form.country, form.quantity, form.message];

    if (requiredFields.some((value) => value.trim() === "")) {
      setSubmitted(false);
      setAnalysisResult(null);
      setError("Please complete name, company, email, country, quantity and requirements.");
      return;
    }

    const inquiryData = mapFormToInquiryData(form);

    setError("");
    setSubmitted(false);
    setIsAnalyzing(true);

    try {
      // 前端只调用自己的 Next.js API Route，不读取或暴露 DeepSeek API Key。
      const response = await fetch("/api/analyze-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(inquiryData)
      });

      if (!response.ok) {
        throw new Error("Failed to analyze inquiry.");
      }

      const result = (await response.json()) as InquiryAnalysisResult;

      console.log("Inquiry submitted:", inquiryData);
      console.log("AI analysis result:", result);

      setAnalysisResult(result);
      setSubmitted(true);
      setForm(createInitialForm(defaultProductName));
    } catch (requestError) {
      console.error("Inquiry analysis request failed:", requestError);
      setAnalysisResult(null);
      setSubmitted(false);
      setError("The inquiry was not analyzed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => event.preventDefault()}
        className="rounded-lg border border-zinc-200 bg-white p-6 shadow-soft"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Name
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              placeholder="Your name"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Company
            <input
              required
              value={form.company}
              onChange={(event) => updateField("company", event.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              placeholder="Company name"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              placeholder="name@company.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Country / Region
            <input
              required
              value={form.country}
              onChange={(event) => updateField("country", event.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              placeholder="United States"
            />
          </label>
        </div>

        <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-700">
          Estimated Quantity
          <input
            required
            value={form.quantity}
            onChange={(event) => updateField("quantity", event.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="500 pcs / 1,000 pcs / annual demand"
          />
        </label>

        <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-700">
          Product Interest
          <input
            value={form.product}
            onChange={(event) => updateField("product", event.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="LED makeup mirror, compact mirror..."
          />
        </label>

        <label className="mt-4 grid gap-2 text-sm font-medium text-zinc-700">
          Requirements
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            className="resize-none rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            placeholder="Please share target quantity, logo, packaging, destination market and timeline."
          />
        </label>

        <button
          type="button"
          onClick={handleInquirySubmit}
          disabled={isAnalyzing}
          className="btn-base mt-5 w-full bg-brand-600 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isAnalyzing ? "Analyzing Inquiry..." : "Send Inquiry"}
        </button>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
        ) : null}

        {submitted ? (
          <p className="mt-4 rounded-md bg-brand-50 p-3 text-sm font-medium text-brand-700">
            Inquiry submitted. AI analysis result has been generated below.
          </p>
        ) : null}
      </form>

      {analysisResult ? <AIAnalysisResult result={analysisResult} /> : null}
    </div>
  );
}

function AIAnalysisResult({ result }: { result: InquiryAnalysisResult }) {
  const modeLabel = result.mode === "deepseek" ? "DeepSeek API Mode" : "Mock Mode";
  const readinessClass =
    result.quotationReadiness === "Ready"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-amber-100 text-amber-800";

  return (
    <section className="rounded-lg border border-brand-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">AI Sales Assistant</p>
          <h3 className="mt-2 text-2xl font-bold text-zinc-950">AI Analysis Result</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            The result is generated by the server API route. It uses DeepSeek when configured and falls
            back to local Mock analysis when no API key is available.
          </p>
        </div>
        <span className="rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-800">
          {modeLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {result.fallbackReason ? (
          <ResultBlock
            title="Fallback Reason"
            content={result.fallbackReason}
            className="border border-amber-200 bg-amber-50 md:col-span-2"
          />
        ) : null}
        <ResultBlock title="Customer Type" content={result.customerType} />
        <ResultBlock title="Purchase Intent" content={result.purchaseIntent} />
        <div className="rounded-lg bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-800">Quotation Readiness</p>
          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${readinessClass}`}>
            {result.quotationReadiness}
          </span>
        </div>
        <ResultBlock title="Inquiry Summary" content={result.inquirySummary} className="md:col-span-2" />
        <ResultListBlock
          title="Missing Information"
          items={result.missingInformation}
          emptyText="No key missing information detected."
        />
        <ResultListBlock
          title="Required Questions"
          items={result.requiredQuestions}
          emptyText="No extra questions required before quotation."
        />
        <ResultBlock
          title="Quotation Risk"
          content={result.quotationRisk}
          className="border border-amber-200 bg-amber-50 md:col-span-2"
        />
        <ResultBlock
          title="Recommended Next Action"
          content={result.recommendedNextAction}
          className="border border-emerald-200 bg-emerald-50 md:col-span-2"
        />
        <ResultBlock
          title="Suggested Reply Email"
          content={result.suggestedReplyEmail}
          className="md:col-span-2"
          preformatted
        />
        <ResultBlock
          title="WhatsApp Follow-up Message"
          content={result.whatsappFollowUpMessage}
          className="md:col-span-2"
        />
        <ResultBlock
          title="Next Follow-up Suggestion"
          content={result.nextFollowUpSuggestion}
          className="md:col-span-2"
        />
      </div>
    </section>
  );
}

function ResultListBlock({
  title,
  items,
  emptyText
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg bg-brand-50 p-4">
      <p className="text-sm font-semibold text-brand-800">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-zinc-700">{emptyText}</p>
      )}
    </div>
  );
}

function ResultBlock({
  title,
  content,
  className = "",
  preformatted = false
}: {
  title: string;
  content: string;
  className?: string;
  preformatted?: boolean;
}) {
  return (
    <div className={`rounded-lg bg-brand-50 p-4 ${className}`}>
      <p className="text-sm font-semibold text-brand-800">{title}</p>
      {preformatted ? (
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-zinc-700">{content}</pre>
      ) : (
        <p className="mt-2 text-sm leading-6 text-zinc-700">{content}</p>
      )}
    </div>
  );
}
