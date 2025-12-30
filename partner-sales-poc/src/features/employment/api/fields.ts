import * as Yup from 'yup';

export const initialFields = [
  {
    name: 'country_code',
    label: 'Employment Country',
    type: 'select',
    required: true,
    options: [
      { value: 'PRT', label: 'Portugal' },
      { value: 'GBR', label: 'United Kingdom' },
      { value: 'DEU', label: 'Germany' },
      { value: 'ESP', label: 'Spain' },
      { value: 'FRA', label: 'France' },
      { value: 'NLD', label: 'Netherlands' },
      { value: 'ITA', label: 'Italy' },
      { value: 'IRL', label: 'Ireland' },
    ],
  },
  {
    name: 'type',
    label: 'Employment Type',
    type: 'select',
    required: true,
    options: [
      { value: 'employee', label: 'Employee' },
      { value: 'contractor', label: 'Contractor' },
    ],
  },
  {
    name: 'pricing_plan',
    label: 'Pricing Plan',
    type: 'select',
    required: true,
    options: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'annually', label: 'Annually' },
    ],
  },
  {
    name: 'send_invite',
    label: 'Send enrollment invitation to employee',
    type: 'checkbox',
    required: false,
  },
];

export const initialValidationSchema = Yup.object({
  country_code: Yup.string().required('Country is required'),
  type: Yup.string().oneOf(['employee', 'contractor']).required('Type is required'),
  pricing_plan: Yup.string().required('Pricing plan is required'),
});

