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
    secondary: string;
    tertiary: string;
    accent: string;
    error: string;
    success: string;
    borders: string;
    input: string;
    background: string;
    foreground: string;
  };
  fonts: {
    family: string;
    headingFamily: string;
  };
}

export const config: PartnerConfig = partnerConfig as PartnerConfig;

export default config;

