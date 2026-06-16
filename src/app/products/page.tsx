import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SectionTitle from "@/components/SectionTitle";
import { getProductsByCategory, productCategories, products } from "@/data/products";

export const metadata: Metadata = {
  title: "Mirror Products for Wholesale Buyers | MirrorPro Supply",
  description:
    "Browse B2B mirror products including LED travel makeup mirrors, rechargeable vanity mirrors, compact pocket mirrors, wall mounted bathroom mirrors and custom promotional gift mirrors."
};

export default function ProductsPage() {
  return (
    <>
      <section className="bg-white py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Products"
            title="Mirror products for global B2B buyers"
            description="Browse five MVP product lines for wholesale, private label, promotional gift and project supply programs."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            {productCategories.map((category) => (
              <a
                key={category.slug}
                href={`#${category.slug}`}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-brand-600 hover:text-brand-700"
              >
                {category.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950">All Products</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                Each product card shows MOQ and lead time first, so B2B buyers can quickly judge sourcing fit.
              </p>
            </div>
            <Link href="/contact" className="btn-base bg-brand-600 text-white hover:bg-brand-700">
              Contact Us
            </Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Category Index"
            title="Find products by sourcing category"
            description="Use these category anchors to jump back to the product line that matches your buying plan."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {productCategories.map((category) => {
              const categoryProducts = getProductsByCategory(category.title);

              return (
                <div key={category.slug} id={category.slug} className="scroll-mt-24 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                  <h3 className="text-base font-bold text-zinc-950">{category.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{category.description}</p>
                  <div className="mt-4 space-y-2">
                    {categoryProducts.length > 0 ? (
                      categoryProducts.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="block text-sm font-semibold text-brand-700 hover:text-brand-900"
                        >
                          {product.name}
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500">Custom projects available on request.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
