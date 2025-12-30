import * as Yup from 'yup';

export const companyFields = [
  {
    name: 'name',
    label: 'Company Name',
    type: 'text',
    required: true,
  },
  {
    name: 'company_owner_name',
    label: 'Company Owner Name',
    type: 'text',
    required: true,
  },
  {
    name: 'company_owner_email',
    label: 'Company Owner Email',
    type: 'email',
    required: true,
  },
  {
    name: 'country_code',
    label: 'Country',
    type: 'select',
    required: true,
    options: [
      { value: 'USA', label: 'United States' },
      { value: 'GBR', label: 'United Kingdom' },
      { value: 'DEU', label: 'Germany' },
      { value: 'FRA', label: 'France' },
      { value: 'CAN', label: 'Canada' },
      { value: 'AUS', label: 'Australia' },
      { value: 'NLD', label: 'Netherlands' },
      { value: 'ESP', label: 'Spain' },
      { value: 'ITA', label: 'Italy' },
      { value: 'PRT', label: 'Portugal' },
    ],
  },
  {
    name: 'desired_currency',
    label: 'Desired Currency',
    type: 'select',
    required: true,
    options: [
      { value: 'USD', label: 'USD - US Dollar' },
      { value: 'EUR', label: 'EUR - Euro' },
      { value: 'GBP', label: 'GBP - British Pound' },
      { value: 'CAD', label: 'CAD - Canadian Dollar' },
      { value: 'AUD', label: 'AUD - Australian Dollar' },
    ],
  },
];

export const companyValidationSchema = Yup.object({
  name: Yup.string().required('Company name is required'),
  company_owner_name: Yup.string().required('Owner name is required'),
  company_owner_email: Yup.string().email('Invalid email').required('Email is required'),
  country_code: Yup.string().required('Country is required'),
  desired_currency: Yup.string().required('Currency is required'),
});

