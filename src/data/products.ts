import type { Product, ProductCategoryInfo } from "@/types/product";

// 产品分类数据用于首页分类模块和产品列表页锚点导航。
export const productCategories: ProductCategoryInfo[] = [
  {
    title: "LED Makeup Mirrors",
    slug: "led-makeup-mirrors",
    description: "Lighted vanity and makeup mirrors for beauty brands, importers and retail channels."
  },
  {
    title: "Travel Makeup Mirrors",
    slug: "travel-makeup-mirrors",
    description: "Portable mirrors designed for travel retail, gift sets and online marketplace sellers."
  },
  {
    title: "Compact Mirrors",
    slug: "compact-mirrors",
    description: "Pocket-size mirrors for cosmetic brands, promotional campaigns and wholesale orders."
  },
  {
    title: "Wall Mirrors",
    slug: "wall-mirrors",
    description: "Wall-mounted mirrors for bathroom, hotel, apartment and commercial project buyers."
  },
  {
    title: "Promotional Mirrors",
    slug: "promotional-mirrors",
    description: "Custom logo mirrors for brand promotions, corporate gifts and private label programs."
  }
];

// 当前 MVP 使用静态产品数据；后续可以替换成 CMS、数据库或后台 API。
export const products: Product[] = [
  {
    id: "led-travel-makeup-mirror",
    name: "LED Travel Makeup Mirror",
    category: "Travel Makeup Mirrors",
    description:
      "A portable LED travel makeup mirror for overseas buyers sourcing beauty accessories, travel retail items and online marketplace products. Suitable for OEM programs with custom logo, color and packaging requirements.",
    features: [
      "Foldable and lightweight travel design",
      "Built-in LED light for makeup use",
      "USB rechargeable battery option",
      "Stable cover stand for desktop use",
      "Compact size for gift sets and retail packs"
    ],
    material: "ABS shell, glass mirror, LED light, rechargeable battery",
    size: "135 x 95 mm / custom size available",
    moq: "1,000 pcs",
    customization: "Logo printing, color customization, LED light option, pouch and custom packaging",
    leadTime: "25-35 days after sample approval",
    targetBuyers: ["Importers", "Wholesalers", "Beauty brands", "Gift companies", "Amazon sellers"],
    image: "/images/products/led-travel-makeup-mirror.jpg",
    featured: true
  },
  {
    id: "rechargeable-vanity-mirror",
    name: "Rechargeable Vanity Mirror",
    category: "LED Makeup Mirrors",
    description:
      "A rechargeable desktop vanity mirror for beauty brands, salon suppliers and retail distributors. The product supports private label orders and is suitable for premium makeup accessory collections.",
    features: [
      "Rechargeable cordless design",
      "Adjustable LED brightness",
      "Touch sensor control",
      "Stable desktop base",
      "Retail gift box support"
    ],
    material: "Glass mirror, ABS frame, metal base, LED strip",
    size: "8 inch / 10 inch / custom size available",
    moq: "500 pcs",
    customization: "Logo printing, frame color customization, color temperature selection, custom packaging",
    leadTime: "30-40 days after deposit and artwork confirmation",
    targetBuyers: ["Importers", "Wholesalers", "Beauty brands", "Retail chains", "Amazon sellers"],
    image: "/images/products/rechargeable-vanity-mirror.jpg",
    featured: true
  },
  {
    id: "compact-pocket-mirror",
    name: "Compact Pocket Mirror",
    category: "Compact Mirrors",
    description:
      "A classic compact pocket mirror for cosmetic brands, promotional agencies and wholesale beauty accessory buyers. It is easy to customize for private label, campaign gifts and retail display programs.",
    features: [
      "Double-sided compact mirror",
      "Optional magnifying mirror side",
      "Slim pocket-friendly body",
      "Snap closure for daily carrying",
      "Cost-effective for bulk orders"
    ],
    material: "Glass mirror, ABS or metal shell",
    size: "70 mm diameter / custom shape available",
    moq: "2,000 pcs",
    customization: "Logo printing, shell color customization, custom shape, insert card and custom packaging",
    leadTime: "20-30 days after artwork confirmation",
    targetBuyers: ["Importers", "Wholesalers", "Beauty brands", "Gift companies", "Promotional agencies"],
    image: "/images/products/compact-pocket-mirror.jpg",
    featured: true
  },
  {
    id: "wall-mounted-bathroom-mirror",
    name: "Wall Mounted Bathroom Mirror",
    category: "Wall Mirrors",
    description:
      "A wall mounted bathroom mirror for hotel projects, apartment suppliers and home improvement distributors. Available with different frame finishes, LED lighting and project packaging options.",
    features: [
      "Wall mounted installation",
      "Optional LED backlight",
      "Optional anti-fog function",
      "Multiple shapes and frame finishes",
      "Export carton packing for project orders"
    ],
    material: "Silver mirror, aluminum frame, optional LED strip and anti-fog pad",
    size: "600 x 800 mm / 700 x 900 mm / custom size available",
    moq: "200 pcs",
    customization: "Size customization, frame color, LED option, carton label and custom packaging",
    leadTime: "35-45 days depending on size and order quantity",
    targetBuyers: ["Importers", "Wholesalers", "Hotel suppliers", "Bathroom brands", "Project contractors"],
    image: "/images/products/wall-mounted-bathroom-mirror.jpg",
    featured: true
  },
  {
    id: "custom-promotional-gift-mirror",
    name: "Custom Promotional Gift Mirror",
    category: "Promotional Mirrors",
    description:
      "A custom promotional gift mirror for brand campaigns, corporate gifts and event giveaways. Designed for B2B buyers who need flexible logo methods, packaging choices and bulk production support.",
    features: [
      "Custom logo and artwork support",
      "Flexible shape and color options",
      "Suitable for gift and campaign use",
      "Private label packaging available",
      "Bulk production with cost control"
    ],
    material: "Glass mirror, ABS / metal / PU cover options",
    size: "Custom size based on buyer brief",
    moq: "1,000 pcs",
    customization: "OEM / ODM design, logo printing, color customization, custom packaging and barcode label",
    leadTime: "25-40 days after sample approval",
    targetBuyers: ["Importers", "Wholesalers", "Gift companies", "Beauty brands", "Amazon sellers"],
    image: "/images/products/custom-promotional-gift-mirror.jpg",
    featured: true
  }
];

export function getFeaturedProducts() {
  return products.filter((product) => product.featured);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getProductsByCategory(category: string) {
  return products.filter((product) => product.category === category);
}
