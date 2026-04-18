import { useMutation, useQuery } from '@tanstack/react-query';

interface Country {
  code: string;
  name: string;
  alpha_2_code: string;
  region?: string;
  eor_onboarding?: boolean;
}

interface CompanyFormValues {
  name: string;
  company_owner_name: string;
  company_owner_email: string;
  country_code: string;
  desired_currency: string;
  terms_of_service_accepted_at: string;
  address_details?: Record<string, unknown>;
}

interface Session {
  company_id: string | null;
  user_id: string | null;
  refresh_token: string | null;
  country_code: string | null;
  created_at: string | null;
}

// Fetch list of countries from Remote API via proxy
async function fetchCountries() {
  const response = await fetch('/api/v1/countries');
  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.status}`);
  }
  return response.json();
}

// Fetch company address schema for a specific country
async function fetchCompanyJsonSchema(countryCode: string) {
  const response = await fetch(
    `/api/v1/companies/schema?country_code=${countryCode}&form=address_details`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status}`);
  }
  return response.json();
}

// Increment counter silently (no React Query cache update)
async function incrementCounterSilent() {
  try {
    await fetch('/api/counter/increment', { method: 'POST' });
  } catch (err) {
    console.error('Failed to increment counter:', err);
  }
}

// Create a new company with actions to get OAuth tokens
async function createCompany(payload: CompanyFormValues) {
  // Add actions to get OAuth tokens for the new company
  const actions = encodeURIComponent('get_oauth_access_tokens,send_create_password_email');
  const response = await fetch(`/api/v1/companies?actions=${actions}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to create company: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Extract tokens and save to session
  const company = data?.data?.company;
  const tokens = data?.data?.tokens;
  
  if (company && tokens?.refresh_token) {
    // Save session with the new company's refresh token
    await saveSession({
      company_id: company.id,
      user_id: company.company_owner_user_id,
      refresh_token: tokens.refresh_token,
      country_code: company.country_code,
    });
    console.log('[Session] Saved new company session:', company.id);
  }
  
  // Increment counter silently for next company (doesn't trigger re-render)
  incrementCounterSilent();
  
  return data;
}

// Save session to server
async function saveSession(session: { company_id: string; user_id: string; refresh_token: string; country_code?: string }) {
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  if (!response.ok) {
    console.error('Failed to save session');
  }
  return response.json();
}

// Get current session
async function fetchSession(): Promise<Session> {
  const response = await fetch('/api/session');
  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }
  return response.json();
}

/**
 * Hook to fetch available countries from Remote API
 */
export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    select: (response) => {
      // Remote API returns: { data: [...countries array...] }
      const countries: Country[] = Array.isArray(response?.data) ? response.data : [];
      
      // Sort by name and format for dropdown with searchable code + name
      return countries
        .filter(c => c.eor_onboarding === true) // Only show countries where Remote offers EOR
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((c) => ({
          value: c.code, // 3-letter code like "CAN"
          label: `${c.name} (${c.code})`, // "Canada (CAN)"
          alpha2: c.alpha_2_code, // For reference
          searchTerms: `${c.name} ${c.code} ${c.alpha_2_code}`.toLowerCase(),
        }));
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

/**
 * Hook to fetch company address schema for a country
 */
export function useCompanyJsonSchema(countryCode: string | undefined) {
  return useQuery({
    queryKey: ['company-json-schema', countryCode],
    queryFn: () => fetchCompanyJsonSchema(countryCode!),
    select: (response) => response.data,
    enabled: !!countryCode,
  });
}

/**
 * Hook to create a company
 */
export function useCreateCompany() {
  return useMutation({
    mutationFn: createCompany,
  });
}

/**
 * Hook to get current session
 */
export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    staleTime: 0, // Always fresh
  });
}

// Generate a magic link to Remote platform using session token
async function generateMagicLink(userId: string, path: string, useSessionToken: boolean = true) {
  const response = await fetch('/api/v1/magic-link', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      // Tell proxy to use session token
      'X-Use-Session-Token': useSessionToken ? 'true' : 'false',
    },
    body: JSON.stringify({
      user_id: userId,
      path: path,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to generate magic link: ${response.status}`);
  }
  return response.json();
}

/**
 * Hook to generate a magic link to Remote platform
 */
export function useMagicLink() {
  return useMutation({
    mutationFn: ({ userId, path, useSessionToken = true }: {
      userId: string;
      path: string;
      useSessionToken?: boolean;
    }) => generateMagicLink(userId, path, useSessionToken),
  });
}

/**
 * Hook to onboard an employee via a magic link to Remote's onboarding flow.
 * Wraps useMagicLink with a user_id guard and window.open on success.
 */
export function useOnboardEmployee(userId: string | null | undefined) {
  const { mutate, isPending, error } = useMagicLink();
  const onboard = () => {
    if (!userId) {
      console.error('useOnboardEmployee: no user_id on session');
      return;
    }
    mutate(
      {
        userId,
        path: '/dashboard/people/add?employmentType=full_time&entityType=remote_entity',
        useSessionToken: true,
      },
      {
        onSuccess: (d: { data?: { url?: string }; url?: string }) => {
          const url = d?.data?.url || d?.url;
          if (url) window.open(url, '_blank');
          else console.error('useOnboardEmployee: no URL in magic-link response', d);
        },
      }
    );
  };
  return { onboard, isPending, error };
}
