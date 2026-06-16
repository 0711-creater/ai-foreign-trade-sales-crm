import Link from "next/link";

export default function NotFound() {
  return (
    <section className="bg-white py-24">
      <div className="container-page text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">404</p>
        <h1 className="mt-3 text-4xl font-bold text-zinc-950">Page not found</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-600">
          The page or product you are looking for does not exist in the current MVP data.
        </p>
        <Link href="/products" className="btn-base mt-8 bg-brand-600 text-white hover:bg-brand-700">
          View Products
        </Link>
      </div>
    </section>
  );
}
