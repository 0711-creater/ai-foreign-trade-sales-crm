export type TradeTerm = "FOB" | "EXW" | "CIF" | "DDP";

export type QuotationInput = {
  productCost: number;
  packagingCost: number;
  domesticHandlingCost: number;
  profitMargin: number;
  quantity: number;
  currency: string;
  tradeTerm: TradeTerm;
  fobPort: string;
  leadTime: string;
  paymentTerm: string;
  quotationNote: string;
};

export type QuotationResult = {
  baseCost: number;
  suggestedUnitPrice: number;
  totalAmount: number;
  profitAmountPerUnit: number;
  quantity: number;
  currency: string;
  tradeTerm: TradeTerm;
  fobPort: string;
  leadTime: string;
  paymentTerm: string;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateQuotation(input: QuotationInput): QuotationResult {
  const baseCost = roundMoney(input.productCost + input.packagingCost + input.domesticHandlingCost);
  const rawSuggestedUnitPrice = baseCost * (1 + input.profitMargin / 100);
  const suggestedUnitPrice = roundMoney(rawSuggestedUnitPrice);
  const profitAmountPerUnit = suggestedUnitPrice - baseCost;
  const totalAmount = suggestedUnitPrice * input.quantity;

  return {
    baseCost,
    suggestedUnitPrice,
    totalAmount: roundMoney(totalAmount),
    profitAmountPerUnit: roundMoney(profitAmountPerUnit),
    quantity: input.quantity,
    currency: input.currency,
    tradeTerm: input.tradeTerm,
    fobPort: input.fobPort,
    leadTime: input.leadTime,
    paymentTerm: input.paymentTerm
  };
}
