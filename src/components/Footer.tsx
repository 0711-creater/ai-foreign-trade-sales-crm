import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="container-page grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-bold text-zinc-950">MirrorPro Supply</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">
            Custom mirror manufacturer serving global B2B buyers with OEM / ODM support,
            packaging customization and bulk production.
          </p>
        </div>

        <div>
          <p className="font-semibold text-zinc-950">Pages</p>
          <div className="mt-3 grid gap-2 text-sm text-zinc-600">
            <Link href="/products" className="hover:text-brand-700">
              Products
            </Link>
            <Link href="/customization" className="hover:text-brand-700">
              Customization
            </Link>
            <Link href="/about" className="hover:text-brand-700">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-brand-700">
              Contact Us
            </Link>
          </div>
        </div>

        <div>
          <p className="font-semibold text-zinc-950">Contact</p>
          <div className="mt-3 space-y-2 text-sm text-zinc-600">
            <p>Email: sales@mirrorpro.example</p>
            <p>WhatsApp: +86 000 0000 0000</p>
            <p>MOQ, samples and custom packaging are available.</p>
          </div>
          <Link href="/contact" className="btn-base mt-5 bg-brand-600 text-white hover:bg-brand-700">
            Send Inquiry
          </Link>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500">
        Copyright 2026 MirrorPro Supply. Demo website for B2B inquiry workflow.
      </div>
    </footer>
  );
}
