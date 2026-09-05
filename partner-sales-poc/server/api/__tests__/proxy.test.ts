import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain JS module, no type declarations
import { getAuthType } from '../proxy.js';

// Which token the proxy attaches decides whether a call works at all, and which
// COMPANY it lands in. A client-credentials (partner) token has no user behind
// it — Tiger resolves its `sub` as a user slug — so any user-scoped endpoint
// fails with "User not found with the given slug: <client_id>" or
// "Company not found". Only genuinely pre-company calls may use it.
describe('getAuthType', () => {
  it('pre-company endpoints use the partner token', () => {
    expect(getAuthType('/v1/companies', false)).toBe('partner');
    expect(getAuthType('/v1/companies/schema?country_code=CAN', false)).toBe('partner');
    expect(getAuthType('/v1/countries', false)).toBe('partner');
    expect(getAuthType('/v1/countries/CAN/address_details', false)).toBe('partner');
  });

  it('partner matching is exact, not by prefix', () => {
    // REGRESSION: '/v1/countries' as a prefix captured the Basic Information
    // step's schema, which needs a real user token. It 404'd mid-demo.
    expect(getAuthType('/v1/countries/CAN/employment_basic_information', false, true)).toBe(
      'session',
    );
    expect(getAuthType('/v1/countries/CAN/contract_details', false, true)).toBe('session');
    // A specific company is user-scoped; only the bare collection is partner.
    expect(getAuthType('/v1/companies/887cf22a/legal-entities', false, true)).toBe('session');
  });

  it('user-scoped calls prefer the live session company', () => {
    expect(getAuthType('/v1/employments', true)).toBe('session');
    // Header absent but a session exists on the server: still the session, so a
    // hire cannot land in the .env company by accident.
    expect(getAuthType('/v1/employments', false, true)).toBe('session');
  });

  it('falls back to the env customer token with no session', () => {
    expect(getAuthType('/v1/employments', false, false)).toBe('customer');
    expect(getAuthType('/v1/cost-calculator/estimation', false, false)).toBe('customer');
  });

  it('magic-link follows the same rule', () => {
    expect(getAuthType('/v1/magic-link', true)).toBe('session');
    expect(getAuthType('/v1/magic-link', false, false)).toBe('customer');
  });
});
