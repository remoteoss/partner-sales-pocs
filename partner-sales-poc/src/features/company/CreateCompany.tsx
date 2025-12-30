import { useState } from 'react';
import { useFormik } from 'formik';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { companyFields, companyValidationSchema } from './fields';
import { useCreateCompany, useCompanyJsonSchema } from './hooks';
import config from '../../config/partner';

export function CreateCompany() {
  const [step, setStep] = useState<'initial' | 'address' | 'success'>('initial');
  const [initialValues, setInitialValues] = useState<Record<string, string> | null>(null);
  
  const { data: addressSchema, isLoading: schemaLoading } = useCompanyJsonSchema(
    initialValues?.country_code
  );
  
  const { mutate: createCompany, isPending, isError, error, data: responseData } = useCreateCompany();

  const formik = useFormik({
    initialValues: {
      name: '',
      company_owner_name: '',
      company_owner_email: '',
      country_code: '',
      desired_currency: 'USD',
    },
    validationSchema: companyValidationSchema,
    onSubmit: (values) => {
      setInitialValues(values);
      setStep('address');
    },
  });

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
      },
    });
  };

  if (isPending || schemaLoading) {
    return <Loading message="Processing..." />;
  }

  if (step === 'success' && responseData) {
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
          Company ID: {responseData.data?.company?.id}
        </p>
        <pre 
          className="text-left p-4 rounded-lg overflow-auto text-xs max-h-64"
          style={{ backgroundColor: config.colors.tertiary }}
        >
          {JSON.stringify(responseData, null, 2)}
        </pre>
        <Button 
          className="mt-4" 
          onClick={() => {
            setStep('initial');
            setInitialValues(null);
            formik.resetForm();
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

  if (step === 'address' && addressSchema) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-4" style={{ color: config.colors.foreground }}>
          Address Details
        </h3>
        <p className="text-sm mb-4" style={{ color: config.colors.secondary }}>
          Please provide the company address details for {initialValues?.country_code}
        </p>
        {/* Simple placeholder - in production, use json-schema-form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddressSubmit({});
          }}
        >
          <p className="text-sm mb-4" style={{ color: config.colors.secondary }}>
            Note: Address form would be dynamically generated from JSON Schema in production.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep('initial')}>
              Back
            </Button>
            <Button type="submit">Create Company</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      {companyFields.map((field) => (
        <div key={field.name}>
          <label 
            className="block text-sm font-medium mb-1"
            style={{ color: config.colors.foreground }}
          >
            {field.label}
            {field.required && <span style={{ color: config.colors.error }}> *</span>}
          </label>
          
          {field.type === 'select' ? (
            <select
              name={field.name}
              value={formik.values[field.name as keyof typeof formik.values]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full p-2 rounded-lg text-sm"
              style={{
                border: `1px solid ${config.colors.input}`,
                backgroundColor: config.colors.background,
              }}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              name={field.name}
              value={formik.values[field.name as keyof typeof formik.values]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full p-2 rounded-lg text-sm"
              style={{
                border: `1px solid ${config.colors.input}`,
                backgroundColor: config.colors.background,
              }}
            />
          )}
          
          {formik.touched[field.name as keyof typeof formik.touched] && 
           formik.errors[field.name as keyof typeof formik.errors] && (
            <p className="text-xs mt-1" style={{ color: config.colors.error }}>
              {formik.errors[field.name as keyof typeof formik.errors]}
            </p>
          )}
        </div>
      ))}

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
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}

