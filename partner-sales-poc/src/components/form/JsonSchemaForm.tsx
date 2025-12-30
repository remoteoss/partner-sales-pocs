import { useEffect, useState, ReactNode } from 'react';
import { createHeadlessForm, modify } from '@remoteoss/json-schema-form';
import { Formik, Form as FormikForm } from 'formik';
import { fieldsMapConfig } from './FormFields';
import { Button } from '../ui/Button';
import config from '../../config/partner';

interface JsonSchemaFormProps {
  jsonSchema: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  onBack?: () => void;
  submitLabel?: string;
  initialValues?: Record<string, unknown>;
  children?: ReactNode;
}

interface FieldConfig {
  name: string;
  label?: string;
  description?: string;
  inputType: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  isVisible?: boolean;
  deprecated?: boolean;
  const?: unknown;
  default?: unknown;
  fields?: FieldConfig[];
}

// Check if a field has a forced value (const === default)
function hasForcedValue(field: FieldConfig): boolean {
  return (
    field.const !== undefined && 
    field.const === field.default && 
    !field.options
  );
}

// Get initial values for form fields
function getPrefilledValues(
  fields: FieldConfig[], 
  storedValues: Record<string, unknown> = {}
): Record<string, unknown> {
  return fields.reduce((acc, field) => {
    const initialValue = storedValues[field.name];
    if (field.inputType === 'fieldset' && field.fields) {
      return {
        ...acc,
        [field.name]: getPrefilledValues(field.fields, initialValue as Record<string, unknown>),
      };
    }
    return { ...acc, [field.name]: initialValue ?? '' };
  }, {} as Record<string, unknown>);
}

// Transform form values to JSON-compatible format
function formValuesToJsonValues(
  values: Record<string, unknown>, 
  fields: FieldConfig[]
): Record<string, unknown> {
  const fieldValueTransform: Record<string, (val: unknown) => unknown> = {
    text: (val) => val,
    number: (val) => (val === '' ? null : parseFloat(val as string)),
    money: (val) => (val === '' ? null : Number(val) * 100),
    integer: (val) => (val === '' ? null : parseInt(val as string, 10)),
    boolean: (val) => val === 'true' || val === true,
    email: (val) => val,
    textarea: (val) => val,
    select: (val) => val,
    radio: (val) => val,
    checkbox: (val) => val === true || val === 'true',
    date: (val) => val,
  };

  const jsonValues: Record<string, unknown> = {};

  fields.forEach(({ name, inputType }) => {
    const formValue = values[name];
    const transform = fieldValueTransform[inputType] || ((v) => v);
    const transformedValue = transform(formValue);

    if (
      transformedValue !== '' &&
      transformedValue !== null &&
      transformedValue !== undefined
    ) {
      jsonValues[name] = transformedValue;
    }
  });

  return jsonValues;
}

export function JsonSchemaForm({ 
  jsonSchema, 
  onSubmit, 
  onBack,
  submitLabel = 'Submit',
  initialValues: storedValues = {},
}: JsonSchemaFormProps) {
  const [modifiedSchema, setModifiedSchema] = useState<Record<string, unknown> | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Modify the schema as needed
      const { schema: modified, warnings } = modify(jsonSchema, {
        fields: {},
      });

      setModifiedSchema(modified);
      setSchemaError(null);

      if (warnings && warnings.length) {
        console.warn('Schema modification warnings:', warnings);
      }
    } catch (err) {
      console.error('Error modifying schema:', err);
      setSchemaError((err as Error).message);
    }
  }, [jsonSchema]);

  if (schemaError) {
    return (
      <div className="p-4 rounded-lg" style={{ backgroundColor: `${config.colors.error}10` }}>
        <p className="text-sm" style={{ color: config.colors.error }}>
          Error loading form schema: {schemaError}
        </p>
      </div>
    );
  }

  if (!modifiedSchema) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 rounded-full" 
          style={{ borderColor: config.colors.primary, borderTopColor: 'transparent' }} 
        />
        <span className="ml-2 text-sm" style={{ color: config.colors.secondary }}>
          Loading form...
        </span>
      </div>
    );
  }

  const { fields, handleValidation } = createHeadlessForm(modifiedSchema, {
    initialValues: storedValues,
  });

  const formInitialValues = getPrefilledValues(fields, storedValues as Record<string, unknown>);

  function handleValidate(formValues: Record<string, unknown>) {
    const jsonValues = formValuesToJsonValues(formValues, fields);
    const { formErrors } = handleValidation(jsonValues);
    return formErrors;
  }

  function handleFormSubmit(formValues: Record<string, unknown>) {
    const jsonValues = formValuesToJsonValues(formValues, fields);
    console.log('Form submitted:', jsonValues);
    onSubmit(jsonValues);
  }

  return (
    <Formik
      initialValues={formInitialValues}
      validate={handleValidate}
      onSubmit={handleFormSubmit}
    >
      {({ isSubmitting }) => (
        <FormikForm className="space-y-4">
          {fields.map((field: FieldConfig) => {
            // Skip hidden, invisible, or deprecated fields
            if (field.isVisible === false || field.deprecated) {
              return null;
            }

            // Skip fields with forced values
            if (hasForcedValue(field)) {
              return null;
            }

            const FieldComponent = fieldsMapConfig[field.inputType];

            if (!FieldComponent) {
              console.warn(`Unsupported field type: ${field.inputType}`);
              return (
                <div key={field.name} className="p-2 rounded text-xs" style={{ backgroundColor: config.colors.tertiary }}>
                  Unsupported field type: {field.inputType} ({field.name})
                </div>
              );
            }

            return (
              <FieldComponent
                key={field.name}
                name={field.name}
                label={field.label}
                description={field.description}
                inputType={field.inputType}
                options={field.options}
                required={field.required}
              />
            );
          })}

          <div className="flex gap-2 pt-4">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : submitLabel}
            </Button>
          </div>
        </FormikForm>
      )}
    </Formik>
  );
}

