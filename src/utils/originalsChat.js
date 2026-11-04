export const CHAT_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,.doc,.docx,audio/*,video/mp4,video/quicktime';
export const chatFileError = (files, existingCount = 0) => {
  if (files.length + existingCount > 5) return 'You can attach up to five files per message.';
  if (files.some(file => file.size > CHAT_MAX_BYTES)) return 'Each attachment must be 10 MB or smaller.';
  if (files.some(file => !file.size)) return 'Empty files cannot be sent.';
  return '';
};
export const recordingExtension = mime => mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
export const recordingTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
