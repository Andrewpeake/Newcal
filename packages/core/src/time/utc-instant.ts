/**
 * Milliseconds since Unix epoch in **UTC**. Used as the canonical storage for event bounds.
 */
export type UtcInstantMs = number & { readonly __brand: 'UtcInstantMs' };

export function utcInstantMs(value: number): UtcInstantMs {
  if (!Number.isFinite(value)) {
    throw new RangeError('UTC instant must be a finite number (milliseconds since epoch)');
  }
  return value as UtcInstantMs;
}

export function utcInstantMsFromIso(isoUtc: string): UtcInstantMs {
  const ms = Date.parse(isoUtc);
  if (Number.isNaN(ms)) {
    throw new RangeError(`Invalid ISO UTC string: ${isoUtc}`);
  }
  return utcInstantMs(ms);
}

export function toIsoUtc(instant: UtcInstantMs): string {
  return new Date(instant).toISOString();
}
