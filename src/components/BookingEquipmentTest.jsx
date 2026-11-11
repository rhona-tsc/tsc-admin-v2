import React, { useEffect, useState } from 'react';

export default function BookingEquipmentTest({ apiBase, buildHeaders }) {
  const [open,setOpen]=useState(()=>new URLSearchParams(window.location.search).has('equipmentConnection'));
  const [connection,setConnection]=useState(null);
  const [criteria,setCriteria]=useState({bookingReference:'',eventDateISO:'',actName:''});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [result,setResult]=useState(null);
  const call=async(path,body)=>{
    const response=await fetch(`${apiBase}/board/enquiries/equipment-test/${path}`,{method:body?'POST':'GET',headers:buildHeaders(),...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json();
    if(!response.ok||data.success!==true)throw new Error(data.message||'The equipment test could not complete.');
    return data;
  };
  useEffect(()=>{if(open)call('status').then(setConnection).catch(e=>setError(e.message));},[open]);
  const check=async(event)=>{event.preventDefault();setBusy(true);setError('');setResult(null);try{setResult((await call('lookup',criteria)).result);}catch(e){setError(e.message);}finally{setBusy(false);}};
  const connect=async()=>{setBusy(true);setError('');try{const data=await call('connect',{});const url=new URL(data.url);if(url.origin!=='https://accounts.google.com')throw new Error('Unexpected Google connection destination.');window.location.assign(url.href);}catch(e){setError(e.message);setBusy(false);}};
  const verify=async()=>{setBusy(true);setError('');try{setConnection(await call('verify',{}));setResult(null);}catch(e){setError(e.message);try{setConnection(await call('status'));}catch{}}finally{setBusy(false);}};
  const disconnect=async()=>{setBusy(true);setError('');try{setConnection(await call('disconnect',{}));setResult(null);}catch(e){setError(e.message);}finally{setBusy(false);}};
  const outcome=new URLSearchParams(window.location.search).get('equipmentConnection');
  return <>
    <button type="button" className="rounded border border-teal-700 px-3 py-2 text-sm text-teal-800" onClick={()=>setOpen(true)}>Booking equipment test</button>
    {open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="booking-equipment-title" className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4"><div><h2 id="booking-equipment-title" className="text-xl font-semibold">Booking equipment test</h2><p className="mt-1 text-sm text-gray-500">Check who has accepted PA and lighting duties for a booking.</p></div><button type="button" className="text-sm underline" onClick={()=>setOpen(false)}>Close</button></div>
        <div className="my-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900"><strong>Test mode · read only · no messages sent</strong><p className="mt-1">This checks the roster and supplier reference. It does not change the booking or confirm a final equipment list or power requirement.</p></div>
        {outcome&&outcome!=='connected'&&!connection?.connected&&<p className="mb-3 text-sm text-amber-800">{outcome==='cancelled'?'Google permission was not completed. You can start again below.':'The equipment read could not complete. Check the connection status below.'}</p>}
        <div className="mb-5 rounded-lg border p-3 text-sm"><p className="font-medium">Equipment sheet: {connection?.connected?'Connected for read-only access':connection?.authorised?'Permission approved · access needs checking':connection?'Not connected':'Checking…'}</p><p className="mt-1 text-gray-600">James Gordon, Ewan and Michael reference tabs only. Inventory is a reference until the supplier confirms the kit for this event.</p>
          {connection?.connected&&connection.canConnect&&<button type="button" disabled={busy} className="mt-2 text-xs underline" onClick={disconnect}>Disconnect equipment sheet</button>}
          {connection&&!connection.connected&&connection.authorised&&connection.canConnect&&<><p className="mt-2 text-sm text-amber-800">{connection.configurationIssue==='SERVICE_DISABLED'?'Google Sheets API needs enabling in the website’s Google project.':'Google permission is saved. The reference read still needs checking.'}</p><button type="button" disabled={busy} className="mt-3 rounded bg-teal-800 px-3 py-2 text-white disabled:opacity-50" onClick={verify}>Retry equipment access</button></>}
          {connection&&!connection.connected&&!connection.authorised&&connection.canConnect&&<><p className="mt-2 text-xs text-gray-500">Google requires an additional read-only Sheets permission. The app reads only the three equipment ranges; its existing Calendar connection stays separate.</p><button type="button" disabled={busy} className="mt-3 rounded bg-teal-800 px-3 py-2 text-white disabled:opacity-50" onClick={connect}>Connect equipment sheet</button></>}
        </div>
        <form onSubmit={check} className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">Booking reference<input required className="mt-1 block w-full rounded border px-3 py-2" value={criteria.bookingReference} onChange={e=>setCriteria({...criteria,bookingReference:e.target.value})}/></label>
          <label className="text-sm">Event date<input required type="date" className="mt-1 block w-full rounded border px-3 py-2" value={criteria.eventDateISO} onChange={e=>setCriteria({...criteria,eventDateISO:e.target.value})}/></label>
          <label className="text-sm">Act name (if needed)<input className="mt-1 block w-full rounded border px-3 py-2" value={criteria.actName} onChange={e=>setCriteria({...criteria,actName:e.target.value})}/></label>
          <div className="flex items-end"><button disabled={busy} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">{busy?'Checking…':'Check booking'}</button></div>
        </form>
        {error&&<p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
        {result&&!result.available&&<div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900"><p>{result.reason}</p>{result.acts?.length>0&&<p className="mt-2">Acts: {result.acts.join(', ')}</p>}</div>}
        {result?.available&&<div><p className="mb-3 font-semibold">{result.actName} · {result.eventDateISO}</p><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Object.entries(result.provisions).map(([kind,provision])=><section key={kind} className="rounded-lg border p-4"><h3 className="font-semibold">{kind==='pa'?'PA supplier':'Lighting supplier'}</h3><p className="mt-1 text-sm font-medium text-teal-800">{provision.status==='confirmed'?'Confirmed duty':provision.status==='unconfirmed'?'Not confirmed':'Needs management review'}</p>{provision.reason&&<p className="mt-2 text-sm text-amber-800">{provision.reason}</p>}{provision.suppliers.map((supplier,index)=><div key={index} className="mt-3"><p className="font-medium">{supplier.name}</p><p className="text-xs text-gray-500">Roster: {supplier.assignmentStatus}</p>{supplier.reference.status==='reference_only'?<><p className="mt-2 text-xs font-semibold text-gray-500">Sheet reference · event kit still needs confirmation</p><ul className="mt-1 space-y-1 text-sm">{supplier.reference.items.map((item,i)=><li key={i}>{item.quantity} × {item.description}</li>)}</ul></>:<p className="mt-2 text-sm text-amber-800">{supplier.reference.status==='connection_required'?'Connect the equipment sheet to read this supplier’s reference.':supplier.reference.status==='no_profile'?'No equipment reference is mapped to this supplier.':'The equipment reference needs checking.'}</p>}</div>)}</section>)}</div><p className="mt-4 text-sm text-gray-600">Power requirements are unconfirmed. The supplier and venue need to confirm the actual equipment and supply arrangements.</p></div>}
      </div>
    </div>}
  </>;
}
