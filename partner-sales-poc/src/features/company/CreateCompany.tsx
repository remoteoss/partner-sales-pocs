import { useState, useMemo, useEffect } from 'react';
import { useFormik } from 'formik';
import { Check, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { JsonSchemaForm } from '../../components/form/JsonSchemaForm';
import { companyValidationSchema } from './fields';
import { useCreateCompany, useCompanyJsonSchema, useCountries, useMagicLink } from './hooks';
import { useCounter, getDefaultCompanyValues } from '../../hooks/useCounter';
import { useQueryClient } from '@tanstack/react-query';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'SEK', label: 'SEK - Swedish Krona' },
  { value: 'NOK', label: 'NOK - Norwegian Krone' },
  { value: 'DKK', label: 'DKK - Danish Krone' },
];

interface InitialFormValues {
  name: string;
  tax_number: string;
  company_owner_name: string;
  company_owner_email: string;
  country_code: string;
  desired_currency: string;
}

const fieldClass =
  'w-full h-9 px-3 text-sm rounded-sm border border-input bg-background text-foreground focus:outline-none focus:border-primary';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-secondary mb-1';
const requiredMark = <span className="text-accent">*</span>;

export function CreateCompany() {
  const [step, setStep] = useState<'initial' | 'address' | 'success'>('initial');
  const [initialValues, setInitialValues] = useState<InitialFormValues | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const { counter, isLoading: counterLoading } = useCounter();
  const queryClient = useQueryClient();
  const [lockedCounter, setLockedCounter] = useState<number | null>(null);

  useEffect(() => {
    if (lockedCounter === null && !counterLoading) {
      // Lock once after first counter load so default values don't jump mid-edit
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLockedCounter(counter);
    }
  }, [counter, counterLoading, lockedCounter]);

  const currentCounter = lockedCounter ?? counter;
  const defaultValues = getDefaultCompanyValues(currentCounter);

  const { data: countries, isLoading: countriesLoading, error: countriesError } = useCountries();
  const { data: addressSchema, isLoading: schemaLoading } = useCompanyJsonSchema(
    initialValues?.country_code
  );

  const { mutate: createCompany, isPending, isError, error, data: responseData } = useCreateCompany();
  const { mutate: generateMagicLink, isPending: isMagicLinkPending } = useMagicLink();

  const formik = useFormik({
    initialValues: defaultValues,
    enableReinitialize: true,
    validationSchema: companyValidationSchema,
    onSubmit: (values) => {
      setInitialValues(values);
      setStep('address');
    },
  });

  const filteredCountries = useMemo(() => {
    if (!countries) return [];
    if (!countrySearch.trim()) return countries;
    const search = countrySearch.toLowerCase();
    return countries.filter((c) => c.searchTerms.includes(search));
  }, [countries, countrySearch]);

  const selectedCountryLabel = useMemo(() => {
    if (!formik.values.country_code || !countries) return '';
    return countries.find((c) => c.value === formik.values.country_code)?.label || '';
  }, [formik.values.country_code, countries]);

  const handleCountrySelect = (countryCode: string) => {
    formik.setFieldValue('country_code', countryCode);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
  };

  const handleAddressSubmit = (addressDetails: Record<string, unknown>) => {
    if (!initialValues) return;
    createCompany(
      {
        ...initialValues,
        address_details: addressDetails,
        terms_of_service_accepted_at: new Date().toISOString(),
      },
      {
        onSuccess: () => setStep('success'),
      }
    );
  };

  if (countriesLoading) return <Loading message="Loading countries..." />;

  if (countriesError) {
    return (
      <div className="py-4">
        <div className="border-l-4 border-error bg-error/5 px-4 py-3 rounded-sm">
          <p className="text-sm font-semibold text-error">Error loading countries</p>
          <p className="text-xs text-secondary mt-1">
            Please check your API credentials or try again.
          </p>
          <pre className="text-[11px] mt-2 p-2 rounded-sm bg-surface border border-border overflow-auto">
            {(countriesError as Error)?.message}
          </pre>
        </div>
      </div>
    );
  }

  if (isPending) return <Loading message="Creating company..." />;

  if (step === 'success' && responseData) {
    const company = responseData.data?.company;
    const companyOwnerId = company?.company_owner_user_id;
    const companyId = company?.id;

    const handleMagicLinkClick = () => {
      if (!companyOwnerId) {
        console.error('No company owner user ID found');
        return;
      }
      generateMagicLink(
        { userId: companyOwnerId, path: '/dashboard/people/add?employmentType=full_time', useSessionToken: true },
        {
          onSuccess: (data) => {
            const magicLinkUrl = data?.data?.url || data?.url;
            if (magicLinkUrl) {
              window.open(magicLinkUrl, '_blank');
            } else {
              console.error('No magic link URL in response:', data);
            }
          },
          onError: (err) => console.error('Failed to generate magic link:', err),
        }
      );
    };

    return (
      <div>
        <div className="flex items-start gap-4 border-l-4 border-success bg-success/5 px-4 py-3 rounded-sm">
          <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center shrink-0">
            <Check size={16} strokeWidth={3} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Company created successfully</p>
            <p className="text-xs text-secondary mt-0.5">
              Company ID: <span className="font-mono text-foreground">{companyId}</span>
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Button
            className="w-full"
            variant="accent"
            onClick={handleMagicLinkClick}
            disabled={isMagicLinkPending || !companyOwnerId}
          >
            {isMagicLinkPending ? 'Generating link...' : 'Continue to create a new EOR employee in Remote'}
            {!isMagicLinkPending && <ExternalLink size={14} />}
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await queryClient.invalidateQueries({ queryKey: ['counter'] });
              setLockedCounter(null);
              setStep('initial');
              setInitialValues(null);
            }}
          >
            Create another company
          </Button>
        </div>

        <details className="mt-5 text-xs">
          <summary className="cursor-pointer text-secondary hover:text-foreground">
            View raw response
          </summary>
          <pre className="mt-2 p-3 rounded-sm bg-surface border border-border text-[11px] overflow-auto max-h-56">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4">
        <div className="border-l-4 border-error bg-error/5 px-4 py-3 rounded-sm">
          <p className="text-sm font-semibold text-error">Error creating company</p>
          <p className="text-xs text-secondary mt-1">{(error as Error)?.message}</p>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => setStep('initial')}>Try again</Button>
        </div>
      </div>
    );
  }

  if (step === 'address') {
    if (schemaLoading) return <Loading message="Loading address form..." />;

    if (!addressSchema) {
      return (
        <div className="py-4">
          <div className="border-l-4 border-error bg-error/5 px-4 py-3 rounded-sm">
            <p className="text-sm font-semibold text-error">
              Failed to load address schema for {initialValues?.country_code}
            </p>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => setStep('initial')}>Back</Button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="mb-4 pb-3 border-b border-border">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Address Details
          </h3>
          <p className="text-xs text-secondary mt-1">
            Provide the registered address for{' '}
            <span className="font-medium text-foreground">
              {selectedCountryLabel || initialValues?.country_code}
            </span>
          </p>
        </div>

        <JsonSchemaForm
          jsonSchema={addressSchema}
          onSubmit={handleAddressSubmit}
          onBack={() => setStep('initial')}
          submitLabel="Create Company"
          initialValues={{
            address: 'Alberta local address',
            address_line_2: '',
            city: 'Alberta city',
            state: 'AB',
            postal_code: 'K1A 0B1',
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Company Name {requiredMark}</label>
          <input
            type="text"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={fieldClass}
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-xs mt-1 text-error">{formik.errors.name}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Tax Number {requiredMark}</label>
          <input
            type="text"
            name="tax_number"
            value={formik.values.tax_number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Company tax identification number"
            className={fieldClass}
          />
          {formik.touched.tax_number && formik.errors.tax_number && (
            <p className="text-xs mt-1 text-error">{formik.errors.tax_number}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Company Owner Name {requiredMark}</label>
          <input
            type="text"
            name="company_owner_name"
            value={formik.values.company_owner_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={fieldClass}
          />
          {formik.touched.company_owner_name && formik.errors.company_owner_name && (
            <p className="text-xs mt-1 text-error">{formik.errors.company_owner_name}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Company Owner Email {requiredMark}</label>
          <input
            type="email"
            name="company_owner_email"
            value={formik.values.company_owner_email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={fieldClass}
          />
          {formik.touched.company_owner_email && formik.errors.company_owner_email && (
            <p className="text-xs mt-1 text-error">{formik.errors.company_owner_email}</p>
          )}
        </div>

        <div className="relative">
          <label className={labelClass}>Country {requiredMark}</label>
          <div className="relative">
            <input
              type="text"
              placeholder={selectedCountryLabel || 'Search by country name or code...'}
              value={isCountryDropdownOpen ? countrySearch : selectedCountryLabel}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                if (!isCountryDropdownOpen) setIsCountryDropdownOpen(true);
              }}
              onFocus={() => setIsCountryDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsCountryDropdownOpen(false), 200)}
              className={`${fieldClass} pr-8`}
            />
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
            />

            {isCountryDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-sm shadow-lg bg-background border border-border">
                {filteredCountries.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-secondary">No countries found</div>
                ) : (
                  filteredCountries.map((country) => (
                    <div
                      key={country.value}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-tertiary ${
                        formik.values.country_code === country.value ? 'bg-tertiary' : ''
                      }`}
                      onClick={() => handleCountrySelect(country.value)}
                    >
                      {country.label}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {formik.touched.country_code && formik.errors.country_code && (
            <p className="text-xs mt-1 text-error">{formik.errors.country_code}</p>
          )}
          <p className="text-[11px] mt-1 text-secondary">
            {countries?.length || 0} countries available with Remote EOR
          </p>
        </div>

        <div>
          <label className={labelClass}>Desired Currency {requiredMark}</label>
          <select
            name="desired_currency"
            value={formik.values.desired_currency}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={fieldClass}
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-[11px] text-secondary mb-3">
          By creating a company, you agree to{' '}
          <a
            href="https://remote.com/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Remote's Terms of Service
          </a>
          .
        </p>
        <div className="flex justify-end">
          <Button type="submit" variant="accent">Continue to address details</Button>
        </div>
      </div>
    </form>
  );
}
