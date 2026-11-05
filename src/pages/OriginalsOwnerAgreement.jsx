import Title from '../components/Title';
import OriginalsAgreementText from '../components/OriginalsAgreementText';
import useOriginalsOwnerAgreement from '../hooks/useOriginalsOwnerAgreement';

export default function OriginalsOwnerAgreement({ token }) {
  const { agreement, error, reload } = useOriginalsOwnerAgreement(token);
  return <main className="mx-auto max-w-3xl px-4 py-8 text-slate-700">
    <Title text1="ORIGINALS OWNER" text2="AGREEMENT" />
    <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900">Originals project owner agreement</h2>
      <p className="mt-2 mb-6 text-sm">These are the same terms shown when you create a project. Acceptance is completed on the project form with your full name and confirmation.</p>
      {agreement && <><OriginalsAgreementText agreement={agreement} /><p className="mt-6 border-t pt-4 text-sm">{agreement.acknowledgement}</p></>}
      {!agreement && !error && <p role="status">Loading agreement…</p>}
      {error && <div className="space-y-3"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" onClick={reload} className="rounded border px-4 py-2 text-sm">Reload agreement</button></div>}
      <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-5 print:hidden">
        <button type="button" disabled={!agreement} onClick={() => window.print()} className="rounded border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40">Print or save as PDF</button>
        <button type="button" onClick={() => window.close()} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white">Close this tab</button>
      </div>
    </div>
  </main>;
}
