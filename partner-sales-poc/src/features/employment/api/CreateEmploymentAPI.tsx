import { useState } from 'react';
import { useFormik } from 'formik';
import { Button } from '../../../components/ui/Button';
import { Loading } from '../../../components/ui/Loading';
import { initialFields, initialValidationSchema } from './fields';
import { useCreateEmployment, useBasicInformationSchema } from './hooks';
import config from '../../../config/partner';

type Step = 'initial' | 'basic_info' | 'success';

interface InitialValues {
  country_code: string;
  type: 'employee' | 'contractor';
  pricing_plan: string;
  send_invite: boolean;
}

export function CreateEmploymentAPI() {
  const [step, setStep] = useState<Step>('initial');
  const [initialFormValues, setInitialFormValues] = useState<InitialValues | null>(null);
  const [employmentId, setEmploymentId] = useState<string | null>(null);

  const { data: basicInfoSchema, isLoading: schemaLoading } = useBasicInformationSchema(
    initialFormValues?.country_code
  );

  const { mutate: createEmployment, isPending, data: responseData } = useCreateEmployment({
    onSuccess: (data: { data?: { employment?: { id: string } } }) => {
      if (data?.data?.employment?.id) {
        setEmploymentId(data.data.employment.id);
        setStep('success');
      }
    },
  });

  const initialFormik = useFormik<InitialValues>({
    initialValues: {
      country_code: '',
      type: 'employee',
      pricing_plan: 'monthly',
      send_invite: false,
    },
    validationSchema: initialValidationSchema,
    onSubmit: (values) => {
      setInitialFormValues(values);
      setStep('basic_info');
    },
  });

  const basicInfoFormik = useFormik({
    initialValues: {
      name: '',
      email: '',
      job_title: '',
      provisional_start_date: '',
      annual_gross_salary: '',
    },
    onSubmit: (values) => {
      if (!initialFormValues) return;

      createEmployment({
        country_code: initialFormValues.country_code,
        type: initialFormValues.type,
        basic_information: {
          ...values,
          annual_gross_salary: parseFloat(values.annual_gross_salary) * 100, // Convert to cents
        },
      });
    },
  });

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
          Employment Created Successfully!
        </h3>
        <p className="text-sm mb-4" style={{ color: config.colors.secondary }}>
          Employment ID: {employmentId}
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
            setInitialFormValues(null);
            setEmploymentId(null);
            initialFormik.resetForm();
            basicInfoFormik.resetForm();
          }}
        >
          Create Another Employment
        </Button>
      </div>
    );
  }

  if (step === 'basic_info') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" onClick={() => setStep('initial')}>
            ← Back
          </Button>
          <span className="text-sm" style={{ color: config.colors.secondary }}>
            Basic Information for {initialFormValues?.country_code}
          </span>
        </div>

        <div
          className="p-3 rounded-lg mb-4"
          style={{ backgroundColor: config.colors.tertiary }}
        >
          <p className="text-sm" style={{ color: config.colors.secondary }}>
            Note: In production, this form would be dynamically generated from the JSON Schema
            returned by the API. Schema available: {basicInfoSchema ? 'Yes' : 'No'}
          </p>
        </div>

        <form onSubmit={basicInfoFormik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
              Full Name <span style={{ color: config.colors.error }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={basicInfoFormik.values.name}
              onChange={basicInfoFormik.handleChange}
              required
              className="w-full p-2 rounded-lg text-sm"
              style={{ border: `1px solid ${config.colors.input}` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
              Email <span style={{ color: config.colors.error }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={basicInfoFormik.values.email}
              onChange={basicInfoFormik.handleChange}
              required
              className="w-full p-2 rounded-lg text-sm"
              style={{ border: `1px solid ${config.colors.input}` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
              Job Title <span style={{ color: config.colors.error }}>*</span>
            </label>
            <input
              type="text"
              name="job_title"
              value={basicInfoFormik.values.job_title}
              onChange={basicInfoFormik.handleChange}
              required
              className="w-full p-2 rounded-lg text-sm"
              style={{ border: `1px solid ${config.colors.input}` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
              Start Date <span style={{ color: config.colors.error }}>*</span>
            </label>
            <input
              type="date"
              name="provisional_start_date"
              value={basicInfoFormik.values.provisional_start_date}
              onChange={basicInfoFormik.handleChange}
              required
              className="w-full p-2 rounded-lg text-sm"
              style={{ border: `1px solid ${config.colors.input}` }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
              Annual Gross Salary <span style={{ color: config.colors.error }}>*</span>
            </label>
            <input
              type="number"
              name="annual_gross_salary"
              value={basicInfoFormik.values.annual_gross_salary}
              onChange={basicInfoFormik.handleChange}
              required
              placeholder="e.g., 50000"
              className="w-full p-2 rounded-lg text-sm"
              style={{ border: `1px solid ${config.colors.input}` }}
            />
          </div>

          <Button type="submit">Create Employment</Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div
        className="p-4 rounded-lg mb-4"
        style={{ backgroundColor: config.colors.tertiary }}
      >
        <p className="text-sm" style={{ color: config.colors.secondary }}>
          This uses direct REST API calls with <code>@remoteoss/json-schema-form</code> for
          dynamic form generation. You have full control over the UI and data flow.
        </p>
      </div>

      <form onSubmit={initialFormik.handleSubmit} className="space-y-4">
        {initialFields.map((field) => (
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
                value={initialFormik.values[field.name as keyof InitialValues] as string}
                onChange={initialFormik.handleChange}
                className="w-full p-2 rounded-lg text-sm"
                style={{ border: `1px solid ${config.colors.input}` }}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={field.name}
                  checked={initialFormik.values[field.name as keyof InitialValues] as boolean}
                  onChange={initialFormik.handleChange}
                />
                <span className="text-sm" style={{ color: config.colors.secondary }}>
                  {field.label}
                </span>
              </label>
            ) : null}

            {initialFormik.touched[field.name as keyof InitialValues] &&
              initialFormik.errors[field.name as keyof InitialValues] && (
                <p className="text-xs mt-1" style={{ color: config.colors.error }}>
                  {initialFormik.errors[field.name as keyof InitialValues]}
                </p>
              )}
          </div>
        ))}

        <Button type="submit">Continue to Basic Information</Button>
      </form>
    </div>
  );
}

