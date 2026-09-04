import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain JS module, no type declarations
import { getAuthType } from '../proxy.js';

// Which token the proxy attaches decides which COMPANY a call lands in. Get it
// wrong on an employment call and the hire is created under the .env company
// instead of the one created during the demo, with no error anywhere.
describe('getAuthType', () => {
  it('company + country lookups always use the partner token', () => {
    // Called before any customer context exists, so a session token is
    // meaningless here even when the caller asks for one.
    expect(getAuthType('/v1/companies', false)).toBe('partner');
    expect(getAuthType('/v1/companies', true)).toBe('partner');
    expect(getAuthType('/v1/countries', false)).toBe('partner');
    expect(getAuthType('/v1/countries/PRT/address_details', true)).toBe('partner');
  });

  it('employment calls follow the session header', () => {
    expect(getAuthType('/v1/employments', true)).toBe('session');
    expect(getAuthType('/v1/employments/abc-123', true)).toBe('session');
    expect(getAuthType('/v1/employments', false)).toBe('customer');
  });

  it('magic-link keeps using the session token when asked', () => {
    expect(getAuthType('/v1/magic-link', true)).toBe('session');
    expect(getAuthType('/v1/magic-link', false)).toBe('customer');
  });

  it('unknown paths default to the customer token', () => {
    expect(getAuthType('/v1/cost-calculator/estimation', false)).toBe('customer');
    expect(getAuthType('/v1/anything-else', false)).toBe('customer');
  });
});
