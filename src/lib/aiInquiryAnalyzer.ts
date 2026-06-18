export type InquiryData = {
  name: string;
  email: string;
  company: string;
  country: string;
  interestedProduct: string;
  quantity: string;
  message: string;
};

export type AnalysisMode = "mock" | "deepseek";

export type PurchaseIntent = "High" | "Medium" | "Low / Sample Stage" | "Sample Stage" | "Urgent Inquiry";

export type QuotationReadiness = "Ready" | "Not Ready";

export type LeadPriority = "High" | "Medium" | "Low";

export type FallbackReason =
  | "Missing DEEPSEEK_API_KEY"
  | "Invalid DeepSeek API key"
  | "Insufficient DeepSeek API balance"
  | "DeepSeek rate limit reached"
  | "DeepSeek model not found"
  | "Invalid JSON response from DeepSeek"
  | "DeepSeek API request failed";

export type InquiryAnalysisResult = {
  customerType: string;
  purchaseIntent: PurchaseIntent;
  inquirySummary: string;
  suggestedReplyEmail: string;
  whatsappFollowUpMessage: string;
  nextFollowUpSuggestion: string;
  quotationReadiness: QuotationReadiness;
  missingInformation: string[];
  requiredQuestions: string[];
  quotationRisk: string;
  recommendedNextAction: string;
  leadScore: number;
  leadPriority: LeadPriority;
  leadScoreReason: string;
  recommendedFollowUpTime: string;
  salesStrategy: string;
  mode: AnalysisMode;
  fallbackReason?: FallbackReason;
  notificationSent?: boolean;
  notificationMode?: "mock" | "email";
  notificationWarning?: string;
};

type NormalizedInquiryData = InquiryData & {
  normalizedName: string;
  normalizedCompany: string;
  normalizedCountry: string;
  destinationMarket: string;
  normalizedProduct: string;
  optimizedMessage: string;
  quantityNumber: number;
  formattedQuantity: string;
  hasFobRequest: boolean;
};

function parseQuantity(quantity: string) {
  const normalized = quantity.replace(/,/g, "");
  const match = normalized.match(/\d+/);

  return match ? Number(match[0]) : 0;
}

function formatQuantity(quantity: string) {
  const quantityNumber = parseQuantity(quantity);

  if (!quantityNumber) {
    return "Not specified";
  }

  return `${quantityNumber.toLocaleString("en-US")} pcs`;
}

function titleCaseName(name: string) {
  const cleanedName = name.trim();

  if (!cleanedName) {
    return "there";
  }

  return cleanedName
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeCountry(country: string) {
  const cleanedCountry = country.trim();
  const lowerCountry = cleanedCountry.toLowerCase();
  const countryMap: Record<string, string> = {
    uk: "United Kingdom",
    usa: "United States",
    us: "United States",
    uae: "United Arab Emirates"
  };

  return countryMap[lowerCountry] ?? titleCaseName(cleanedCountry);
}

function normalizeCompany(company: string) {
  const cleanedCompany = company.trim();

  return cleanedCompany || "Not specified";
}

function detectDestinationMarket(message: string) {
  const lowerMessage = message.toLowerCase();
  const countryPatterns: Array<[RegExp, string]> = [
    [/\bmexico\b/, "Mexico"],
    [/\b(united states|usa|us)\b/, "United States"],
    [/\b(united kingdom|uk)\b/, "United Kingdom"],
    [/\b(united arab emirates|uae)\b/, "United Arab Emirates"],
    [/\bcanada\b/, "Canada"],
    [/\bgermany\b/, "Germany"],
    [/\bfrance\b/, "France"],
    [/\baustralia\b/, "Australia"],
    [/\bjapan\b/, "Japan"],
    [/\bkorea\b/, "Korea"],
    [/\bsaudi arabia\b/, "Saudi Arabia"],
    [/\bbrazil\b/, "Brazil"],
    [/\bchile\b/, "Chile"],
    [/\bspain\b/, "Spain"],
    [/\bitaly\b/, "Italy"]
  ];

  const matchedCountry = countryPatterns.find(([pattern]) => pattern.test(lowerMessage));

  return matchedCountry?.[1] ?? "Not specified";
}

function hasFobRequest(message: string) {
  return /\bfob\b/i.test(message);
}

function normalizeProduct(product: string) {
  const cleanedProduct = product.trim();
  const lowerProduct = cleanedProduct.toLowerCase();
  const productMap: Record<string, string> = {
    bathroom: "Bathroom Mirror",
    "bathroom mirror": "Bathroom Mirror",
    "wall mirror": "Wall Mounted Bathroom Mirror",
    "led mirror": "LED Makeup Mirror",
    "travel mirror": "LED Travel Makeup Mirror",
    "compact mirror": "Compact Pocket Mirror",
    "gift mirror": "Custom Promotional Gift Mirror",
    "led makeup mirror": "LED Makeup Mirror",
    "led travel makeup mirror": "LED Travel Makeup Mirror",
    "rechargeable vanity mirror": "Rechargeable Vanity Mirror",
    "compact pocket mirror": "Compact Pocket Mirror",
    "wall mounted bathroom mirror": "Wall Mounted Bathroom Mirror",
    "custom promotional gift mirror": "Custom Promotional Gift Mirror"
  };

  if (productMap[lowerProduct]) {
    return productMap[lowerProduct];
  }

  if (lowerProduct.includes("bathroom")) {
    return "Bathroom Mirror";
  }

  if (lowerProduct.includes("wall") && lowerProduct.includes("mirror")) {
    return "Wall Mounted Bathroom Mirror";
  }

  if (lowerProduct.includes("travel") && lowerProduct.includes("mirror")) {
    return "LED Travel Makeup Mirror";
  }

  if (lowerProduct.includes("led") && lowerProduct.includes("mirror")) {
    return "LED Makeup Mirror";
  }

  if (lowerProduct.includes("compact") && lowerProduct.includes("mirror")) {
    return "Compact Pocket Mirror";
  }

  if (lowerProduct.includes("gift") && lowerProduct.includes("mirror")) {
    return "Custom Promotional Gift Mirror";
  }

  return "Mirror Product";
}

function optimizeRequirementWording(message: string) {
  return message
    .replace(/\bcheap\b/gi, "cost-effective")
    .replace(/\bcost-effective option\b/gi, "cost-effective options")
    .replace(/\blow price\b/gi, "competitive price")
    .replace(/\bfast delivery\b/gi, "shorter lead time")
    .replace(/\bcustom logo\b/gi, "logo customization")
    .replace(/^(we\s+need|need|we\s+are\s+looking\s+for|looking\s+for)\s+/i, "")
    .trim();
}

function getRequirementPhrase(message: string) {
  const cleanedMessage = message.trim();
  const lowerMessage = cleanedMessage.toLowerCase();

  if (!cleanedMessage) {
    return "custom mirror sourcing";
  }

  // 将买家口语化需求提炼成适合外贸邮件和 CRM 记录的专业短语。
  if (lowerMessage.includes("fob") && lowerMessage.includes("lead time")) {
    return "FOB price and lead time";
  }

  if (lowerMessage.includes("fob")) {
    return "FOB quotation";
  }

  if (lowerMessage.includes("cost-effective")) {
    return "cost-effective options";
  }

  if (lowerMessage.includes("competitive price")) {
    return "competitive price";
  }

  if (lowerMessage.includes("shorter lead time")) {
    return "shorter lead time";
  }

  if (lowerMessage.includes("logo customization")) {
    return "logo customization";
  }

  if (lowerMessage.includes("sample")) {
    return "sample confirmation";
  }

  return cleanedMessage.replace(/\.+$/, "");
}

function getEmailQuantityPhrase(formattedQuantity: string) {
  return formattedQuantity === "Not specified"
    ? "with quantity to be confirmed"
    : `with an estimated quantity of ${formattedQuantity}`;
}

function getQuantityContext(data: NormalizedInquiryData) {
  if (data.formattedQuantity === "Not specified") {
    return "Quantity can be confirmed before quotation.";
  }

  if (data.quantityNumber >= 1000) {
    return `${data.formattedQuantity} is within our regular production range.`;
  }

  return `${data.formattedQuantity} can be reviewed as an initial or sample-stage quantity.`;
}

function normalizeInquiryData(inquiryData: InquiryData): NormalizedInquiryData {
  return {
    ...inquiryData,
    normalizedName: titleCaseName(inquiryData.name),
    normalizedCompany: normalizeCompany(inquiryData.company),
    normalizedCountry: normalizeCountry(inquiryData.country),
    destinationMarket: detectDestinationMarket(inquiryData.message),
    normalizedProduct: normalizeProduct(inquiryData.interestedProduct),
    optimizedMessage: optimizeRequirementWording(inquiryData.message),
    quantityNumber: parseQuantity(inquiryData.quantity),
    formattedQuantity: formatQuantity(inquiryData.quantity),
    hasFobRequest: hasFobRequest(inquiryData.message)
  };
}

function getCustomerType(data: NormalizedInquiryData) {
  const message = data.message.toLowerCase();

  if (message.includes("wholesale") || message.includes("wholesaler")) {
    return "Wholesaler";
  }

  if (message.includes("importer") || message.includes("import")) {
    return "Importer";
  }

  if (message.includes("distributor")) {
    return "Distributor";
  }

  if (message.includes("amazon")) {
    return "Amazon Seller";
  }

  if (data.quantityNumber >= 1000) {
    return "Potential B2B Buyer";
  }

  return "Early-stage Buyer";
}

function getPurchaseIntent(data: NormalizedInquiryData): PurchaseIntent {
  const message = data.message.toLowerCase();

  if (message.includes("sample")) {
    return "Sample Stage";
  }

  if (message.includes("urgent")) {
    return "Urgent Inquiry";
  }

  if (data.quantityNumber >= 1000) {
    return "High";
  }

  if (data.quantityNumber >= 300) {
    return "Medium";
  }

  return "Low / Sample Stage";
}

function getCountryPhrase(country: string) {
  const countriesWithArticle = ["United Kingdom", "United States", "United Arab Emirates"];

  return countriesWithArticle.includes(country) ? `the ${country}` : country;
}

function getDestinationMarketPhrase(destinationMarket: string) {
  if (destinationMarket === "Not specified") {
    return "your target market";
  }

  return `the ${destinationMarket} market`;
}

function getDestinationMarketSummary(destinationMarket: string) {
  return destinationMarket;
}

function pluralizeProduct(product: string) {
  if (product === "Mirror Product") {
    return product;
  }

  return product.endsWith("s") ? product : `${product}s`;
}

function getProductFitLine(product: string) {
  const lowerProduct = product.toLowerCase();

  if (lowerProduct.includes("led")) {
    return `The ${product} line fits buyers looking for LED lighting, portable use, logo customization and retail-ready packaging.`;
  }

  if (lowerProduct.includes("bathroom")) {
    return `The ${product} line fits bathroom, hotel, apartment and home improvement supply channels.`;
  }

  if (lowerProduct.includes("compact")) {
    return `The ${product} line fits beauty accessories, promotional gifts and private label retail programs.`;
  }

  return `The ${product} line fits wholesale, private label and promotional mirror programs.`;
}

function buildReplyEmail(data: NormalizedInquiryData) {
  const productPlural = pluralizeProduct(data.normalizedProduct);
  const destinationMarketPhrase = getDestinationMarketPhrase(data.destinationMarket);
  const productFitLine = getProductFitLine(data.normalizedProduct);
  const requirementPhrase = getRequirementPhrase(data.optimizedMessage);
  const tradeTermLine = data.hasFobRequest
    ? "We can quote based on FOB Ningbo or your preferred FOB port after confirming the final specifications."
    : "Please also confirm your preferred FOB port or required trade term for the quotation.";

  // Mock AI 邮件生成：当前只基于本地规则生成，后续可作为真实 API 失败时的 fallback。
  return `Dear ${data.normalizedName},

Thank you for your inquiry. We understand that your company is sourcing ${productPlural} for ${destinationMarketPhrase}, ${getEmailQuantityPhrase(data.formattedQuantity)} and a request for ${requirementPhrase}.

${productFitLine} ${getQuantityContext(data)} We can support MOQ-based production, logo customization, color options and custom packaging, with lead time usually around 25-40 days after sample approval.

To prepare an accurate quotation, please confirm final size, mirror thickness, frame material/color, whether LED, anti-fog or backlit functions are required, logo requirement, packaging requirement, preferred FOB port and target delivery schedule. ${tradeTermLine}

Best regards,
MirrorPro Supply Sales Team`;
}

function buildWhatsappMessage(data: NormalizedInquiryData) {
  const quantityPhrase = data.formattedQuantity === "Not specified" ? "" : ` for ${data.formattedQuantity}`;

  return `Hi ${data.normalizedName}, thanks for your inquiry about ${data.normalizedProduct}${quantityPhrase}. Could you confirm final specifications, packaging and preferred FOB port so we can prepare an accurate FOB quotation?`;
}

function buildNextFollowUpSuggestion(data: NormalizedInquiryData) {
  const message = data.message.toLowerCase();

  if (message.includes("sample")) {
    return "Confirm sample specifications, packaging, preferred FOB port or trade term and target delivery schedule first, then prepare sample cost and formal quotation.";
  }

  if (message.includes("cheap") || data.optimizedMessage.toLowerCase().includes("cost-effective")) {
    return "Confirm final specifications, acceptable configuration range, packaging, preferred FOB port and target delivery schedule, then recommend a cost-effective quotation option.";
  }

  if (data.quantityNumber >= 1000) {
    return "Confirm final size, mirror thickness, frame material/color, function requirements, packaging, preferred FOB port and target delivery schedule, then prepare a bulk quotation.";
  }

  if (message.includes("urgent")) {
    return "Confirm required delivery date, final specifications, packaging and preferred FOB port first, then check whether standard configuration can support a faster quotation and production schedule.";
  }

  return "Confirm specifications, packaging, preferred FOB port and target delivery schedule first, then prepare a formal quotation.";
}

function includesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function hasDimension(text: string) {
  return /\d+(\.\d+)?\s*(x|×|\*)\s*\d+/.test(text) || /\d+(\.\d+)?\s*(cm|mm|inch|inches|")/.test(text);
}

function hasPreferredFobPort(text: string) {
  return /\bfob\s+(ningbo|shanghai|shenzhen|xiamen|qingdao|guangzhou|yiwu)\b/.test(text) ||
    text.includes("preferred fob port") ||
    text.includes("fob port");
}

function getMissingInformation(data: NormalizedInquiryData) {
  const message = data.message.toLowerCase();
  const product = data.interestedProduct.toLowerCase();
  const combinedText = `${message} ${product}`;
  const missingInformation: string[] = [];

  if (!data.normalizedProduct || data.normalizedProduct === "Mirror Product") {
    missingInformation.push("Product");
  }

  if (!data.quantityNumber) {
    missingInformation.push("Quantity");
  }

  if (!combinedText.includes("size") && !hasDimension(combinedText)) {
    missingInformation.push("Final size");
  }

  if (!includesAnyKeyword(combinedText, ["material", "glass", "metal", "aluminum", "stainless", "plastic", "acrylic", "wood"])) {
    missingInformation.push("Material");
  }

  if (!includesAnyKeyword(combinedText, ["thickness", "thick", "3mm", "4mm", "5mm", "6mm"])) {
    missingInformation.push("Mirror thickness");
  }

  if (!includesAnyKeyword(combinedText, ["frame color", "color", "black", "white", "gold", "silver", "chrome"])) {
    missingInformation.push("Frame color");
  }

  if (!includesAnyKeyword(combinedText, ["logo", "no logo", "private label", "branding"])) {
    missingInformation.push("Logo requirement");
  }

  if (!includesAnyKeyword(combinedText, ["packaging", "package", "box", "carton", "gift box", "mail box"])) {
    missingInformation.push("Packaging requirement");
  }

  if (!includesAnyKeyword(combinedText, ["target price", "target cost", "budget", "price range", "acceptable price"])) {
    missingInformation.push("Target price");
  }

  if (!hasPreferredFobPort(combinedText)) {
    missingInformation.push("Preferred FOB port");
  }

  if (!includesAnyKeyword(combinedText, ["delivery schedule", "delivery date", "timeline", "lead time", "urgent", "ship date"])) {
    missingInformation.push("Delivery schedule");
  }

  return missingInformation;
}

function getRequiredQuestions(missingInformation: string[]) {
  const questionMap: Record<string, string> = {
    Product: "Could you please confirm the exact mirror model or product type you need?",
    Quantity: "Could you please confirm the estimated order quantity?",
    "Final size": "Could you please confirm the final mirror size?",
    Material: "Which material or frame material do you prefer for this mirror?",
    "Mirror thickness": "Could you please confirm the mirror thickness requirement?",
    "Frame color": "Which frame color or finish do you need?",
    "Logo requirement": "Do you need logo customization or private label branding?",
    "Packaging requirement": "Do you need standard packaging or custom packaging?",
    "Target price": "Do you have a target price or acceptable price range for this order?",
    "Preferred FOB port": "Which FOB port do you prefer for quotation?",
    "Delivery schedule": "What is your target delivery schedule or expected lead time?"
  };

  return missingInformation.map((item) => questionMap[item] ?? `Could you please confirm ${item.toLowerCase()}?`);
}

function buildQuotationReadiness(data: NormalizedInquiryData) {
  const missingInformation = getMissingInformation(data);
  const quotationReadiness: QuotationReadiness = missingInformation.length === 0 ? "Ready" : "Not Ready";

  if (quotationReadiness === "Ready") {
    return {
      quotationReadiness,
      missingInformation,
      requiredQuestions: [],
      quotationRisk: "The key quotation information is generally clear, so the sales team can prepare a formal quotation after final review.",
      recommendedNextAction: "Prepare a formal quotation based on the confirmed specifications, packaging, FOB port and delivery schedule."
    };
  }

  return {
    quotationReadiness,
    missingInformation,
    requiredQuestions: getRequiredQuestions(missingInformation),
    quotationRisk: "The inquiry lacks key specifications, so quoting now may lead to inaccurate pricing or repeated quotation revisions.",
    recommendedNextAction: "Ask the buyer to confirm product specifications, packaging, target price, preferred FOB port and delivery schedule before preparing a formal quotation."
  };
}

function getLeadPriority(leadScore: number): LeadPriority {
  if (leadScore >= 80) {
    return "High";
  }

  if (leadScore >= 50) {
    return "Medium";
  }

  return "Low";
}

function getRecommendedFollowUpTime(leadPriority: LeadPriority, message: string) {
  const lowerMessage = message.toLowerCase();

  if (leadPriority === "High" || includesAnyKeyword(lowerMessage, ["urgent", "asap", "fast delivery"])) {
    return "Within 2 hours";
  }

  if (leadPriority === "Medium") {
    return "Within 24 hours";
  }

  return "Within 2-3 days";
}

function buildLeadScoring(
  data: NormalizedInquiryData,
  customerType: string,
  purchaseIntent: PurchaseIntent,
  quotationReadiness: QuotationReadiness
) {
  const message = data.message.toLowerCase();
  const reasons: string[] = [];
  let leadScore = 20;

  if (data.quantityNumber >= 5000) {
    leadScore += 35;
    reasons.push("large order quantity");
  } else if (data.quantityNumber >= 1000) {
    leadScore += 25;
    reasons.push("bulk order quantity");
  } else if (data.quantityNumber >= 100) {
    leadScore += 15;
    reasons.push("moderate order quantity");
  } else if (data.quantityNumber > 0) {
    leadScore += 5;
    reasons.push("small or sample-stage quantity");
  } else {
    reasons.push("quantity not specified");
  }

  if (purchaseIntent === "High" || purchaseIntent === "Urgent Inquiry") {
    leadScore += 20;
    reasons.push("strong purchase intent");
  } else if (purchaseIntent === "Medium") {
    leadScore += 12;
    reasons.push("medium purchase intent");
  } else {
    leadScore += 5;
    reasons.push("early-stage or sample inquiry");
  }

  if (["Importer", "Distributor", "Wholesaler"].includes(customerType)) {
    leadScore += 15;
    reasons.push(`${customerType.toLowerCase()} buyer profile`);
  } else if (customerType === "Amazon Seller") {
    leadScore += 12;
    reasons.push("Amazon seller profile");
  } else if (customerType === "Potential B2B Buyer") {
    leadScore += 10;
    reasons.push("potential B2B buyer profile");
  } else {
    leadScore += 3;
    reasons.push("buyer type needs qualification");
  }

  if (quotationReadiness === "Ready") {
    leadScore += 10;
    reasons.push("quotation information is mostly ready");
  } else {
    leadScore += 3;
    reasons.push("quotation information still needs confirmation");
  }

  const qualitySignals = [
    hasDimension(message) || message.includes("size"),
    /\bquantity\b/.test(message) || /\d[\d,]*\s*(pcs|pieces|units)\b/.test(message),
    includesAnyKeyword(message, ["fob", "exw", "cif", "ddp", "lead time"]),
    data.destinationMarket !== "Not specified" || message.includes("market"),
    includesAnyKeyword(message, ["packaging", "package", "carton", "box"]),
    includesAnyKeyword(message, ["logo", "private label", "branding"]),
    includesAnyKeyword(message, ["target price", "material", "thickness"])
  ].filter(Boolean).length;

  leadScore += qualitySignals * 3;

  if (qualitySignals >= 3) {
    reasons.push("message includes useful quotation details");
  }

  if (/^\s*(price\??|cheap\??)\s*$/i.test(data.message.trim()) || data.message.trim().length < 12) {
    leadScore -= 15;
    reasons.push("message is too short for reliable qualification");
  }

  if (includesAnyKeyword(message, ["urgent", "asap", "fast delivery"])) {
    leadScore += 5;
    reasons.push("urgent timing request");
  }

  leadScore = Math.min(100, Math.max(0, Math.round(leadScore)));

  const leadPriority = getLeadPriority(leadScore);
  const recommendedFollowUpTime = getRecommendedFollowUpTime(leadPriority, message);
  const baseSalesStrategy =
    leadPriority === "High"
      ? "Prioritize this lead, confirm missing quotation details quickly, and prepare a structured quotation or sample plan."
      : leadPriority === "Medium"
        ? "Follow up within one business day, qualify specifications and target price, then decide whether to prepare a formal quotation."
        : "Use a light qualification reply first, confirm buyer role, quantity and project timeline before spending time on a detailed quotation.";
  const salesStrategy = includesAnyKeyword(message, ["urgent", "asap", "fast delivery"])
    ? `${baseSalesStrategy} Confirm the required delivery date and production feasibility before making any lead-time commitment.`
    : baseSalesStrategy;

  return {
    leadScore,
    leadPriority,
    leadScoreReason: `Score ${leadScore}/100 based on ${reasons.join(", ")}.`,
    recommendedFollowUpTime,
    salesStrategy
  };
}

export function analyzeInquiry(inquiryData: InquiryData): InquiryAnalysisResult {
  const normalizedData = normalizeInquiryData(inquiryData);
  const purchaseIntent = getPurchaseIntent(normalizedData);
  const customerType = getCustomerType(normalizedData);
  const quotationCheck = buildQuotationReadiness(normalizedData);
  const leadScoring = buildLeadScoring(
    normalizedData,
    customerType,
    purchaseIntent,
    quotationCheck.quotationReadiness
  );

  return {
    customerType,
    purchaseIntent,
    inquirySummary: `Buyer: ${normalizedData.normalizedName}. Company: ${normalizedData.normalizedCompany}. Buyer Location: ${getCountryPhrase(normalizedData.normalizedCountry)}. Destination Market: ${getDestinationMarketSummary(normalizedData.destinationMarket)}. Product: ${pluralizeProduct(normalizedData.normalizedProduct)}. Quantity: ${normalizedData.formattedQuantity}. Request: ${getRequirementPhrase(normalizedData.optimizedMessage)}.`,
    suggestedReplyEmail: buildReplyEmail(normalizedData),
    whatsappFollowUpMessage: buildWhatsappMessage(normalizedData),
    nextFollowUpSuggestion: buildNextFollowUpSuggestion(normalizedData),
    ...quotationCheck,
    ...leadScoring,
    mode: "mock"
  };
}
