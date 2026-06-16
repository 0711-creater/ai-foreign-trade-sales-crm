type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export default function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-zinc-600">{description}</p> : null}
    </div>
  );
}
