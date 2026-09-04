import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { useCountries } from '../company/hooks';

interface StartNewHireModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function StartNewHireModal({ open, onCancel, onConfirm }: StartNewHireModalProps) {
  const [country, setCountry] = useState('');

  const { data: countries, isLoading, error } = useCountries();

  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-secondary mb-1';
  const fieldClass =
    'w-full h-9 px-3 text-sm rounded-sm border border-input bg-background text-foreground focus:outline-none focus:border-primary';

  return (
    <Modal open={open} onClose={onCancel} title="Start a New Hire">
      <div className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="start-new-hire-country">
            Select the country you're hiring for
          </label>

          {isLoading && <Loading message="Loading countries..." />}

          {error && (
            <div className="border-l-4 border-error bg-error/5 px-4 py-2 text-xs text-error rounded-sm">
              Couldn't load countries. Please try again.
            </div>
          )}

          {!isLoading && !error && (
            <select
              id="start-new-hire-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={fieldClass}
            >
              <option value="">— Select a country —</option>
              {countries?.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
          {/* Decorative — checkbox state is intentionally not read. */}
          <input type="checkbox" className="accent-primary" />
          I only hire for this country
        </label>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border -mx-5 px-5">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="accent" onClick={onConfirm} disabled={!country || isLoading || !!error}>
            Next
          </Button>
        </div>
      </div>
    </Modal>
  );
}
