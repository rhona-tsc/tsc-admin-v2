export default function OriginalsAgreementText({ agreement }) {
  return <div className="space-y-5 text-sm leading-6" aria-label="Full agreement terms">
    {agreement.sections.map(section => <section key={section.title} className="border-t border-slate-200 pt-4 first:border-0 first:pt-0">
      <h3 className="font-semibold">{section.title}</h3><p className="mt-1 text-slate-700">{section.text}</p>
    </section>)}
  </div>;
}
