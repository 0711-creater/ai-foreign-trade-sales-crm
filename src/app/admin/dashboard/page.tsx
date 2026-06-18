import Link from "next/link";

import { calculateCrmMetrics } from "@/lib/crmMetrics";
import {
  getInquiryRecordsWithStatus,
  type InquiryRecord
} from "@/lib/inquiryStore";

export const dynamic = "force-dynamic";

function formatDateTime(value?: string) {
  if (!value) {
    return "Not scheduled";
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

function getPriorityBadgeClass(priority?: string) {
  if (priority === "High") {
    return "bg-red-100 text-red-800";
  }

  if (priority === "Medium") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-zinc-200 text-zinc-700";
}

function DistributionList({
  items,
  total
}: {
  items: Array<[string, number]>;
  total: number;
}) {
  return (
    <div className="space-y-4">
      {items.map(([label, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div key={label}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-zinc-700">{label}</span>
              <span className="font-semibold text-zinc-950">
                {count} ({percentage}%)
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyTableMessage({ message }: { message: string }) {
  return <p className="p-6 text-sm font-medium text-zinc-600">{message}</p>;
}

export default async function AdminDashboardPage() {
  const { records, storageMode, warning } =
    await getInquiryRecordsWithStatus();
  const metrics = calculateCrmMetrics(records);
  const kpis = [
    ["Total Inquiries", metrics.totalInquiries],
    ["New Leads", metrics.newLeads],
    ["High Priority Leads", metrics.highPriorityLeads],
    ["Overdue Follow-ups", metrics.overdueFollowUps],
    ["Quotation Ready", metrics.quotationReady],
    ["Quotation Not Ready", metrics.quotationNotReady],
    ["Average Lead Score", metrics.averageLeadScore]
  ];

  return (
    <main className="bg-zinc-50 py-16">
      <div className="container-page">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              AI Sales CRM
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">
              CRM Pipeline Dashboard
            </h1>
            <p className="mt-4 text-lg leading-8 text-zinc-600">
              Review sales pipeline health, lead priority, quotation readiness
              and follow-up workload.
            </p>
          </div>
          <Link
            href="/admin/inquiries"
            className="btn-base border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
          >
            View Inquiries
          </Link>
        </div>

        {warning ? (
          <p className="mt-8 rounded-md bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-800">
            {warning} Current storage mode: {storageMode}.
          </p>
        ) : null}

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-soft"
            >
              <p className="text-sm font-semibold text-zinc-500">{label}</p>
              <p className="mt-3 text-3xl font-bold text-zinc-950">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-zinc-950">
              Lead Priority Distribution
            </h2>
            <div className="mt-5">
              <DistributionList
                total={metrics.totalInquiries}
                items={Object.entries(metrics.leadPriorityDistribution)}
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-zinc-950">
              Follow-up Stage Distribution
            </h2>
            <div className="mt-5">
              <DistributionList
                total={metrics.totalInquiries}
                items={Object.entries(metrics.followUpStageDistribution)}
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-zinc-950">
              Purchase Intent Distribution
            </h2>
            <div className="mt-5">
              <DistributionList
                total={metrics.totalInquiries}
                items={Object.entries(metrics.purchaseIntentDistribution)}
              />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-zinc-200 bg-white shadow-soft">
          <div className="border-b border-zinc-200 px-6 py-5">
            <h2 className="text-xl font-bold text-zinc-950">
              Recent High Value Leads
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Up to 10 high-priority leads ordered by priority, score and
              creation time.
            </p>
          </div>
          {metrics.recentHighValueLeads.length > 0 ? (
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
                    <th className="px-4 py-3 font-semibold">Lead Score</th>
                    <th className="px-4 py-3 font-semibold">Lead Priority</th>
                    <th className="px-4 py-3 font-semibold">Follow-up Due At</th>
                    <th className="px-4 py-3 font-semibold">Follow-up Stage</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {metrics.recentHighValueLeads.map((record) => (
                    <HighValueLeadRow key={record.id} record={record} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyTableMessage message="No high-value leads found yet." />
          )}
        </section>

        <section className="mt-8 rounded-lg border border-zinc-200 bg-white shadow-soft">
          <div className="border-b border-zinc-200 px-6 py-5">
            <h2 className="text-xl font-bold text-zinc-950">
              Overdue Follow-ups
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Follow-up tasks past their due time that are not Closed or Lost.
            </p>
          </div>
          {metrics.overdueLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[960px] w-full border-collapse text-left text-sm">
                <thead className="bg-red-50 text-red-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold">Lead Priority</th>
                    <th className="px-4 py-3 font-semibold">Follow-up Due At</th>
                    <th className="px-4 py-3 font-semibold">Follow-up Stage</th>
                    <th className="px-4 py-3 font-semibold">Next Action</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {metrics.overdueLeads.map((record) => (
                    <tr key={record.id} className="align-top">
                      <td className="px-4 py-4 font-medium text-zinc-950">
                        {record.name}
                      </td>
                      <td className="px-4 py-4 text-zinc-700">
                        {record.company}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                            record.followUpPriority ?? record.leadPriority
                          )}`}
                        >
                          {record.followUpPriority ?? record.leadPriority}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-red-700">
                        {formatDateTime(record.followUpDueAt)}
                      </td>
                      <td className="px-4 py-4 text-zinc-700">
                        {record.followUpStage}
                      </td>
                      <td className="max-w-sm px-4 py-4 text-zinc-700">
                        {record.nextAction}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/inquiries/${record.id}`}
                          className="font-semibold text-brand-700 hover:text-brand-900"
                        >
                          View Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyTableMessage message="No overdue follow-ups." />
          )}
        </section>
      </div>
    </main>
  );
}

function HighValueLeadRow({ record }: { record: InquiryRecord }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-4 text-zinc-700">
        {formatDateTime(record.createdAt)}
      </td>
      <td className="px-4 py-4 font-medium text-zinc-950">{record.name}</td>
      <td className="px-4 py-4 text-zinc-700">{record.company}</td>
      <td className="px-4 py-4 text-zinc-700">{record.country}</td>
      <td className="px-4 py-4 text-zinc-700">
        {record.interestedProduct}
      </td>
      <td className="px-4 py-4 text-zinc-700">{record.quantity}</td>
      <td className="px-4 py-4 font-semibold text-zinc-950">
        {record.leadScore}
      </td>
      <td className="px-4 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
            record.leadPriority
          )}`}
        >
          {record.leadPriority}
        </span>
      </td>
      <td className="px-4 py-4 text-zinc-700">
        {formatDateTime(record.followUpDueAt)}
      </td>
      <td className="px-4 py-4 text-zinc-700">{record.followUpStage}</td>
      <td className="px-4 py-4">
        <Link
          href={`/admin/inquiries/${record.id}`}
          className="font-semibold text-brand-700 hover:text-brand-900"
        >
          View Detail
        </Link>
      </td>
    </tr>
  );
}
