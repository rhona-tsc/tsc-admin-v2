// Match specific vocal/bass roles before broader instrument families.
export function originalsRoleImage(name) {
  const role = String(name || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\b(click(?:\s+track)?|metronome)\b/.test(role)) return 'click-track';
  const vocal = /\b(vocals?|vocalists?|singers?|singing)\b/.test(role);
  if (/\b(backing|background|harmony|harmonies)\b/.test(role) && vocal || /\b(bvs?|bvox|choir)\b/.test(role)) return 'backing-vocals';
  if (vocal && /\b(female|woman|women)\b/.test(role)) return 'female-vocal';
  if (vocal) return 'vocal';
  if (/\bmaster(?:ing)?\b/.test(role)) return 'mastering';
  if (/\bmix(?:ing)?\b/.test(role)) return 'mixing';
  if (/\b(sax|saxophone|saxophonist)\b/.test(role)) return 'saxophone';
  if (/\b(trumpet|trumpeter|cornet|flugelhorn|brass)\b/.test(role)) return 'trumpet';
  if (/\b(bass|bassist)\b/.test(role) && !/\b(clarinet|trombone|bassoon|saxophone)\b/.test(role)) return 'bass';
  if (/\b(guitars?|guitarist)\b/.test(role)) return 'guitar';
  if (/\b(keys|keyboards?|keyboardist|piano|pianist|organ|synth|synthesizer|synthesiser)\b/.test(role)) return 'keys';
  if (/\b(drums?|drummer|percussion|percussionist|cajon)\b/.test(role)) return 'drums';
  return 'other';
}
