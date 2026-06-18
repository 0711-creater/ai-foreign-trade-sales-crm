import type {
  LeadPriority,
  PurchaseIntent,
  QuotationReadiness
} from "@/lib/aiInquiryAnalyzer";

export const followUpStages = [
  "New",
  "First Contact",
  "Quotation Sent",
  "Waiting Reply",
  "Negotiation",
  "Closed",
  "Lost"
] as const;

export type FollowUpStage = (typeof followUpStages)[number];
export type FollowUpPriority = LeadPriority;

export type FollowUpPlanInput = {
  leadPriority: LeadPriority;
  leadScore: number;
  purchaseIntent: PurchaseIntent;
  quotationReadiness: QuotationReadiness;
  missingInformation: string[];
  requiredQuestions: string[];
  now?: Date;
};

export type FollowUpPlan = {
  followUpPriority: FollowUpPriority;
  followUpDueAt: string;
  followUpStage: FollowUpStage;
  nextAction: string;
};

const priorityPlans: Record<
  LeadPriority,
  {
    dueInMilliseconds: number;
    nextAction: string;
  }
> = {
  High: {
    dueInMilliseconds: 2 * 60 * 60 * 1000,
    nextAction: "Review inquiry and send first response as soon as possible."
  },
  Medium: {
    dueInMilliseconds: 24 * 60 * 60 * 1000,
    nextAction: "Review inquiry and prepare follow-up questions or quotation."
  },
  Low: {
    dueInMilliseconds: 3 * 24 * 60 * 60 * 1000,
    nextAction: "Check inquiry details and decide whether to follow up."
  }
};

export function generateFollowUpPlan(input: FollowUpPlanInput): FollowUpPlan {
  const baseTime = input.now ?? new Date();
  const priorityPlan = priorityPlans[input.leadPriority];
  const dueAt = new Date(baseTime.getTime() + priorityPlan.dueInMilliseconds);

  return {
    followUpPriority: input.leadPriority,
    followUpDueAt: dueAt.toISOString(),
    followUpStage: "New",
    nextAction: priorityPlan.nextAction
  };
}
