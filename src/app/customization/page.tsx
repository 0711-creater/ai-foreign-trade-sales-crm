import InquiryForm from "@/components/InquiryForm";
import ProcessSteps from "@/components/ProcessSteps";
import SectionTitle from "@/components/SectionTitle";

export const metadata = {
  title: "OEM / ODM Mirror Customization | MirrorPro Supply",
  description:
    "OEM and ODM mirror customization for B2B buyers, including logo printing, color customization, private label packaging and custom mirror sizes."
};

const customizationOptions = [
  "Logo printing or logo plate",
  "Pantone color matching",
  "Private label packaging",
  "Mirror size and shape adjustment",
  "LED lighting and plug options",
  "Barcode, carton mark and insert card"
];

export default function CustomizationPage() {
  return (
    <>
      <section className="bg-white py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Customization"
            title="OEM / ODM mirror customization for brand and wholesale orders"
            description="Send a product brief or reference sample. We help confirm materials, structure, logo method, packaging and production plan."
          />
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-bold text-zinc-950">What can be customized?</h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              These options cover the most common B2B requirements for importers, gift companies,
              beauty brands and Amazon sellers.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {customizationOptions.map((option) => (
              <div key={option} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
                <span className="text-sm font-bold text-brand-700">Custom Option</span>
                <p className="mt-2 font-semibold text-zinc-950">{option}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Process"
            title="Clear custom order workflow"
            description="A simple five-step process reduces communication cost and helps buyers understand production timing."
          />
          <div className="mt-10">
            <ProcessSteps />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionTitle
            eyebrow="Start a Project"
            title="Request a custom mirror quote"
            description="Include target quantity, product reference, logo file, packaging idea and destination market."
          />
          <InquiryForm defaultProductName="Custom mirror project" />
        </div>
      </section>
    </>
  );
}
