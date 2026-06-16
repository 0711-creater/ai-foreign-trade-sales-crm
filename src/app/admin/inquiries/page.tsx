"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { InquiryRecord, InquiryRecordStatus } from "@/lib/inquiryStore";

type InquiriesApiResponse = {
  records: InquiryRecord[];
  storageMode: "supabase" | "local-json";
  warning?: string;
};

function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getStatusBadgeClass(status: InquiryRecordStatus) {
  const statusClassMap: Record<InquiryRecordStatus, string> = {
    New: "bg-brand-100 text-brand-800",
    Contacted: "bg-sky-100 text-sky-800",
    Quoted: "bg-violet-100 text-violet-800",
    "Follow-up": "bg-amber-100 text-amber-800",
    Closed: "bg-emerald-100 text-emerald-800",
    Lost: "bg-zinc-200 text-zinc-700"
  };

  return statusClassMap[status] ?? "bg-zinc-200 text-zinc-700";
}

function getReadinessBadgeClass(readiness?: string) {
  return readiness === "Ready" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
}

export default function AdminInquiriesPage() {
  const [records, setRecords] = useState<InquiryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    async function loadInquiryRecords() {
      try {
        const response = await fetch("/api/inquiries", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Failed to load inquiry records.");
        }

        const data = (await response.json()) as unknown;

        if (Array.isArray(data)) {
          setRecords(data as InquiryRecord[]);
          setWarning("");
          return;
        }

        const apiResult = data as Partial<InquiriesApiResponse>;

        setRecords(Array.isArray(apiResult.records) ? apiResult.records : []);
        setWarning(apiResult.storageMode === "local-json" ? apiResult.warning ?? "" : "");
      } catch (requestError) {
        console.error("Failed to load inquiry records:", requestError);
        setError("Failed to load inquiry records. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadInquiryRecords();
  }, []);

  return (
    <main className="bg-zinc-50 py-16">
      <div className="container-page">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Local CRM MVP</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">Inquiry CRM Dashboard</h1>
          <p className="mt-4 text-lg leading-8 text-zinc-600">
            This is a local MVP dashboard for reviewing website inquiries and AI analysis results.
          </p>
        </div>

        <section className="mt-10 rounded-lg border border-zinc-200 bg-white shadow-soft">
          {isLoading ? (
            <p className="p-6 text-sm font-medium text-zinc-600">Loading inquiry records...</p>
          ) : null}

          {error ? <p className="p-6 text-sm font-medium text-red-700">{error}</p> : null}

          {warning ? (
            <p className="mx-6 mt-6 rounded-md bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-800">
              Local JSON storage is for local MVP only. For production deployment, please use Supabase,
              PostgreSQL, MySQL, MongoDB or another persistent database.
            </p>
          ) : null}

          {!isLoading && !error && records.length === 0 ? (
            <p className="p-6 text-sm font-medium text-zinc-600">
              No inquiries found yet.
            </p>
          ) : null}

          {!isLoading && !error && records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1280px] w-full border-collapse text-left text-sm">
                <thead className="bg-brand-50 text-brand-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Created At</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold">Country</th>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Quantity</th>
                    <th className="px-4 py-3 font-semibold">Customer Type</th>
                    <th className="px-4 py-3 font-semibold">Purchase Intent</th>
                    <th className="px-4 py-3 font-semibold">Quotation Readiness</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Mode</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {records.map((record) => (
                    <tr key={record.id} className="align-top">
                      <td className="px-4 py-4 text-zinc-700">{formatCreatedAt(record.createdAt)}</td>
                      <td className="px-4 py-4 font-medium text-zinc-950">{record.name}</td>
                      <td className="px-4 py-4 text-zinc-700">{record.company}</td>
                      <td className="px-4 py-4 text-zinc-700">{record.country}</td>
                      <td className="px-4 py-4 text-zinc-700">{record.interestedProduct}</td>
                      <td className="px-4 py-4 text-zinc-700">{record.quantity}</td>
                      <td className="px-4 py-4 text-zinc-700">{record.customerType}</td>
                      <td className="px-4 py-4 text-zinc-700">{record.purchaseIntent}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getReadinessBadgeClass(record.quotationReadiness)}`}>
                          {record.quotationReadiness ?? "Not Ready"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-zinc-700">{record.mode}</td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/inquiries/${record.id}`}
                          className="text-sm font-semibold text-brand-700 hover:text-brand-900"
                        >
                          View Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
