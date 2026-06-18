import type { InquiryRecord } from "@/lib/inquiryStore";

export type LeadPriorityDistribution = {
  High: number;
  Medium: number;
  Low: number;
};

export type FollowUpStageDistribution = {
  New: number;
  "First Contact": number;
  "Quotation Sent": number;
  "Waiting Reply": number;
  Negotiation: number;
  Closed: number;
  Lost: number;
};

export type PurchaseIntentDistribution = {
  High: number;
  Medium: number;
  Low: number;
};

export type CrmMetrics = {
  totalInquiries: number;
  newLeads: number;
  highPriorityLeads: number;
  overdueFollowUps: number;
  quotationReady: number;
  quotationNotReady: number;
  averageLeadScore: number;
  leadPriorityDistribution: LeadPriorityDistribution;
  followUpStageDistribution: FollowUpStageDistribution;
  purchaseIntentDistribution: PurchaseIntentDistribution;
  recentHighValueLeads: InquiryRecord[];
  overdueLeads: InquiryRecord[];
};

function getPriority(record: InquiryRecord) {
  return record.followUpPriority ?? record.leadPriority ?? "Low";
}

function getPriorityRank(record: InquiryRecord) {
  const rank = {
    High: 3,
    Medium: 2,
    Low: 1
  };

  return rank[getPriority(record)];
}

function getCreatedAtTimestamp(record: InquiryRecord) {
  const timestamp = new Date(record.createdAt).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isOverdue(record: InquiryRecord, now: Date) {
  if (
    !record.followUpDueAt ||
    record.followUpStage === "Closed" ||
    record.followUpStage === "Lost"
  ) {
    return false;
  }

  const dueAt = new Date(record.followUpDueAt).getTime();

  return !Number.isNaN(dueAt) && dueAt < now.getTime();
}

function getPurchaseIntentBucket(record: InquiryRecord): keyof PurchaseIntentDistribution {
  if (record.purchaseIntent === "High" || record.purchaseIntent === "Urgent Inquiry") {
    return "High";
  }

  if (record.purchaseIntent === "Medium") {
    return "Medium";
  }

  return "Low";
}

export function calculateCrmMetrics(
  records: InquiryRecord[],
  now = new Date()
): CrmMetrics {
  const leadPriorityDistribution: LeadPriorityDistribution = {
    High: 0,
    Medium: 0,
    Low: 0
  };
  const followUpStageDistribution: FollowUpStageDistribution = {
    New: 0,
    "First Contact": 0,
    "Quotation Sent": 0,
    "Waiting Reply": 0,
    Negotiation: 0,
    Closed: 0,
    Lost: 0
  };
  const purchaseIntentDistribution: PurchaseIntentDistribution = {
    High: 0,
    Medium: 0,
    Low: 0
  };
  const validLeadScores: number[] = [];

  for (const record of records) {
    const priority = getPriority(record);
    leadPriorityDistribution[priority] += 1;

    const stage = record.followUpStage ?? "New";
    followUpStageDistribution[stage] += 1;

    const purchaseIntentBucket = getPurchaseIntentBucket(record);
    purchaseIntentDistribution[purchaseIntentBucket] += 1;

    if (typeof record.leadScore === "number" && Number.isFinite(record.leadScore)) {
      validLeadScores.push(record.leadScore);
    }
  }

  const overdueLeads = records
    .filter((record) => isOverdue(record, now))
    .sort((a, b) => {
      const priorityDifference = getPriorityRank(b) - getPriorityRank(a);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return (
        new Date(a.followUpDueAt).getTime() -
        new Date(b.followUpDueAt).getTime()
      );
    });

  const recentHighValueLeads = records
    .filter(
      (record) =>
        record.leadPriority === "High" ||
        record.followUpPriority === "High" ||
        record.leadScore >= 80
    )
    .sort((a, b) => {
      const priorityDifference = getPriorityRank(b) - getPriorityRank(a);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const scoreDifference = (b.leadScore ?? 0) - (a.leadScore ?? 0);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a);
    })
    .slice(0, 10);

  const averageLeadScore =
    validLeadScores.length > 0
      ? Math.round(
          (validLeadScores.reduce((total, score) => total + score, 0) /
            validLeadScores.length) *
            10
        ) / 10
      : 0;

  return {
    totalInquiries: records.length,
    newLeads: records.filter(
      (record) => record.status === "New" || record.followUpStage === "New"
    ).length,
    highPriorityLeads: records.filter(
      (record) =>
        record.leadPriority === "High" || record.followUpPriority === "High"
    ).length,
    overdueFollowUps: overdueLeads.length,
    quotationReady: records.filter(
      (record) => record.quotationReadiness === "Ready"
    ).length,
    quotationNotReady: records.filter(
      (record) => record.quotationReadiness === "Not Ready"
    ).length,
    averageLeadScore,
    leadPriorityDistribution,
    followUpStageDistribution,
    purchaseIntentDistribution,
    recentHighValueLeads,
    overdueLeads
  };
}
