export interface FlowErrors {
  apiError: string;
  fieldErrors: { field: string; messages: string[]; userFriendlyLabel: string }[];
}

export const emptyErrors: FlowErrors = { apiError: '', fieldErrors: [] };

export function AlertError({ errors }: { errors: FlowErrors }) {
  if (!errors.apiError && errors.fieldErrors.length === 0) return null;
  return (
    <div
      className="mt-4 rounded-lg p-3 text-sm"
      style={{
        background: 'var(--color-tertiary)',
        border: '1px solid var(--color-error)',
        color: 'var(--color-error)',
      }}
    >
      {errors.apiError && <p className="font-medium">{errors.apiError}</p>}
      {errors.fieldErrors.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {errors.fieldErrors.map((fe, i) => (
            <li key={i}>
              <strong>{fe.userFriendlyLabel}:</strong> {fe.messages.join(', ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
