import { useState, useMemo, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { JsonSchemaForm } from '../../components/form/JsonSchemaForm';
import { companyValidationSchema } from './fields';
import { useCreateCompany, useCompanyJsonSchema, useCountries, useMagicLink } from './hooks';
import { useCounter, getDefaultCompanyValues } from '../../hooks/useCounter';
import { useQueryClient } from '@tanstack/react-query';
import config from '../../config/partner';

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

export function CreateCompany() {
  const [step, setStep] = useState<'initial' | 'address' | 'success'>('initial');
  const [initialValues, setInitialValues] = useState<InitialFormValues | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  
  // Get counter for default values - capture once to prevent re-renders
  const { counter, isLoading: counterLoading } = useCounter();
  const queryClient = useQueryClient();
  const initialCounterRef = useRef<number | null>(null);
  
  // Capture counter value once when it first loads
  if (initialCounterRef.current === null && !counterLoading) {
    initialCounterRef.current = counter;
  }
  
  const currentCounter = initialCounterRef.current ?? counter;
  const defaultValues = getDefaultCompanyValues(currentCounter);
  
  // Fetch countries from Remote API
  const { data: countries, isLoading: countriesLoading, error: countriesError } = useCountries();
  
  const { data: addressSchema, isLoading: schemaLoading } = useCompanyJsonSchema(
    initialValues?.country_code
  );
  
  const { mutate: createCompany, isPending, isError, error, data: responseData } = useCreateCompany();
  const { mutate: generateMagicLink, isPending: isMagicLinkPending } = useMagicLink();

  const formik = useFormik({
    initialValues: defaultValues,
    enableReinitialize: true, // Safe now because ref prevents counter changes from triggering
    validationSchema: companyValidationSchema,
    onSubmit: (values) => {
      setInitialValues(values);
      setStep('address');
    },
  });

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countries) return [];
    if (!countrySearch.trim()) return countries;
    
    const search = countrySearch.toLowerCase();
    return countries.filter(c => c.searchTerms.includes(search));
  }, [countries, countrySearch]);

  // Get selected country label
  const selectedCountryLabel = useMemo(() => {
    if (!formik.values.country_code || !countries) return '';
    const country = countries.find(c => c.value === formik.values.country_code);
    return country?.label || '';
  }, [formik.values.country_code, countries]);

  const handleCountrySelect = (countryCode: string) => {
    formik.setFieldValue('country_code', countryCode);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
  };

  const handleAddressSubmit = (addressDetails: Record<string, unknown>) => {
    if (!initialValues) return;

    const payload = {
      ...initialValues,
      address_details: addressDetails,
      terms_of_service_accepted_at: new Date().toISOString(),
    };

    createCompany(payload, {
      onSuccess: () => {
        setStep('success');
        // Counter is incremented silently inside createCompany hook
      },
    });
  };

  if (countriesLoading) {
    return <Loading message="Loading countries..." />;
  }

  if (countriesError) {
    return (
      <div className="text-center py-4">
        <p style={{ color: config.colors.error }}>
          Error loading countries. Please check your API credentials.
        </p>
        <pre className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: config.colors.tertiary }}>
          {(countriesError as Error)?.message}
        </pre>
      </div>
    );
  }

  if (isPending) {
    return <Loading message="Creating company..." />;
  }

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
            // Open magic link URL in new tab
            const magicLinkUrl = data?.data?.url || data?.url;
            if (magicLinkUrl) {
              window.open(magicLinkUrl, '_blank');
            } else {
              console.error('No magic link URL in response:', data);
            }
          },
          onError: (err) => {
            console.error('Failed to generate magic link:', err);
          },
        }
      );
    };

    const handleSDKClick = () => {
      // Navigate to employment creation with session context
      window.location.href = `/create-employment?company_id=${companyId}&use_session=true`;
    };

    return (
      <div className="text-center py-8">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${config.colors.success}20` }}
        >
          <span style={{ color: config.colors.success, fontSize: '2rem' }}>✓</span>
        </div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: config.colors.foreground }}>
          Company Created Successfully!
        </h3>
        <p className="text-sm mb-4" style={{ color: config.colors.secondary }}>
          Company ID: {companyId}
        </p>
        
        {/* Two options for creating employment */}
        <div className="space-y-3 mb-6">
          {/* Option 1: Magic Link to Remote */}
          <Button 
            className="w-full"
            onClick={handleMagicLinkClick}
            disabled={isMagicLinkPending || !companyOwnerId}
          >
            {isMagicLinkPending ? 'Generating link...' : 'Continue to create a new EOR employee in Remote'}
          </Button>
          
          {/* Option 2: Use SDK */}
          <Button 
            className="w-full"
            variant="outline"
            onClick={handleSDKClick}
            disabled={!companyId}
          >
            Create Employment via SDK
          </Button>
        </div>
        
        <pre 
          className="text-left p-4 rounded-lg overflow-auto text-xs max-h-48 mb-4"
          style={{ backgroundColor: config.colors.tertiary }}
        >
          {JSON.stringify(responseData, null, 2)}
        </pre>
        <Button 
          variant="outline"
          onClick={async () => {
            // Invalidate counter to get fresh value
            await queryClient.invalidateQueries({ queryKey: ['counter'] });
            // Reset the ref so next render captures new counter
            initialCounterRef.current = null;
            setStep('initial');
            setInitialValues(null);
          }}
        >
          Create Another Company
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p style={{ color: config.colors.error }}>
          Error creating company: {(error as Error)?.message}
        </p>
        <Button className="mt-4" onClick={() => setStep('initial')}>
          Try Again
        </Button>
      </div>
    );
  }

  // Address Details Step - Using JSON Schema Form
  if (step === 'address') {
    if (schemaLoading) {
      return <Loading message="Loading address form..." />;
    }

    if (!addressSchema) {
      return (
        <div className="text-center py-4">
          <p style={{ color: config.colors.error }}>
            Failed to load address schema for {initialValues?.country_code}
          </p>
          <Button className="mt-4" onClick={() => setStep('initial')}>
            Back
          </Button>
        </div>
      );
    }

    return (
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: config.colors.foreground }}>
          Address Details
        </h3>
        <p className="text-sm mb-4" style={{ color: config.colors.secondary }}>
          Please provide the company address for {selectedCountryLabel || initialValues?.country_code}
        </p>
        
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

  // Initial Company Details Step
  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
          Company Name <span style={{ color: config.colors.error }}>*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="w-full p-2 rounded-lg text-sm"
          style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
        />
        {formik.touched.name && formik.errors.name && (
          <p className="text-xs mt-1" style={{ color: config.colors.error }}>{formik.errors.name}</p>
        )}
      </div>

      {/* Tax Number */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
          Tax Number <span style={{ color: config.colors.error }}>*</span>
        </label>
        <input
          type="text"
          name="tax_number"
          value={formik.values.tax_number}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Company tax identification number"
          className="w-full p-2 rounded-lg text-sm"
          style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
        />
        {formik.touched.tax_number && formik.errors.tax_number && (
          <p className="text-xs mt-1" style={{ color: config.colors.error }}>{formik.errors.tax_number}</p>
        )}
      </div>

      {/* Company Owner Name */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
          Company Owner Name <span style={{ color: config.colors.error }}>*</span>
        </label>
        <input
          type="text"
          name="company_owner_name"
          value={formik.values.company_owner_name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="w-full p-2 rounded-lg text-sm"
          style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
        />
        {formik.touched.company_owner_name && formik.errors.company_owner_name && (
          <p className="text-xs mt-1" style={{ color: config.colors.error }}>{formik.errors.company_owner_name}</p>
        )}
      </div>

      {/* Company Owner Email */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
          Company Owner Email <span style={{ color: config.colors.error }}>*</span>
        </label>
        <input
          type="email"
          name="company_owner_email"
          value={formik.values.company_owner_email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="w-full p-2 rounded-lg text-sm"
          style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
        />
        {formik.touched.company_owner_email && formik.errors.company_owner_email && (
          <p className="text-xs mt-1" style={{ color: config.colors.error }}>{formik.errors.company_owner_email}</p>
        )}
      </div>

      {/* Country - Searchable Dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
          Country <span style={{ color: config.colors.error }}>*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder={selectedCountryLabel || "Search by country name or code..."}
            value={isCountryDropdownOpen ? countrySearch : selectedCountryLabel}
            onChange={(e) => {
              setCountrySearch(e.target.value);
              if (!isCountryDropdownOpen) setIsCountryDropdownOpen(true);
            }}
            onFocus={() => setIsCountryDropdownOpen(true)}
            onBlur={() => {
              // Delay to allow click on dropdown item
              setTimeout(() => setIsCountryDropdownOpen(false), 200);
            }}
            className="w-full p-2 rounded-lg text-sm pr-8"
            style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
          />
          <span 
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
          >
            ▼
          </span>
          
          {isCountryDropdownOpen && (
            <div 
              className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-lg shadow-lg"
              style={{ 
                backgroundColor: config.colors.background, 
                border: `1px solid ${config.colors.borders}` 
              }}
            >
              {filteredCountries.length === 0 ? (
                <div className="p-2 text-sm" style={{ color: config.colors.secondary }}>
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <div
                    key={country.value}
                    className="p-2 text-sm cursor-pointer hover:bg-gray-100"
                    style={{ 
                      backgroundColor: formik.values.country_code === country.value 
                        ? `${config.colors.primary}15` 
                        : 'transparent'
                    }}
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
          <p className="text-xs mt-1" style={{ color: config.colors.error }}>{formik.errors.country_code}</p>
        )}
        <p className="text-xs mt-1" style={{ color: config.colors.secondary }}>
          {countries?.length || 0} countries available with Remote EOR
        </p>
      </div>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
          Desired Currency <span style={{ color: config.colors.error }}>*</span>
        </label>
        <select
          name="desired_currency"
          value={formik.values.desired_currency}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="w-full p-2 rounded-lg text-sm"
          style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="pt-4">
        <p className="text-xs mb-4" style={{ color: config.colors.secondary }}>
          By creating a company, you agree to{' '}
          <a 
            href="https://remote.com/terms-of-service" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: config.colors.primary }}
          >
            Remote's Terms of Service
          </a>
          .
        </p>
        <Button type="submit">Continue to Address Details</Button>
      </div>
    </form>
  );
}
