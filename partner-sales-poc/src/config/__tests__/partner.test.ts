import { describe, it, expect } from 'vitest';
import { loadPartnerConfig, type PartnerConfig } from '../partner';

const COLOR_KEYS: Array<keyof PartnerConfig['colors']> = [
  'primary',
  'primaryHover',
  'secondary',
  'tertiary',
  'accent',
  'accentHover',
  'error',
  'success',
  'borders',
  'input',
  'background',
  'surface',
  'foreground',
];

describe('loadPartnerConfig', () => {
  it('profile=intuit → loads Intuit config with QuickBooks chrome and green primary', () => {
    const c = loadPartnerConfig('intuit');
    expect(c.company.name).toBe('Intuit');
    expect(c.chrome).toBe('quickbooks');
    expect(c.colors.primary).toBe('#2CA01C');
    expect(c.productName).toBe('QuickBooks Online Payroll');
  });

  it('profile=adp → loads ADP config with WFN chrome and navy primary', () => {
    const c = loadPartnerConfig('adp');
    expect(c.company.name).toBe('ADP');
    expect(c.chrome).toBe('wfn');
    expect(c.colors.primary).toBe('#003D7A');
    expect(c.productName).toBe('Workforce Now');
  });

  it('profile=isolved → loads isolved config with isolved chrome and magenta primary', () => {
    const c = loadPartnerConfig('isolved');
    expect(c.company.name).toBe('isolved');
    expect(c.chrome).toBe('isolved');
    expect(c.colors.primary).toBe('#E50082');
    expect(c.productName).toBe('People Cloud');
  });

  it('profile=hibob → loads HiBob config with hibob chrome and coral primary', () => {
    const c = loadPartnerConfig('hibob');
    expect(c.company.name).toBe('HiBob');
    expect(c.chrome).toBe('hibob');
    expect(c.colors.primary).toBe('#FF4E64');
    expect(c.productName).toBe('Bob');
  });

  it('unset / unknown profile → defaults to Intuit', () => {
    expect(loadPartnerConfig(undefined).company.name).toBe('Intuit');
    expect(loadPartnerConfig('').company.name).toBe('Intuit');
    expect(loadPartnerConfig('bamboo').company.name).toBe('Intuit');
  });

  it('PartnerConfig shape — productName, chrome, legalEntity present and typed', () => {
    const c = loadPartnerConfig('intuit');
    expect(typeof c.productName).toBe('string');
    expect(typeof c.legalEntity).toBe('string');
    expect(['wfn', 'quickbooks', 'isolved', 'hibob']).toContain(c.chrome);
  });

  it('all profiles include all required color keys', () => {
    for (const profile of ['intuit', 'adp', 'isolved'] as const) {
      const c = loadPartnerConfig(profile);
      for (const key of COLOR_KEYS) {
        expect(c.colors[key], `${profile} missing colors.${key}`).toBeTruthy();
      }
    }
  });
});
