import intuitConfig from '../../partner.config.intuit.json';
import adpConfig from '../../partner.config.adp.json';
import isolvedConfig from '../../partner.config.isolved.json';
import hibobConfig from '../../partner.config.hibob.json';

export type PartnerProfile = 'intuit' | 'adp' | 'isolved' | 'hibob';
export type ChromeKind = 'wfn' | 'quickbooks' | 'isolved' | 'hibob';

export interface PartnerConfig {
  company: {
    name: string;
    website: string;
  };
  productName: string;
  legalEntity: string;
  chrome: ChromeKind;
  logo: {
    src: string;
    alt: string;
  };
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    tertiary: string;
    accent: string;
    accentHover: string;
    error: string;
    success: string;
    borders: string;
    input: string;
    background: string;
    surface: string;
    foreground: string;
  };
  fonts: {
    family: string;
    headingFamily: string;
  };
}

const PROFILES: Record<PartnerProfile, PartnerConfig> = {
  intuit: intuitConfig as PartnerConfig,
  adp: adpConfig as PartnerConfig,
  isolved: isolvedConfig as PartnerConfig,
  hibob: hibobConfig as PartnerConfig,
};

export function loadPartnerConfig(profile?: string): PartnerConfig {
  const key = (profile ?? '').toLowerCase();
  if (key === 'adp') return PROFILES.adp;
  if (key === 'isolved') return PROFILES.isolved;
  if (key === 'hibob') return PROFILES.hibob;
  return PROFILES.intuit;
}

export const config: PartnerConfig = loadPartnerConfig(
  import.meta.env.VITE_PARTNER_PROFILE,
);

export default config;
