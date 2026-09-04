// Global Payroll demo config: the sandbox company and its GP-enabled legal
// entities, one per country. The SDK's admin flow takes a fixed `legalEntityId`
// prop and does NOT derive it from the selected country — so the POC owns the
// country→entity mapping. Hiring a German employee must use the German entity;
// hiring a US employee must use the US entity.

export const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;

export interface GpCountry {
  code: string; // ISO 3166-1 alpha-3
  name: string;
  legalEntityId: string;
  /** Whether the employee self-onboarding adds tax steps (US-only on this SDK branch). */
  hasTaxSteps: boolean;
}

export const GP_COUNTRIES: GpCountry[] = [
  {
    code: 'DEU',
    name: 'Germany',
    legalEntityId: 'b1b82077-ccea-45bb-8ea8-4c33958b56a1',
    hasTaxSteps: false,
  },
  {
    code: 'USA',
    name: 'United States',
    legalEntityId: '0fb1b659-8be3-4c46-a9d3-7ad7d384dea0',
    hasTaxSteps: true,
  },
];

export function getEntityForCountry(code: string): string {
  const match = GP_COUNTRIES.find((c) => c.code === code);
  if (!match) {
    throw new Error(`No GP legal entity configured for country "${code}"`);
  }
  return match.legalEntityId;
}

export function getGpCountry(code: string): GpCountry | undefined {
  return GP_COUNTRIES.find((c) => c.code === code);
}
