import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import InquiryForm from "@/components/InquiryForm";
import ProcessSteps from "@/components/ProcessSteps";
import ProductCard from "@/components/ProductCard";
import SectionTitle from "@/components/SectionTitle";
import { getFeaturedProducts, productCategories } from "@/data/products";

export const metadata: Metadata = {
  title: "Custom Mirror Manufacturer for B2B Buyers | MirrorPro Supply",
  description:
    "OEM/ODM mirror manufacturer for LED travel makeup mirrors, rechargeable vanity mirrors, compact mirrors, wall mirrors and promotional gift mirrors."
};

const advantages = [
  "OEM / ODM Support",
  "Logo Customization",
  "Custom Packaging",
  "Bulk Production",
  "Quality Inspection"
];

export default function HomePage() {
  const featuredProducts = getFeaturedProducts();
  const heroProduct = featuredProducts[0];

  return (
    <>
      <section className="bg-white">
        <div className="container-page grid min-h-[680px] items-center gap-10 py-16 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              B2B Mirror Manufacturer
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-zinc-950 md:text-6xl">
              Custom Mirror Manufacturer for Global B2B Buyers
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              OEM/ODM LED makeup mirrors, travel mirrors, compact mirrors and promotional mirrors
              for brands, importers, wholesalers and Amazon sellers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className="btn-base bg-brand-600 text-white hover:bg-brand-700">
                View Products
              </Link>
              <Link
                href="/contact"
                className="btn-base border border-brand-600 bg-white text-brand-700 hover:bg-brand-50"
              >
                Send Inquiry
              </Link>
              <Link
                href="/contact"
                className="btn-base border border-zinc-300 bg-white text-zinc-900 hover:border-brand-600 hover:text-brand-700"
              >
                Request a Quote
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {["500+ MOQ options", "OEM packaging", "Export support"].map((item) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-zinc-950">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {heroProduct ? (
            <div className="rounded-lg border border-zinc-200 bg-brand-50 p-4 shadow-soft">
              <Image
                src={heroProduct.image}
                alt={heroProduct.name}
                width={1200}
                height={800}
                priority
                className="h-full min-h-[360px] w-full rounded-md object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Product Categories"
            title="Mirror product lines for wholesale and private label buyers"
            description="Start with an existing product category or send your own design brief for custom development."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {productCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/products#${category.slug}`}
                className="rounded-lg border border-zinc-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand-500"
              >
                <h3 className="text-base font-bold text-zinc-950">{category.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Supplier Advantages"
            title="Built for importers, wholesalers and brand owners"
            description="The MVP highlights the trust signals B2B buyers usually check before sending an inquiry."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-5">
            {advantages.map((advantage) => (
              <div key={advantage} className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
                  OK
                </span>
                <h3 className="mt-4 text-base font-bold text-zinc-950">{advantage}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionTitle
              eyebrow="Featured Products"
              title="Recommended mirror products"
              description="Representative SKUs for LED, travel, compact, wall mounted and promotional mirror programs."
            />
            <Link href="/products" className="btn-base border border-brand-600 text-brand-700 hover:bg-brand-50">
              View All Products
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Customization Process"
            title="From buyer requirements to delivery"
            description="A simple OEM / ODM workflow helps overseas buyers understand how custom mirror orders move forward."
          />
          <div className="mt-10">
            <ProcessSteps />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionTitle
            eyebrow="Inquiry"
            title="Contact Us for mirror sourcing and custom packaging"
            description="Share target quantity, logo, packaging, destination market and delivery timeline. This MVP form is ready to connect with email, CRM or backend API later."
          />
          <InquiryForm />
        </div>
      </section>
    </>
  );
}
