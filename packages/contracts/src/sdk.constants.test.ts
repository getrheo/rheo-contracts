import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SDK_LOG_LEVEL,
  RHEO_DEFAULT_SDK_API_BASE_URL,
  SdkLogLevelSchema,
} from './sdk.js';

describe('RHEO_DEFAULT_SDK_API_BASE_URL', () => {
  it('points at the production Rheo API origin', () => {
    expect(RHEO_DEFAULT_SDK_API_BASE_URL).toBe('https://api.getrheo.io');
  });
});

describe('SdkLogLevel', () => {
  it('accepts silent, warn, and debug', () => {
    expect(SdkLogLevelSchema.options).toEqual(['silent', 'warn', 'debug']);
  });

  it('defaults to silent', () => {
    expect(DEFAULT_SDK_LOG_LEVEL).toBe('silent');
  });
});
