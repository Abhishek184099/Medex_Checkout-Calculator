const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000
export function bangkokDate(at: Date): string {
  return new Date(at.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}