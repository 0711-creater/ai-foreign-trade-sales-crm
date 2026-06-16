const steps = ["Send Requirements", "Confirm Design", "Sample Approval", "Mass Production", "Delivery"];

export default function ProcessSteps() {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {steps.map((step, index) => (
        <div key={step} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 font-bold text-white">
            {index + 1}
          </span>
          <h3 className="mt-4 text-base font-bold text-zinc-950">{step}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {index === 0 && "Share product idea, quantity, logo, packaging and target market."}
            {index === 1 && "Confirm size, material, color, artwork and commercial terms."}
            {index === 2 && "Produce samples for buyer review before bulk production."}
            {index === 3 && "Arrange production, inline inspection and final quality check."}
            {index === 4 && "Prepare export packing and support shipment coordination."}
          </p>
        </div>
      ))}
    </div>
  );
}
