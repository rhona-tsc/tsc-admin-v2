export const sanitizeActMedia = media => (media || []).map(item => {
  if (typeof item === 'string') return { title: '', url: item };
  if (item && typeof item === 'object' && item.url) return {
    title: item.title || '', url: item.url,
    ...(item.locationCrop ? { locationCrop: item.locationCrop } : {}),
  };
  return null;
}).filter(Boolean);
