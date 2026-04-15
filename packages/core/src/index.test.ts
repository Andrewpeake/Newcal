import { describe, expect, it } from 'vitest';
import { NEWCAL_CORE_VERSION } from './index.js';

describe('@newcal/core', () => {
  it('exposes a stable version constant', () => {
    expect(NEWCAL_CORE_VERSION).toBe('0.7.0');
  });
});
