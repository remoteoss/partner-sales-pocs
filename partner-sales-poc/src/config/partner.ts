import partnerConfig from '../../partner.config.json';

export interface PartnerConfig {
  company: {
    name: string;
    website: string;
  };
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

export const config: PartnerConfig = partnerConfig as PartnerConfig;

export default config;

