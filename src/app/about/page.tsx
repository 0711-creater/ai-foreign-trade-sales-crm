import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "About MirrorPro Supply | B2B Mirror Manufacturer",
  description:
    "Learn about MirrorPro Supply, a B2B mirror manufacturer demo focused on OEM/ODM mirror sourcing, private label packaging and export-ready production workflows."
};

const trustPoints = [
  "Focused on mirror product development and export support",
  "Supports OEM / ODM projects for brands and wholesalers",
  "Provides sample confirmation before mass production",
  "Handles product packing, carton labels and basic inspection workflow"
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-white py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionTitle
            eyebrow="About Us"
            title="A practical mirror supplier profile for B2B buyers"
            description="MirrorPro Supply is a demo manufacturer profile built for overseas buyers who need LED makeup mirrors, compact mirrors, wall mirrors and custom promotional mirror programs."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Product Focus", "Mirror categories for beauty, gift and home channels"],
              ["Buyer Types", "Importers, wholesalers, brands and Amazon sellers"],
              ["Order Model", "Sample approval, bulk production and export packing"],
              ["Customization", "Logo, color, size, packaging and carton label support"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold text-brand-700">{label}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-bold text-zinc-950">Why buyers can trust this supplier</h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              B2B buyers usually care about stable communication, clear specifications, sample confirmation,
              packaging support and inspection before shipment.
            </p>
          </div>
          <div className="grid gap-4">
            {trustPoints.map((point) => (
              <div key={point} className="flex gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
                  OK
                </span>
                <p className="text-sm font-medium leading-6 text-zinc-700">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Quality Control"
            title="Basic inspection points before shipment"
            description="For an MVP website, this section helps create supplier credibility. Real projects can later add certificates, factory photos and inspection reports."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {["Appearance check", "Lighting function test", "Packaging drop check", "Carton mark review"].map(
              (item) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                  <p className="font-semibold text-zinc-950">{item}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </>
  );
}
