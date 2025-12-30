import { Field as FormikField, ErrorMessage as FormikErrorMessage } from 'formik';
import config from '../../config/partner';

interface FieldProps {
  name: string;
  label?: string;
  description?: string;
  type?: string;
  inputType?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  meta?: Record<string, unknown>;
}

// Text input field
export function FieldText({ name, label, description, required }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
        {label}
        {required && <span style={{ color: config.colors.error }}> *</span>}
      </label>
      <FormikField
        type="text"
        name={name}
        id={name}
        className="w-full p-2 rounded-lg text-sm"
        style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
      />
      {description && (
        <p className="text-xs mt-1" style={{ color: config.colors.secondary }}>{description}</p>
      )}
      <FormikErrorMessage name={name}>
        {(msg) => <p className="text-xs mt-1" style={{ color: config.colors.error }}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

// Email input field
export function FieldEmail({ name, label, description, required }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
        {label}
        {required && <span style={{ color: config.colors.error }}> *</span>}
      </label>
      <FormikField
        type="email"
        name={name}
        id={name}
        className="w-full p-2 rounded-lg text-sm"
        style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
      />
      {description && (
        <p className="text-xs mt-1" style={{ color: config.colors.secondary }}>{description}</p>
      )}
      <FormikErrorMessage name={name}>
        {(msg) => <p className="text-xs mt-1" style={{ color: config.colors.error }}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

// Number input field
export function FieldNumber({ name, label, description, required }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
        {label}
        {required && <span style={{ color: config.colors.error }}> *</span>}
      </label>
      <FormikField
        type="number"
        name={name}
        id={name}
        className="w-full p-2 rounded-lg text-sm"
        style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
      />
      {description && (
        <p className="text-xs mt-1" style={{ color: config.colors.secondary }}>{description}</p>
      )}
      <FormikErrorMessage name={name}>
        {(msg) => <p className="text-xs mt-1" style={{ color: config.colors.error }}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

// Textarea field
export function FieldTextarea({ name, label, description, required }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
        {label}
        {required && <span style={{ color: config.colors.error }}> *</span>}
      </label>
      <FormikField
        as="textarea"
        name={name}
        id={name}
        rows={3}
        className="w-full p-2 rounded-lg text-sm"
        style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
      />
      {description && (
        <p className="text-xs mt-1" style={{ color: config.colors.secondary }}>{description}</p>
      )}
      <FormikErrorMessage name={name}>
        {(msg) => <p className="text-xs mt-1" style={{ color: config.colors.error }}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

// Select dropdown field
export function FieldSelect({ name, label, description, options, required }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
        {label}
        {required && <span style={{ color: config.colors.error }}> *</span>}
      </label>
      <FormikField
        as="select"
        name={name}
        id={name}
        className="w-full p-2 rounded-lg text-sm"
        style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
      >
        <option value="">Select...</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </FormikField>
      {description && (
        <p className="text-xs mt-1" style={{ color: config.colors.secondary }}>{description}</p>
      )}
      <FormikErrorMessage name={name}>
        {(msg) => <p className="text-xs mt-1" style={{ color: config.colors.error }}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

// Radio button field
export function FieldRadio({ name, label, description, options, required }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2" style={{ color: config.colors.foreground }}>
        {label}
        {required && <span style={{ color: config.colors.error }}> *</span>}
      </label>
      {description && (
        <p className="text-xs mb-2" style={{ color: config.colors.secondary }}>{description}</p>
      )}
      <div className="space-y-2">
        {options?.map((opt) => (
          <label key={opt.value} className="flex items-center text-sm cursor-pointer">
            <FormikField
              type="radio"
              name={name}
              value={opt.value}
              className="mr-2"
            />
            {opt.label}
          </label>
        ))}
      </div>
      <FormikErrorMessage name={name}>
        {(msg) => <p className="text-xs mt-1" style={{ color: config.colors.error }}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

// Checkbox field
export function FieldCheckbox({ name, label, description, required }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="flex items-center text-sm cursor-pointer">
        <FormikField
          type="checkbox"
          name={name}
          className="mr-2"
        />
        <span style={{ color: config.colors.foreground }}>
          {label}
          {required && <span style={{ color: config.colors.error }}> *</span>}
        </span>
      </label>
      {description && (
        <p className="text-xs mt-1 ml-6" style={{ color: config.colors.secondary }}>{description}</p>
      )}
      <FormikErrorMessage name={name}>
        {(msg) => <p className="text-xs mt-1" style={{ color: config.colors.error }}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

// Date field
export function FieldDate({ name, label, description, required }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: config.colors.foreground }}>
        {label}
        {required && <span style={{ color: config.colors.error }}> *</span>}
      </label>
      <FormikField
        type="date"
        name={name}
        id={name}
        className="w-full p-2 rounded-lg text-sm"
        style={{ border: `1px solid ${config.colors.input}`, backgroundColor: config.colors.background }}
      />
      {description && (
        <p className="text-xs mt-1" style={{ color: config.colors.secondary }}>{description}</p>
      )}
      <FormikErrorMessage name={name}>
        {(msg) => <p className="text-xs mt-1" style={{ color: config.colors.error }}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

// Field type mapping
export const fieldsMapConfig: Record<string, React.ComponentType<FieldProps>> = {
  text: FieldText,
  email: FieldEmail,
  number: FieldNumber,
  money: FieldNumber,
  integer: FieldNumber,
  textarea: FieldTextarea,
  select: FieldSelect,
  radio: FieldRadio,
  checkbox: FieldCheckbox,
  date: FieldDate,
  countries: FieldSelect,
};

