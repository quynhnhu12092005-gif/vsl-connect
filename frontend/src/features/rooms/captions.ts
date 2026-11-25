export type CaptionSource = 'speech' | 'sign';
export type RoomCaption = { source: CaptionSource; text: string };

export const CAPTION_CHANNEL = 'vsl-captions-v1';
const MAX_TEXT_LENGTH = 240;

export function createCaption(source: CaptionSource, value: string): RoomCaption | null {
  const text = value.replace(/\s+/gu, ' ').trim().slice(0, MAX_TEXT_LENGTH);
  return text ? { source, text } : null;
}

export function readCaption(message: unknown): RoomCaption | null {
  if (typeof message !== 'string' || message.length > 1600) return null;
  try {
    const data = JSON.parse(message);
    if (!data || (data.source !== 'speech' && data.source !== 'sign') || typeof data.text !== 'string') return null;
    return createCaption(data.source, data.text);
  } catch {
    return null;
  }
}
