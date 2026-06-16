// 产品分类使用联合类型，避免页面里写错分类名称。
export type ProductCategory =
  | "LED Makeup Mirrors"
  | "Travel Makeup Mirrors"
  | "Compact Mirrors"
  | "Wall Mirrors"
  | "Promotional Mirrors";

// 单个产品的数据结构，后续接数据库时可以继续沿用这些字段。
export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  features: string[];
  material: string;
  size: string;
  moq: string;
  customization: string;
  leadTime: string;
  targetBuyers: string[];
  image: string;
  featured?: boolean;
};

export type ProductCategoryInfo = {
  title: ProductCategory;
  slug: string;
  description: string;
};
