import React, { useState } from 'react';
import Cropper from 'react-easy-crop';

const cropUrl = (url, crop) => {
  if (!crop || !url?.startsWith('https://res.cloudinary.com/')) return url;
  const { x, y, width, height } = crop;
  return url.replace('/upload/', `/upload/c_crop,g_north_west,x_${Math.round(x)},y_${Math.round(y)},w_${Math.round(width)},h_${Math.round(height)}/c_limit,w_960,f_auto,q_auto/`);
};

export default function LocationCardCrop({ images = [], setImages }) {
  const [editing, setEditing] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState(null);
  const first = images[0];
  const source = typeof first === 'string' ? first : first?.url;
  const saved = typeof first === 'object' ? first?.locationCrop : null;
  const update = next => setImages(previous => previous.map((image, index) => index === 0 ? { ...(typeof image === 'string' ? { url: image } : image), locationCrop: next } : image));

  return <section className="rounded-xl border border-gray-300 p-5">
    <h3 className="text-lg font-semibold">Location-page card photo</h3>
    <p className="mt-2 text-sm text-gray-600">Choose how your first gallery photo appears on our county wedding-band pages. Keep everyone’s face inside the frame. This crop won’t change your original photo or other gallery images. Reorder your gallery above to choose a different first photo.</p>
    {!source ? <p className="mt-4 text-sm">Upload a gallery photo above to choose its crop.</p> : <>
      <img src={cropUrl(source, saved)} alt="Preview of your location-page card photo" className="mt-4 aspect-[3/2] w-full max-w-sm rounded-lg object-cover object-top" />
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="rounded border border-black px-4 py-2" onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); setPixels(null); setEditing(true); }}>Choose crop</button>
        {saved && <button type="button" className="rounded border px-4 py-2" onClick={() => update(null)}>Reset crop</button>}
      </div>
      <p className="mt-2 text-xs text-gray-600">{saved ? 'Custom crop selected.' : 'Default top-aligned crop.'} Save your draft or submit the form to keep changes.</p>
    </>}
    {editing && source && <div role="dialog" aria-modal="true" aria-labelledby="location-crop-title" onKeyDown={event => {
      if (event.key === 'Escape') setEditing(false);
      if (event.key === 'Tab') {
        const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input, [tabindex="0"]')];
        const firstControl = controls[0], lastControl = controls.at(-1);
        if (event.shiftKey && document.activeElement === firstControl) { event.preventDefault(); lastControl?.focus(); }
        if (!event.shiftKey && document.activeElement === lastControl) { event.preventDefault(); firstControl?.focus(); }
      }
    }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5">
        <h3 id="location-crop-title" className="text-xl font-semibold">Crop for location pages</h3>
        <p className="mt-2 text-sm">Drag the photo and adjust the zoom. The frame matches the published card.</p>
        <div className="relative mt-4 h-[45vh] bg-black">
          <Cropper key={source} image={source} aspect={3 / 2} crop={crop} zoom={zoom} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_area, areaPixels) => setPixels(areaPixels)} initialCroppedAreaPixels={saved || undefined} />
        </div>
        <label className="mt-4 flex items-center gap-3">Zoom<input aria-label="Photo zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="flex-1" /></label>
        <div className="mt-5 flex justify-end gap-3"><button autoFocus type="button" className="rounded border px-4 py-2" onClick={() => setEditing(false)}>Cancel</button><button type="button" disabled={!pixels} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" onClick={() => { update(pixels); setEditing(false); }}>Use this crop</button></div>
      </div>
    </div>}
  </section>;
}
