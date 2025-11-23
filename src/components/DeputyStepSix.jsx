import React, { useRef, useState, useEffect, useMemo } from "react";
import ReactSignatureCanvas from "react-signature-canvas";
import DepFiveAgreementCheckboxes from "./DepFiveAgreementCheckboxes";

const DeputyStepSix = ({ formData, setFormData, userRole, stepProps, setHasDrawnSignature }) => {  
    const sigCanvas = useRef(null);
  
const firstName = formData.firstName || localStorage.getItem("userFirstName") || "";
const lastName = formData.lastName || localStorage.getItem("userLastName") || "";
const phone = formData.phone || localStorage.getItem("userPhone") || "";
const email = formData.email || localStorage.getItem("userEmail") || "";
  const [errors, setErrors] = useState({ sortCode: "", accountNumber: "" });
  const [isSignaturePresent, setIsSignaturePresent] = useState(false);

  const validateBankDetails = (field, value) => {
    let error = "";
    if (field === "sortCode") {
      if (!/^\d{6}$/.test(value)) error = "Sort code must be 6 digits";
    }
    if (field === "accountNumber") {
      if (!/^\d{8}$/.test(value)) error = "Account number must be 8 digits";
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      setFormData((prev) => ({
        ...prev,
        deputy_contract_signed: dataURL,
      }));
      setHasDrawnSignature(true); // ✅ use the prop here
    }
  };
  
  const clearSignature = () => {
    sigCanvas.current.clear();
    setFormData((prev) => ({
      ...prev,
      deputy_contract_signed: "",
    }));
    setHasDrawnSignature(false); // ✅ use the prop here
  };



  useEffect(() => {
    if (
      sigCanvas.current &&
      typeof sigCanvas.current.clear === "function" &&
      typeof sigCanvas.current.fromDataURL === "function" &&
      formData.deputy_contract_signed?.startsWith("data:image")
    ) {
      try {
        sigCanvas.current.clear(); // Clear first
        sigCanvas.current.fromDataURL(formData.deputy_contract_signed);
        console.log("✅ Loaded saved signature into SignatureCanvas");
      } catch (err) {
        console.error("❌ Failed to load saved signature:", err);
      }
    }
  }, [formData.deputy_contract_signed]);

  // ---- Contract Reference Builder ----
  // Use deputy doc id if present, else the logged-in user id.
  const deputyId =
    (formData && (formData._id || formData.id)) ||
    localStorage.getItem("userId") ||
    "";

  const computedReference = useMemo(() => {
    const yy = new Date().getFullYear().toString().slice(-2);
    const tail = deputyId ? deputyId.toString().slice(-6).toUpperCase() : "NOID";
    const lname = (lastName || "UNKNOWN").toUpperCase().replace(/\s+/g, "");
    return `TSC${yy}-${tail}-${lname}`;
  }, [deputyId, lastName]);

  // On first render (or when deputyId arrives), set formData.reference if empty
  useEffect(() => {
    if (!formData.reference && computedReference) {
      setFormData((prev) => ({ ...prev, reference: computedReference }));
    }
  }, [computedReference, formData.reference, setFormData]);

  const contractReference = formData.reference || computedReference;

  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Bank Details & Contract</h2>

      <div className="mb-4 flex gap-4">
        <div className="flex flex-col w-full">
          <label htmlFor="sortCode" className="mb-1 font-medium">Sort Code</label>
          <input
            id="sortCode"
            type="text"
            value={formData.bank_account?.sort_code || ""}
            onChange={(e) => {
              const value = e.target.value;
              validateBankDetails("sortCode", value);
              setFormData({ bank_account: { ...(formData.bank_account || {}), sort_code: value } });
            }}
            className="border rounded px-3 py-2 w-full"
          />
          {errors.sortCode && <p className="text-sm text-red-600 mt-1">{errors.sortCode}</p>}
        </div>
        <div className="flex flex-col w-full">
          <label htmlFor="accountNumber" className="mb-1 font-medium">Account Number</label>
          <input
            id="accountNumber"
            type="text"
            value={formData.bank_account?.account_number || ""}
            onChange={(e) => {
              const value = e.target.value;
              validateBankDetails("accountNumber", value);
              setFormData({ bank_account: { ...(formData.bank_account || {}), account_number: value } });
            }}
            className="border rounded px-3 py-2 w-full"
          />
          {errors.accountNumber && <p className="text-sm text-red-600 mt-1">{errors.accountNumber}</p>}
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex flex-col w-full">
          <label htmlFor="accountName" className="mb-1 font-medium">Account Name</label>
          <input
            id="accountName"
            type="text"
            value={formData.bank_account?.account_name || ""}
            onChange={(e) => setFormData({ bank_account: { ...(formData.bank_account || {}), account_name: e.target.value } })}
            className="border rounded px-3 py-1.5 w-full"
          />
        </div>
        <div className="flex flex-col w-full">
          <label htmlFor="accountType" className="mb-1 font-medium">Account Type</label>
          <select
            id="accountType"
            value={formData.bank_account?.account_type || ""}
            onChange={(e) => setFormData({ bank_account: { ...(formData.bank_account || {}), account_type: e.target.value } })}
            className="border rounded px-3 py-1.5 w-full"
          >
            <option value="">Select</option>
            <option value="Personal">Personal</option>
            <option value="Business">Business</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block font-semibold mb-2">Deputy Musician Contract</label>
        <div
  className="contract-text w-full border rounded px-3 py-2 bg-gray-100 text-s overflow-y-auto max-h-60 text-sm"
  dangerouslySetInnerHTML={{
    __html: formData.deputy_contract_text ||
            `<h2>Bamboo Music Management Booking Contract</h2>
<p>Issued by the ‘Agent’ (Bamboo Music Management, trading name The Supreme Collective) on behalf of the 'Artistic Supplier' ${formData.firstName || ''} ${formData.lastName || ''}.</p>
<p><strong>Contract Ref:</strong> ${contractReference}</p>
<p><strong>Date of Issue:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Artistic Supplier Contact Details</strong><br/>
Name: ${firstName} ${lastName}<br/>
Telephone: ${phone}<br/>
Address: ${formData.address?.line1 || ""}, ${formData.address?.town || ""}, ${formData.address?.county || ""}, ${formData.address?.postcode || ""}<br/>
Email: ${email}</p>
<p><strong>Agent Contact Details</strong><br/>
Company Name: Bamboo Music Management Ltd (trading as The Supreme Collective)<br/>
Contact Telephone: +44 07594 223200<br/>
Contact Address: Cramond, Reeves Lane, Roydon, CM19 5LE<br/>
Contact Email: hello@thesupremecollective.co.uk</p>
<p><strong>Artistic Supplier Details</strong></p>
<p>
  Role(s): ${
    [
      (formData.instrumentation || []).map(i => i.instrument).join(", "),
      formData.vocals?.type || ""
    ]
    .filter(Boolean) // Remove empty strings
    .join(", ") // Only joins if both are non-empty
  }
</p><p>Additional Skills: ${formData.other_skills?.join(", ")}</p>
<p>Able to Perform at: Weddings, Corporate Events, Private Parties, Festivals, Birthday Parties, Bar & Bat Mitzvahs, HM Forces Events, NYE Parties, Charity Events, Product Launches, Residencies, Award Ceremonies, and International Events. Note this list is not exhaustive but representative of the types of events expected to be covered.</p>
<p>UK Counties Covered: All England, Wales, and Scotland counties.</p>
<p>Minimum Expected Performance Length: 2x60 minutes or 3x40 minutes if only one vocalist in any given lineup or act. If a DJ, then expect a minimum of 3 hours performance.</p>
<p>Maximum Performance Length: 3x60 minutes or 5x40 minutes where there are two or more vocalists in any given lineup. If a DJ, maximum 4 hours of performance.</p>
<p>Note: both maximum and minimum performance times are unless otherwise agreed on a gig by gig basis.</p>
<p>Repertoire: Over 100 songs ‘ready to go’ at all times.</p>
<p>Performing: Accommodating Client song suggestions as set out in the Song Suggestions and/or Advanced DJ Requests section of the Event Sheet.</p>
<p>Standard Arrival Time: 5pm</p>
<p>Standard Finish Time: midnight</p>
<p>Standard Change Time: 15 minutes</p>
<p>Minimum Personal Performance Area Required: 1x1m for instruments with the exception of drums and DJs which require 2x2m.</p>
<h2>Able to Perform in the Following Lineups:</h2>
<ul style="list-style-type: disc; margin-left: 1.5rem;">
  <li>lead vocal &amp; guitar or keyboard</li>
  <li>lead vocal, guitar or keyboard, and bass</li>
  <li>lead vocal, guitar, keyboard, and bass</li>
  <li>lead vocal, guitar, keyboard, bass, and drums or percussion</li>
  <li>lead vocal, guitar, keyboard, bass, saxophone, and drums or percussion</li>
  <li>lead vocal, guitar or keyboard, bass, saxophone, and drums or percussion</li>
  <li>lead vocal, guitar, keyboard, bass, saxophone, trumpet, and drums or percussion</li>
  <li>lead vocal, guitar, keyboard, bass, saxophone, trumpet, trombone, and drums or percussion</li>
  <li>lead vocal x 2, guitar, bass, and drums or percussion</li>
  <li>lead vocal x 2, guitar, bass, keyboard, and drums or percussion</li>
  <li>lead vocal x 2, guitar, bass, saxophone, and drums or percussion</li>
  <li>lead vocal x 2, bass, keyboard, and drums or percussion</li>
  <li>lead vocal x 2, bass, keyboard, saxophone, and drums or percussion</li>
  <li>lead vocal, lead male vocal, guitar, bass, and drums or percussion</li>
  <li>lead vocal, lead male vocal, guitar, bass, keyboard, and drums or percussion</li>
  <li>lead vocal, lead male vocal, guitar, bass, saxophone, and drums or percussion</li>
  <li>lead vocal, lead male vocal, guitar, bass, saxophone, keyboard, and drums or percussion</li>
  <li>lead vocal, lead male vocal, guitar, bass, saxophone, trumpet, keyboard, and drums or percussion</li>
  <li>lead vocal, lead male vocal, guitar, bass, saxophone, trumpet, trombone, keyboard, and drums or percussion</li>
  <li>lead vocal x 3, guitar, bass, and drums or percussion</li>
  <li>lead vocal x 3, lead male vocal, guitar, bass, keyboard, and drums or percussion</li>
  <li>lead vocal x 3, lead male vocal, guitar, bass, saxophone, and drums or percussion</li>
  <li>lead vocal x 3, lead male vocal, guitar, bass, saxophone, keyboard, and drums or percussion</li>
  <li>lead vocal x 3, lead male vocal, guitar, bass, saxophone, trumpet, keyboard, and drums or percussion</li>
  <li>lead vocal x 3, lead male vocal, guitar, bass, saxophone, trumpet, trombone, keyboard, and drums or percussion</li>
  <li>DJ</li>
  <li>DJ Live with a mix of sax, bongos, guitar, and vocalists</li>
  </ul>
<p>
  These are the most common lineups listed above. If an opportunity arose to perform in a slightly different lineup,
  the Agent would ask the Artistic Supplier if they were able to perform under a different lineup before accepting
  the booking. If force majeure or another reason why a band member could not make the performance arose and the
  Agent was unable to replace said musician before the performance, the Artistic Supplier would still need to perform
  for their client as per the Event Sheet briefing and not be able to cancel the performance due to the lineup falling
  outside of what is outlined above.
</p>

<h2>Key Points</h2>
<ul>
  <li>This Contract is subject to <strong>Bamboo Music Management's Terms and Conditions</strong>.</li>
  <li>
    The Agent must supply the Artistic Supplier with an Event Sheet that the Artistic Supplier has access to at least
    four weeks prior to the event, or as soon as possible after booking is taken if the event is due to take place
    sooner than 4 weeks.
  </li>
  <li>
    The Artistic Supplier must follow the brief as laid out by the Client in the Event Sheet to enable a successful
    performance.
  </li>
  <li>Your phone number may be provided as an emergency contact number to the Client on the Event Sheet.</li>
  <li>
    Any changes to the booking discussed between the Client and the Artistic Supplier must be notified to the Agent.
  </li>
  <li>
    The Agent must communicate with the Client that the Artistic Supplier must be supplied with a reasonable free
    supply of soft drinks or water; a hot meal or hot buffet (for bookings when the Artistic Talent is on site for
    3 hours or more); free parking for their vehicle; a changing area; and a safe, level, dry, covered performance
    area, unless otherwise noted upon booking.
  </li>
  <li><strong>This contract should be signed and returned no later than 7 days from issue.</strong></li>
</ul>

<h2>Artistic Supplier Authorisation</h2>
<p>
  By signing below, you confirm that you are the authorised signatory for contract
  <strong>${
    formData.reference ||
    `20${200 + Number(formData._id?.slice(-3) || 0)} ${(lastName).toUpperCase()}`
  }</strong> (<strong>${firstName} ${lastName}</strong>, <strong>${new Date().toLocaleDateString()}</strong>) and agree
  to be bound by Bamboo Music Management’s Terms and Conditions of booking.
</p>
<p>
  Below we explain the contract between you, the ‘Artistic Supplier’, and your booker, the ‘Client’.
</p>

<p>
  If you do not understand any part of these Terms and Conditions, please check with Bamboo Music Management Ltd
  (trading as The Supreme Collective) or seek legal advice before agreeing to them.
</p>

<h2>Definition</h2>
<p>
  The following definitions refer to the 'Contract' with attached Terms and Conditions, to be taken as a whole.
</p>
<p>
  <strong>Bamboo Music Management</strong>, Company No. 09318270, is the <strong>'Agent’, 'We', 'Us'</strong>.
</p>

<p>
  <strong>The Deposit</strong> is the fee charged by the Agent for communicating with the Client and Artistic Supplier
  and organising and securing a Contract between the Client and the Artistic Supplier.
</p>

<p>
  The person who books an Artistic Supplier is a <strong>'Client'</strong>.
</p>

<p>
  An <strong>'Artistic Supplier'</strong> is the person, persons or business providing services to the Client,
  including but not limited to entertainment acts and artists, photographers, videographers, or any other event supplier.
</p>

<p>
  When a <strong>'Client'</strong> wants to book an <strong>'Artistic Supplier'</strong>, the <strong>'Agent'</strong>
  will issue the <strong>'Artistic Supplier'</strong> and the <strong>'Client'</strong> with a <strong>'Contract'</strong>.
  For the <strong>'Client'</strong>, this is a simple booking form with Terms and Conditions that outlines what the
  <strong>'Artistic Supplier'</strong> will provide and how much and when a client will pay for the services.
</p>

<p>
  For the <strong>'Artistic Supplier'</strong>, this Contract is in the form of a calendar invite that outlines what
  services they will supply, including terms and a link to the Event Sheet where the <strong>'Client'</strong> provides
  event details. Upon accepting this diary invite, the <strong>'Artistic Supplier'</strong> is bound to the contract terms.
</p>

<p>
  For the avoidance of doubt, any Contract and associated terms and conditions are agreed between the
  <strong>Artistic Supplier</strong> and the <strong>Client</strong>, and the <strong>Agent</strong> is not party to the
  Contract and shall not be held responsible for any breach however caused.
</p>

<p>
  Separately, the Agent will also outline its one-off <strong>Deposit</strong> to be paid to the Agent for organising and
  securing the Contract. For direct bookings, this is payable in full in advance. For third-party agent bookings,
  the Deposit is payable as part of the balance payment.
</p>

<p>
  By agreeing to a Contract, an <strong>'Artistic Supplier'</strong> agrees that the obligations of the Agent have been
  entirely fulfilled and the Agent has provided its agreed services.
</p>

<h2>Terms and Conditions of the Contract</h2>

<h3>1 | Booking</h3>
<ul>
  <li>
    <strong>1.1</strong> All bookings are confirmed immediately upon confirmation of availability whether this is done verbally, electronically, in writing, or over WhatsApp. All bookings are subject to the following non-negotiable Terms and Conditions. Lack of acceptance of the diary invite after confirming availability does not terminate or invalidate the agreement.
  </li>
  <li>
    <strong>1.2</strong> Diary invite contracts must be accepted within 5 working days.
  </li>
  <li>
    <strong>1.3</strong> If a Client or Artistic Supplier wishes to modify or change a Contract, they must inform the Agent. The Contract may be modified/changed upon agreement from both parties in advance of the event date. All changes must be notified to the Agent in writing who, if necessary, will re-issue the Contracts. The new Contract will void the previous one.
  </li>
  <li>
    <strong>1.4</strong> The agreed total Contract cost and Deposit owed may change with any alterations agreed by both the Client and Artistic Supplier.
  </li>
  <li>
    <strong>1.5</strong> The Agent will act as negotiator until the event date and Contract completion. The Agent will not be responsible for changes or amendments agreed independently between the Client and Artistic Supplier.
  </li>
</ul>

<h3>2 | Late/Failure to Accept a Contractual Diary Invite</h3>
<ul>
  <li>
    <strong>2.1</strong> If the contractual diary invite is not accepted within the 5 working days specified, it will be deemed to terminate the offer of work for the Artistic Supplier, unless otherwise agreed by the Agent in writing.
  </li>
</ul><h3>3 | Fees</h3>
<ul>
  <li>
    <strong>3.1</strong> Deposits paid by the Client to the Agent are non-refundable as the Agent has to incur significant
    costs and undertake significant work up front to find the right Artistic Supplier for the Client and to compile
    a tailored event sheet for the Client and Artistic Supplier to work from. In the unfortunate circumstance that
    an event has to be unavoidably cancelled or postponed due to Covid-19 or other matters outside your control,
    as outlined in Clause 16 below, the Agent will do all it can to help. The Agent will help the Client liaise with
    the Artistic Supplier to move a booking to an alternative date or, if the Artistic Supplier is not available,
    the Agent will do all they can to find an alternative Artistic Supplier for the Client and will move the Deposit
    to this new booking.
  </li>
  <li>
    <strong>3.2</strong> <strong>Fees Paid to the Supplier ('The Supplier Fees')</strong>: The Supplier Fees are composed
    of the base fee plus the travel component and are reconfirmed to the Artistic Supplier over WhatsApp upon
    booking enquiry and/or confirmation.
    <br /><br />
    <em>Payment of these fees is to be made via bank transfer (BACS) after a successful booking has been carried out.</em>
  </li>
  <li>
    <strong>3.3</strong> Payment of fees for the Artistic Supplier must be made to the Agent. The Agent will then transfer
    the fee directly to the Artistic Supplier on behalf of the Client upon successful completion of the booking.
  </li>
  <li>
    <strong>3.4</strong> If full payment of the Artistic Supplier Fees is not made to the Agent within 14 days of the due date,
    the debt can be passed to a Debt Recovery Firm by the Artistic Supplier, which can result in additional costs
    for the Client. The Agent is not responsible for the collection of the Balance payment due to the Artistic Supplier.
  </li>
</ul>

<h3>4 | Extra Fees</h3>
<ul>
  <li>
    <strong>4.1</strong> Extra fees are payable when the Client books additional services from the Artistic Supplier.
  </li>
</ul>

<h3>4 | Promotional Footage and Promotional Audio Recordings of the Artistic Supplier</h3>
<ul>
  <li>
    <strong>4.1</strong> All performances, contributions, and the products of all services given and to be given by the Artistic Supplier
    — whether photographed, filmed, and/or recorded by the Agent or shared with the Agent — are the property of
    The Supreme Collective for the duration of the time that the Artistic Supplier is open to accepting bookings
    through The Supreme Collective, up until 18 months after written confirmation is received that the Artistic Supplier
    wishes to terminate their contract.
  </li>
  <li>
    <strong>4.2</strong> In addition, the Artistic Supplier hereby grants to The Supreme Collective and all of its successors,
    assigns, licensees and designees the right to use and authorise others to use their name and likeness, and
    biographical information about the Artistic Supplier, in connection with the Contributions and in connection
    with any project, program or event with which any of the Contributions are used, for the aforementioned period.
  </li>
</ul>
<h3>5 | Cancellation</h3>
<ul>
  <li>
    <strong>5.1</strong> Termination of booking Contracts is not permitted by the Artistic Supplier unless both the Client
    and all Artistic Suppliers involved in the booking mutually agree in writing to cancel the contract.
    Written evidence will be required by the Agent from both the Client and the Artistic Supplier.
  </li>
  <li>
    <strong>5.2</strong> Any Contract cancellation by either party does not affect the Deposit, which is non-refundable.
  </li>
</ul>

<h3>6 | Client Cancellation</h3>
<ul>
  <li>
    <strong>6.1</strong> If the Client terminates the contract for any reason, the following cancellation fees will apply:
  </li>
</ul>

<h4>6.1.1 | The Supreme Collective cancellation fee breakdown:</h4>
<table class="table-auto border-collapse border border-gray-400 my-4">
  <thead>
    <tr>
      <th class="border border-gray-400 px-4 py-2 text-left">Cancellation Timescale</th>
      <th class="border border-gray-400 px-4 py-2 text-left">Cancellation Fee</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-gray-400 px-4 py-2">More than 365 days before event</td>
      <td class="border border-gray-400 px-4 py-2">No Supplier Fee</td>
    </tr>
    <tr>
      <td class="border border-gray-400 px-4 py-2">More than 180 days before event</td>
      <td class="border border-gray-400 px-4 py-2">25% of Full Supplier Fee</td>
    </tr>
    <tr>
      <td class="border border-gray-400 px-4 py-2">Less than 48 hours after confirmation,<br/>8 or more days before the event</td>
      <td class="border border-gray-400 px-4 py-2">No Supplier Fee</td>
    </tr>
    <tr>
      <td class="border border-gray-400 px-4 py-2">More than 90 days before event</td>
      <td class="border border-gray-400 px-4 py-2">40% of Full Supplier Fee</td>
    </tr>
    <tr>
      <td class="border border-gray-400 px-4 py-2">More than 30 days before event</td>
      <td class="border border-gray-400 px-4 py-2">80% of Full Supplier Fee</td>
    </tr>
    <tr>
      <td class="border border-gray-400 px-4 py-2">30 days or less before event</td>
      <td class="border border-gray-400 px-4 py-2">Full Supplier Fee</td>
    </tr>
  </tbody>
</table>

<ul>
  <li>
    <strong>6.2</strong> The Supreme Collective reserves the right to update these cancellation fees as necessary (e.g. if
    agencies update their policies). If a cancellation happens before this contract is updated, and the new policy
    predates the cancellation but postdates the contract, the new agency policy shall supersede the table above.
  </li>
  <li>
    <strong>6.3</strong> If The Supreme Collective finds the Artistic Supplier alternative work for the cancellation date,
    then the initial cancellation fee is waived.
  </li>
</ul>

<h3>7 | Artistic Supplier Cancellation</h3>
<ul>
  <li>
    <strong>7.1</strong> The Artistic Supplier is not permitted to cancel the booking without Agent or Client approval.
  </li>
  <li>
    <strong>7.2</strong> If the Artistic Supplier must cancel, they must supply a deputy of equal standard, stylistic
    similarity, and calibre, able to perform all songs expected. The Agent will also attempt to find a replacement.
    If successful and agreed by the Client, the deputy fulfils the Supplier’s role. If no replacement is found,
    the Artistic Supplier will pay the Agent a Penalty Fee of £125 (to be refunded to the Client minus a £25 admin fee).
  </li>
  <li>
    <strong>7.3</strong> If Cancellation and Penalty Fees are not paid within 14 days of cancellation, the debt may be
    passed to a Debt Recovery Firm, potentially incurring additional costs for the Artistic Supplier.
  </li>
</ul>
<h3>8 | Complaints</h3>
<ul>
  <li>
    <strong>8.1</strong> In the circumstance of either party wishing to make a complaint, it should be made in writing,
    via the Agent, within 7 days. The Agent will liaise with both parties with the intention of reaching a resolution.
    Should this be unsuccessful or the matter cannot be resolved, both parties should each seek their own legal advice.
  </li>
  <li>
    <strong>8.2</strong> Full payment must still be made to the Artistic Supplier even where a complaint has been made.
    Failure to do so will incur the charges outlined above in this Contract.
  </li>
  <li>
    <strong>8.3</strong> Any dispute made regarding a change to the contract or performance that were agreed by both
    the Client and Artistic Supplier should be dealt with directly between the Client and Artistic Supplier.
  </li>
  <li>
    <strong>8.4</strong> The Agent is not responsible for any failure of the Client or the Artistic Supplier.
  </li>
</ul>

<h3>9 | Responsibilities of the Client</h3>
<ul>
  <li>
    <strong>9.1</strong> The Venue can and will supply a safe power supply.
  </li>
  <li>
    <strong>9.2</strong> The Venue can and will provide a safe, dry and level performance area for Artistic Suppliers
    who are performing.
  </li>
  <li>
    <strong>9.3</strong> The Venue holds any relevant licences required for the Artistic Supplier to provide their services.
  </li>
  <li>
    <strong>9.4</strong> The Venue complies with all relevant Health and Safety guidance and legislation and does not
    put the Artistic Supplier, their set or equipment at any risk of harm.
  </li>
  <li>
    <strong>9.5</strong> The Venue does not have any inhibiting noise limiters. If the venue has a limiter, the decibel
    (dB) level should be communicated to the Agent and the Artistic Supplier. The Artistic Supplier cannot guarantee
    the quality of its performance if the sound level is quieter than an un-amplified drum kit. The Artistic Supplier
    is not to be held responsible for non-performance where the sound limiter is set too low for live performance of their act.
  </li>
  <li>
    <strong>9.6</strong> Free parking should be available to the Artistic Supplier and all vehicles associated with
    the Artistic Supplier. If no free parking is generally available, the Client is liable for the costs of parking
    to be paid to the Agent in advance of the performance. Artistic Suppliers must retain receipts and invoice for this additional expense.
  </li>
  <li>
    <strong>9.7</strong> The Artistic Supplier must be provided with a free, reasonable supply of water and/or soft
    drinks for the duration of their time at the venue.
  </li>
  <li>
    <strong>9.8</strong> The Artistic Supplier must also be provided with a hot meal or hot buffet. This is negotiable
    when the Artistic Supplier is on site for less than 3 hours. If the Artistic Supplier is on site over lunch time,
    the Agent will request that the Client provides a lunch for the Artistic Supplier.
  </li>
  <li>
    <strong>9.9</strong> The Artistic Supplier requires an adequate and secure area to change in if required.
    This space should be secure, contain the correct number of chairs and a safe source of power. This clause is negotiable,
    but the Agent and Artistic Supplier must be notified by way of Event Sheet prior to confirming.
  </li>
  <li>
    <strong>9.10</strong> The Client must negotiate any further bookings of the Artistic Supplier with the Agent,
    for a period of 18 months after the Event Date. They are precluded from booking directly with the Artistic Supplier in that period.
  </li>
  <li>
    <strong>9.11</strong> The Client must ensure all government guidelines are followed and adhered to for the Artistic
    Supplier to lawfully provide its services. The Artistic Supplier accepts no liability for any failure to adhere to such guidelines.
  </li>
  <li>
    <strong>9.12</strong> The Client must let the Agent and Artistic Supplier know in advance of the performance,
    or as soon as practicable, should they, or anyone in their party, not wish for any photographs or video clips of the
    event to be used in future promotional material for the Artistic Supplier and/or the Agent.
  </li>
</ul>
<h3>10 | Responsibilities of the Artistic Supplier</h3>

<p><strong>The Artistic Supplier is fully responsible for all Clause 10 matters.</strong></p>

<ul>
  <li>
    <strong>10.1</strong> The Artistic Supplier must ensure that they are under no obligation to another contract that may
    hinder or interfere with this contract’s bookings prior to signing the Contract, nor take on any such contract
    which may interfere with this contract subsequent to signing this Contract.
  </li>
  <li>
    <strong>10.2</strong> The Artistic Supplier will endeavour to perform to their highest quality and best ability, in the
    same manner as is represented by the Agent in the Artistic Supplier's promotional material.
  </li>
  <li>
    <strong>10.3</strong> The Artistic Supplier must provide all relevant equipment required to perform their act to the
    highest standard. This equipment must be annually PAT tested, with Certificates available for inspection upon every booking.
  </li>
  <li>
    <strong>10.4</strong> The Artistic Supplier must hold Public Liability Insurance of minimum £1,000,000 cover, with
    Certificates available for inspection upon every booking.
  </li>
  <li>
    <strong>10.5</strong> The Artistic Supplier shall not drink alcohol excessively (prior, during or post performance).
    Please note, some agencies disallow any alcohol to be consumed during performances, and if this criteria is
    mentioned in the Contractual Diary Invite terms and conditions, then that will supersede this item.
  </li>
  <li>
    <strong>10.6</strong> The Artistic Supplier shall not use illegal drugs at the event venue, or at all on the day of the event.
  </li>
  <li>
    <strong>10.7</strong> The Artistic Supplier shall dress suitably for the occasion, in agreement with the Client's requests.
  </li>
  <li>
    <strong>10.8</strong> The Artistic Supplier will always remain courteous and polite to the Client, the Venue and the Agent
    throughout the entire booking process, not harming or damaging any reputation between the parties.
  </li>
  <li>
    <strong>10.9</strong> The fully-inclusive fee agreed by the Artistic Supplier, that is specified in this Contract, for the
    performance, is not subject to change.
  </li>
  <li>
    <strong>10.10</strong> The Artistic Supplier is not employed by the Agent and is therefore fully responsible for their
    own accounting and legal contributions.
  </li>
  <li>
    <strong>10.11</strong> The Artistic Supplier must familiarise themselves with the Client’s event sheet at least 1 week in
    advance of the event, unless the booking is made with less than 1 week before the date of the performance — in which
    case the Artistic Supplier must familiarise themselves with the Event Sheet as soon as the Client is able to complete
    the event sheet. This will be to ensure all contracted details are correct and to finalise finer details, such as
    dress code, special directions, sound limitations, refreshments and food, parking, and performance requests.
  </li>
  <li>
    <strong>10.12</strong> The Artistic Supplier must only display or hand out the Agent's promotional material at the
    contracted event, also referring all future bookings, enquiries or clients to the Agent. If the Artistic Supplier
    fails to comply with this clause, they will be removed from the Agency and will be liable to pay all cancellation
    fees as stated above for future confirmed bookings.
  </li>
  <li>
    <strong>10.13</strong> The Client reserves the right to cancel the Artistic Supplier’s booking at any time if the
    Artistic Supplier breaches any terms of this Contract. The Agent will use best endeavours to arrange for an
    alternative Artistic Supplier for the booking in such circumstances.
  </li>
  <li>
    <strong>10.14</strong> If the Artistic Supplier is a vocalist, they must liaise with any other vocalists in their
    lineup to finalise the band’s setlist at least 2 weeks prior to the performance date, including any key changes,
    and provide this to the band members.
  </li>
  <li>
    <strong>10.15</strong> The Artistic Supplier must provide a link to their up-to-date e-calendar to enable the Agent
    to quote on their behalf efficiently.
  </li>
</ul>
<h3>11 | Expenses</h3>
<ul>
  <li>
    <strong>11.1</strong> The Client is not responsible for any other Artistic Supplier expenses (including but not limited
    to accommodation, travel, rehearsal time, and song downloads) unless otherwise discussed and stated in the
    <em>'Additional Contract Notes'</em> section of the booking Contract with the Client. If any expenses are agreed,
    the Artistic Supplier must supply the Agent with an invoice within 7 days of the event, with payment due
    7 days after that. Please note The Supreme Collective reserves the right to change payment timescales;
    however, notice will be given before any changes are made.
  </li>
</ul>

<h3>12 | Supplier Equipment</h3>
<ul>
  <li>
    <strong>12.1</strong> Unless given written permission, the equipment supplied by the Artistic Supplier is not
    available for use by any other person, guest, or performer under any circumstance.
  </li>
  <li>
    <strong>12.2</strong> The Client must respect that the equipment supplied by the Artistic Supplier is expensive,
    fragile, and necessary for their livelihood. The Client is responsible for any damage to the equipment
    caused by any member of their party and is liable in such cases for the full cost of repair or an equivalent
    replacement if repair is not possible or more expensive than replacement.
  </li>
</ul>

<h3>13 | Changes to the Agreed Performance Schedule for Artistic Suppliers</h3>
<ul>
  <li>
    <strong>13.1</strong> When possible, any changes to the performance schedule should be discussed with the Agent and
    agreed upon between the Client and Artistic Supplier prior to the performance.
  </li>
  <li>
    <strong>13.2</strong> If the event schedule overruns due to no fault of the Artistic Supplier, the Artistic Supplier
    retains the right to finish at the agreed finishing time and will still be due the full payment.
  </li>
  <li>
    <strong>13.3</strong> If the Client makes a request for the Artistic Supplier to perform longer than specified in the
    performance schedule, on the event date, the Artistic Supplier has the right to:
    <ul class="ml-6 list-disc">
      <li>Agree to a further fee to do so, payable on the day of the event before the extended performance,</li>
      <li>Or refuse the request without penalty.</li>
    </ul>
  </li>
</ul>

<h3>14 | The Use of Dep, Deputy or Alternative Performers for Entertainment Suppliers</h3>
<ul>
  <li>
    <strong>14.1</strong> The Artistic Supplier is not allowed to use a Dep, Deputy or Alternative Performer without
    consent from the Agent and/or the Client.
  </li>
  <li>
    <strong>14.2</strong> If Force Majeure occurs, the Artistic Supplier must provide a suitable Dep, Deputy or
    Alternative Performer to cover them. These performers should have equal ability and competence and represent
    the Artistic Supplier in the same style as displayed in the promotional material.
    The Agent holds the right to use an Alternative Performer without notifying the Client.
  </li>
  <li>
    <strong>14.3</strong> The Agent and Artistic Supplier must present an Alternative Performer to the Client rather
    than cancelling a booking. In this case, a reduction in fee is not applicable — unless the Artistic Supplier
    being replaced is a Celebrity figure.
  </li>
  <li>
    <strong>14.4</strong> The Agent reserves the right to change the Artistic Supplier without prior notice.
  </li>
</ul>
<h3>15 | Force Majeure</h3>
<ul>
  <li>
    <strong>15.1</strong> Force Majeure occurs where either party is unable to comply with the contractual obligations
    set out in these Terms and Conditions due to a reason out of their control. This could include:
    <em>act of nature (earthquake, fire, flood, hurricane, storm or any other natural disaster), accident, war,
    terrorism, epidemic, national calamity, civil commotion, closure of borders, order of Government or Local Authority
    having jurisdiction in the matter, or changes in law or government policy.</em>
  </li>
  <li>
    <strong>15.2</strong> In the event of Force Majeure, the affected party shall have to prove it by providing evidence
    that they took all possible action to prevent the circumstance from happening, if such action was possible.
  </li>
  <li>
    <strong>15.3</strong> In a proven case of Force Majeure occurring for a specified period, the Artistic Supplier and
    Client will endeavour to reschedule where possible. The Contract may be transferred to the new scheduled date.
    If the Artistic Supplier cannot reschedule, the Agent will use its best efforts to find a new Artistic Supplier
    for the Client. If, in these circumstances, a new Artistic Supplier is found for the same or lower Supplier Fee,
    then no additional Deposit will be payable and the Deposit will be transferred to the new booking.
    If the new Supplier Fee is higher than the original Contract, any additional Deposit required will be outlined
    to the Client and mutually agreed upon.
  </li>
  <li>
    <strong>15.4</strong> In any event of Force Majeure, the Agent will not be liable for any losses incurred by the Client,
    the Artistic Supplier, or any associated third parties.
  </li>
</ul>

<h3>16 | Breach of Contract</h3>
<ul>
  <li>
    <strong>16.1</strong> The Agent reserves the right to void any Contract between an Artistic Supplier and Client
    if it discovers either party has breached any of these Terms and Conditions.
  </li>
</ul>

<h3>17 | Jurisdiction</h3>
<ul>
  <li>
    <strong>17.1</strong> The parties irrevocably agree that the courts of England and Wales shall have exclusive
    jurisdiction to settle any dispute or claim arising out of this Contract.
  </li>
</ul>

<h3>18 | Terms and Conditions</h3>
<ul>
  <li>
    <strong>18.1</strong> If you do not understand any part of these Terms and Conditions, please consult the Agent,
    or seek legal advice. Once signed or agreed, you are bound to all conditions.
  </li>
</ul>
`
          }}
          
        />
      
      </div>
      <div className="mb-6">
                <label className="block mb-2 font-semibold">Signature</label>
                <div className="mb-4 flex items-center gap-4">
                  <div className="border rounded w-96 h-40">
                    <ReactSignatureCanvas
                      ref={sigCanvas}
                      penColor="black"
                      canvasProps={{
                        width: 384,
                        height: 160,
                        className: "signature-canvas",
                      }}
                      onEnd={handleEnd}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Clear
                  </button>
                </div>
               <DepFiveAgreementCheckboxes formData={formData} setFormData={setFormData} userRole={userRole} {...stepProps} />
              </div>
     
    </div>
  );
};

export default DeputyStepSix;
