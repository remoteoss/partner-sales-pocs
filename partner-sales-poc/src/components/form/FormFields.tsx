import type { ReactNode } from 'react';
import { Field as FormikField, ErrorMessage as FormikErrorMessage } from 'formik';

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

const fieldClass =
  'w-full h-9 px-3 text-sm rounded-sm border border-input bg-background text-foreground focus:outline-none focus:border-primary';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-secondary mb-1';
const descClass = 'text-[11px] mt-1 text-secondary';
const errorClass = 'text-xs mt-1 text-error';

function FieldWrapper({
  label,
  description,
  required,
  name,
  children,
}: {
  label?: string;
  description?: string;
  required?: boolean;
  name: string;
  children: ReactNode;
}) {
  return (
    <div>
      {label && (
        <label htmlFor={name} className={labelClass}>
          {label}
          {required && <span className="text-accent"> *</span>}
        </label>
      )}
      {children}
      {description && <p className={descClass}>{description}</p>}
      <FormikErrorMessage name={name}>
        {(msg) => <p className={errorClass}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

export function FieldText({ name, label, description, required }: FieldProps) {
  return (
    <FieldWrapper name={name} label={label} description={description} required={required}>
      <FormikField type="text" name={name} id={name} className={fieldClass} />
    </FieldWrapper>
  );
}

export function FieldEmail({ name, label, description, required }: FieldProps) {
  return (
    <FieldWrapper name={name} label={label} description={description} required={required}>
      <FormikField type="email" name={name} id={name} className={fieldClass} />
    </FieldWrapper>
  );
}

export function FieldNumber({ name, label, description, required }: FieldProps) {
  return (
    <FieldWrapper name={name} label={label} description={description} required={required}>
      <FormikField type="number" name={name} id={name} className={fieldClass} />
    </FieldWrapper>
  );
}

export function FieldTextarea({ name, label, description, required }: FieldProps) {
  return (
    <FieldWrapper name={name} label={label} description={description} required={required}>
      <FormikField
        as="textarea"
        name={name}
        id={name}
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-sm border border-input bg-background text-foreground focus:outline-none focus:border-primary"
      />
    </FieldWrapper>
  );
}

export function FieldSelect({ name, label, description, options, required }: FieldProps) {
  return (
    <FieldWrapper name={name} label={label} description={description} required={required}>
      <FormikField as="select" name={name} id={name} className={fieldClass}>
        <option value="">Select...</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </FormikField>
    </FieldWrapper>
  );
}

export function FieldRadio({ name, label, description, options, required }: FieldProps) {
  return (
    <div>
      {label && (
        <label className={labelClass}>
          {label}
          {required && <span className="text-accent"> *</span>}
        </label>
      )}
      {description && <p className="text-[11px] mb-2 text-secondary">{description}</p>}
      <div className="space-y-1.5">
        {options?.map((opt) => (
          <label key={opt.value} className="flex items-center text-sm text-foreground cursor-pointer">
            <FormikField type="radio" name={name} value={opt.value} className="mr-2 accent-primary" />
            {opt.label}
          </label>
        ))}
      </div>
      <FormikErrorMessage name={name}>
        {(msg) => <p className={errorClass}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

export function FieldCheckbox({ name, label, description, required }: FieldProps) {
  return (
    <div>
      <label className="flex items-center text-sm cursor-pointer text-foreground">
        <FormikField type="checkbox" name={name} className="mr-2 accent-primary" />
        <span>
          {label}
          {required && <span className="text-accent"> *</span>}
        </span>
      </label>
      {description && <p className="text-[11px] mt-1 ml-6 text-secondary">{description}</p>}
      <FormikErrorMessage name={name}>
        {(msg) => <p className={errorClass}>{msg}</p>}
      </FormikErrorMessage>
    </div>
  );
}

export function FieldDate({ name, label, description, required }: FieldProps) {
  return (
    <FieldWrapper name={name} label={label} description={description} required={required}>
      <FormikField type="date" name={name} id={name} className={fieldClass} />
    </FieldWrapper>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
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
