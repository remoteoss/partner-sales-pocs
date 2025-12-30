import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Counter {
  value: number;
}

async function fetchCounter(): Promise<Counter> {
  const response = await fetch('/api/counter');
  if (!response.ok) {
    throw new Error('Failed to fetch counter');
  }
  return response.json();
}

async function incrementCounterApi(): Promise<Counter> {
  const response = await fetch('/api/counter/increment', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to increment counter');
  }
  return response.json();
}

async function resetCounterApi(): Promise<Counter> {
  const response = await fetch('/api/counter/reset', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to reset counter');
  }
  return response.json();
}

export function useCounter() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['counter'],
    queryFn: fetchCounter,
    staleTime: 0, // Always fetch fresh
  });

  const incrementMutation = useMutation({
    mutationFn: incrementCounterApi,
    onSuccess: (newCounter) => {
      queryClient.setQueryData(['counter'], newCounter);
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetCounterApi,
    onSuccess: (newCounter) => {
      queryClient.setQueryData(['counter'], newCounter);
    },
  });

  return {
    counter: data?.value ?? 1,
    isLoading,
    error,
    increment: incrementMutation.mutate,
    reset: resetMutation.mutate,
  };
}

// Generate default form values based on counter
export function getDefaultCompanyValues(counter: number) {
  return {
    name: `Partner Test ${counter}`,
    tax_number: `PartnerTest${counter}`,
    company_owner_name: `Partner Test Name ${counter}`,
    company_owner_email: `mohit.mahindroo+partnertest${counter}@remote.com`,
    country_code: 'CAN',
    desired_currency: 'CAD',
  };
}

// Generate default employee form values based on counter
export function getDefaultEmployeeValues(counter: number) {
  // Calculate a provisional start date 30 days from now
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 30);
  const provisionalStartDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  return {
    // Basic Information - universal fields that work across all countries
    name: `Test Employee ${counter}`,
    email: `mohit.mahindroo+TestEmployee${counter}@remote.com`, // Personal email
    job_title: `Engineer ${counter}`,
    provisional_start_date: provisionalStartDate,
    
    // Seniority - 'no' means no prior seniority date
    has_seniority_date: 'no',
  };
}

