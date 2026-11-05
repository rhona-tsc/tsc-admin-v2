import { originalsRequest } from './originalsApi';
export const loadOriginalAudio = async (token, track, signal) => (await originalsRequest(token, { method: 'get', url: `/assets/${track._id}/audio`, responseType: 'arraybuffer', signal })).data;
