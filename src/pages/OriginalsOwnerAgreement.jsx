import React from "react";
import Title from "../components/Title";

const Section = ({ title, children }) => (
  <section className="space-y-2 border-t border-slate-200 pt-5">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {children}
  </section>
);

const OriginalsOwnerAgreement = () => (
  <main className="mx-auto max-w-3xl px-4 py-8 text-slate-700">
    <Title text1="ORIGINALS OWNER" text2="AGREEMENT" />

    <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm sm:p-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Provisional pilot agreement · version originals-owner-v0.1-legal-review</p>
        <p className="mt-1">
          This agreement is being used for the private pilot and still requires specialist UK music-law review before public launch.
        </p>
      </div>

      <div className="mt-6 space-y-5 text-sm leading-6">
        <p>
          By submitting an Originals project, you confirm that you have read and accept the terms below. Your acceptance is recorded against your identity, project, agreement version and submission time.
        </p>

        <Section title="1. Original material and authority">
          <p>You confirm that the project and any material you upload are original or otherwise controlled by you, are not a cover, and can lawfully be used for this collaboration.</p>
          <p>You must not upload material that infringes another person’s copyright, performer rights, privacy or other rights.</p>
        </Section>

        <Section title="2. Master income framework">
          <p>After any contractually permitted direct costs, master income is allocated as follows:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>TSC: 20%</li>
            <li>Project owner: 20%</li>
            <li>Accepted contributor-role/stem pool: 40%, divided equally for each accepted role or stem</li>
            <li>Selected mix producer: 10%</li>
            <li>Selected mastering engineer: 10%</li>
          </ul>
          <p>One person may earn more than one share by making accepted contributions in more than one role. Multiple selected takes or ranges from the same person within one role count as one role share.</p>
        </Section>

        <Section title="3. Songwriting framework">
          <p>Songwriting royalties are separate from master income and are confirmed from accepted creative contributions and recorded songwriting claims.</p>
          <p>Where the owner supplies source material, that source forms the initial writing unit. Each accepted creative role adds a potential equal unit; claimed units go to the relevant contributor and unclaimed contributor units accrue to the original owner/songwriter.</p>
          <p>Where there is no owner source material, songwriting is divided equally between accepted roles that claim songwriting. If nobody claims, it is divided equally between the accepted foundation roles. Listing the project alone does not create an automatic writing share.</p>
          <p>Final master and composition splits are versioned and must be confirmed by the affected parties before the master progresses beyond the pilot workflow.</p>
        </Section>

        <Section title="4. Reviews, deadlines and intervention">
          <p>You have seven days to complete each required review or approval after you are notified. TSC will record and send reminders before intervention.</p>
          <p>If a response is overdue, the project may enter admin intervention. TSC may then select stems, reopen rounds, appoint producers and progress the track to an approved master. TSC must record a reason, and royalty allocations already earned by contributors remain intact.</p>
        </Section>

        <Section title="5. Contributor material and protections">
          <p>You may use contributed material only within this controlled project workflow and only in accordance with the recorded selection and credit decisions.</p>
          <p>Rejected material remains the contributor’s property and must not be reused, released or distributed. If rejected material is later reconsidered, it must be formally reinstated so that the contributor’s rights and royalty position can be reviewed and restored.</p>
          <p>Original files and decision records may be retained by TSC for audit and dispute purposes, including while material is hidden from ordinary participants.</p>
        </Section>

        <Section title="6. Confidentiality and access">
          <p>Unreleased music, private messages, reference files and participant information must be kept confidential. You must not redistribute project material or use it outside this collaboration without the relevant written permission.</p>
          <p>Reference and production files are provided through controlled access. Anonymous participants’ legal identities remain private to TSC unless disclosure is required for a dispute, legal obligation or a separately agreed next phase.</p>
        </Section>

        <Section title="7. Credits, anonymity and later phases">
          <p>Credits use each participant’s public profile name or chosen artistic/credit name. Choosing anonymity does not remove TSC’s private identity and audit records.</p>
          <p>Distribution, collection-society registration, sync, promotion, live introductions and other release activity are outside this Phase 1 pilot and require separate arrangements.</p>
        </Section>

        <Section title="8. Changes and evidence">
          <p>The version shown above is the version you accept. If these terms change, a new version must be presented for acceptance; earlier acceptance records remain retained with their original version and timestamp.</p>
        </Section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-5 print:hidden">
        <button type="button" onClick={() => window.print()} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Print or save as PDF
        </button>
        <button type="button" onClick={() => window.close()} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff6667]">
          Close this tab
        </button>
      </div>
    </div>
  </main>
);

export default OriginalsOwnerAgreement;
