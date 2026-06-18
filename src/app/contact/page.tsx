import InquiryForm from "@/components/InquiryForm";
import SectionTitle from "@/components/SectionTitle";

export const metadata = {
  title: "Contact Us for Mirror Wholesale Quotes | MirrorPro Supply",
  description:
    "Send an inquiry for LED makeup mirrors, compact mirrors, wall mirrors and custom promotional mirrors. Share quantity, logo, packaging and delivery requirements."
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-white py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Contact"
            title="Contact Us for mirror sourcing"
            description="Submit your sourcing inquiry. The system will analyze the inquiry with AI, save it to CRM, and notify the sales team."
          />
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            {[
              ["Email", "sales@mirrorpro.example"],
              ["WhatsApp", "+86 000 0000 0000"],
              ["Sample Lead Time", "7-15 days depending on customization"],
              ["Bulk Lead Time", "20-45 days depending on product and quantity"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{label}</p>
                <p className="mt-2 text-base font-semibold text-zinc-950">{value}</p>
              </div>
            ))}
          </div>

          <InquiryForm />
        </div>
      </section>
    </>
  );
}
