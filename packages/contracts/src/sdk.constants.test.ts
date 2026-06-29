import { describe, expect, it } from 'vitest';
import { RHEO_DEFAULT_SDK_API_BASE_URL } from './sdk.js';

describe('RHEO_DEFAULT_SDK_API_BASE_URL', () => {
  it('points at the production Rheo API origin', () => {
    expect(RHEO_DEFAULT_SDK_API_BASE_URL).toBe('https://api.getrheo.io');
  });
});
