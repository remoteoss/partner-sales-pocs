// Hand-off of the admin-created employment to the employee view.
// The admin flow creates an employment + sends the invite; the employee view
// (a different persona/route) needs that employmentId to mount the self-
// onboarding flow. We persist it in localStorage so the Admin↔Employee toggle
// carries it across, and so it survives a reload during a live demo.

const KEY = 'hibob-gp-employment'; // most-recently invited hire (default)
const LIST_KEY = 'hibob-gp-employments'; // one entry per country, so both DE + US hires coexist

export interface HandoffRecord {
  employmentId: string;
  countryCode: string;
  name?: string;
}

export function saveEmployment(record: HandoffRecord): void {
  localStorage.setItem(KEY, JSON.stringify(record));
  // upsert into the per-country list (latest hire per country wins)
  try {
    const list = listEmployments().filter((e) => e.countryCode !== record.countryCode);
    list.push(record);
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function readEmployment(): HandoffRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.employmentId === 'string' && parsed.employmentId) {
      return parsed as HandoffRecord;
    }
    return null;
  } catch {
    return null;
  }
}

// All invited hires, one per country. Falls back to the single latest record
// so older invites (pre-list) still show up.
export function listEmployments(): HandoffRecord[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const valid = arr.filter((e) => e && typeof e.employmentId === 'string' && e.employmentId);
        if (valid.length) return valid as HandoffRecord[];
      }
    }
  } catch {
    /* ignore */
  }
  const one = readEmployment();
  return one ? [one] : [];
}

export function clearEmployment(employmentId?: string): void {
  localStorage.removeItem(KEY);
  if (employmentId) {
    try {
      const list = listEmployments().filter((e) => e.employmentId !== employmentId);
      localStorage.setItem(LIST_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }
}
