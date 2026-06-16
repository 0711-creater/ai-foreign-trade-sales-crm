import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/customization", label: "Customization" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="container-page flex min-h-16 flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-base font-bold text-white">
            MP
          </span>
          <span>
            <span className="block text-base font-bold text-zinc-950">MirrorPro Supply</span>
            <span className="block text-xs text-zinc-500">OEM / ODM Mirror Manufacturer</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className="btn-base bg-brand-600 py-2 text-white hover:bg-brand-700">
            Request a Quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
