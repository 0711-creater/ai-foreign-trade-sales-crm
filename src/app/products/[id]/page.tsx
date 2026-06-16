import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import InquiryForm from "@/components/InquiryForm";
import ProductCard from "@/components/ProductCard";
import { getProductById, products } from "@/data/products";

type ProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return products.map((product) => ({
    id: product.id
  }));
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);

  return {
    title: product ? `${product.name} for B2B Buyers | MirrorPro Supply` : "Product | MirrorPro Supply",
    description: product?.description,
    keywords: product
      ? [
          product.name,
          product.category,
          "B2B mirror supplier",
          "OEM mirror manufacturer",
          "custom mirror wholesale"
        ]
      : undefined
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 3);

  return (
    <>
      <section className="bg-white py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-zinc-200 bg-brand-50 p-4 shadow-soft">
            <Image
              src={product.image}
              alt={product.name}
              width={1200}
              height={800}
              priority
              className="h-full min-h-[420px] w-full rounded-md object-cover"
            />
          </div>

          <div>
            <Link href="/products" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
              {"<-"} Back to Products
            </Link>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-brand-700">
              {product.category}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">{product.name}</h1>
            <p className="mt-5 text-base leading-7 text-zinc-600">{product.description}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Material", product.material],
                ["Size", product.size],
                ["MOQ", product.moq],
                ["Lead Time", product.leadTime]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-zinc-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#inquiry" className="btn-base bg-brand-600 text-white hover:bg-brand-700">
                Request a Quote
              </a>
              <Link
                href="/contact"
                className="btn-base border border-zinc-300 bg-white text-zinc-900 hover:border-brand-600 hover:text-brand-700"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-zinc-950">Product Features</h2>
            <ul className="mt-5 space-y-3">
              {product.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm leading-6 text-zinc-700">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    +
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-zinc-950">Customization & Target Buyers</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-zinc-950">Customization</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{product.customization}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950">Target Buyers</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.targetBuyers.map((buyer) => (
                    <span key={buyer} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                      {buyer}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="inquiry" className="scroll-mt-24 bg-white py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Request a Quote</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
              Send inquiry for {product.name}
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Share quantity, destination market, logo, packaging and sample requirements. This MVP form
              only mocks submission on the front end.
            </p>
          </div>
          <InquiryForm defaultProductName={product.name} />
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="py-16">
          <div className="container-page">
            <h2 className="text-2xl font-bold text-zinc-950">Related Products</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
