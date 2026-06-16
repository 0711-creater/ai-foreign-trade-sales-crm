import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-soft">
      {/* Product image path comes from static product data. Replace it there when real photos are ready. */}
      <Link href={`/products/${product.id}`} className="block bg-brand-50">
        <Image
          src={product.image}
          alt={product.name}
          width={1200}
          height={800}
          className="h-56 w-full object-cover"
        />
      </Link>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {product.category}
          </p>
          <h3 className="mt-2 text-lg font-bold text-zinc-950">
            <Link href={`/products/${product.id}`} className="hover:text-brand-700">
              {product.name}
            </Link>
          </h3>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-zinc-600">{product.description}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">MOQ</p>
            <p className="mt-1 font-semibold text-zinc-950">{product.moq}</p>
          </div>
          <div className="rounded-md bg-zinc-50 p-3">
            <p className="text-xs text-zinc-500">Lead Time</p>
            <p className="mt-1 font-semibold text-zinc-950">{product.leadTime}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/products/${product.id}`}
            className="btn-base border border-brand-600 text-brand-700 hover:bg-brand-50"
          >
            View Details
          </Link>
          <Link href="/contact" className="btn-base bg-brand-600 text-white hover:bg-brand-700">
            Request a Quote
          </Link>
        </div>
      </div>
    </article>
  );
}
