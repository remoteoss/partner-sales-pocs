import { useMutation, useQuery } from '@tanstack/react-query';
import { customerApiClient } from '../../../lib/api-client';

interface CreateEmploymentPayload {
  country_code: string;
  type: 'employee' | 'contractor';
  basic_information: Record<string, unknown>;
}

interface UpdateEmploymentPayload {
  contract_details?: Record<string, unknown>;
  pricing_plan_details?: {
    frequency: string;
  };
}

async function fetchBasicInformationSchema(countryCode: string) {
  const response = await customerApiClient.get(
    `/api/v1/countries/${countryCode}/employment_basic_information`
  );
  return response.data;
}

async function fetchContractDetailsSchema(countryCode: string) {
  const response = await customerApiClient.get(
    `/api/v1/countries/${countryCode}/contract_details`
  );
  return response.data;
}

async function createEmployment(payload: CreateEmploymentPayload) {
  const response = await customerApiClient.post('/api/v1/employments', payload);
  return response.data;
}

async function updateEmployment(employmentId: string, payload: UpdateEmploymentPayload) {
  const response = await customerApiClient.patch(`/api/v1/employments/${employmentId}`, payload);
  return response.data;
}

async function sendEmploymentInvite(employmentId: string) {
  const response = await customerApiClient.post(`/api/v1/employments/${employmentId}/invite`);
  return response.data;
}

export function useBasicInformationSchema(countryCode: string | undefined) {
  return useQuery({
    queryKey: ['employment-basic-info-schema', countryCode],
    queryFn: () => fetchBasicInformationSchema(countryCode!),
    select: (data) => data.data,
    enabled: !!countryCode,
  });
}

export function useContractDetailsSchema(countryCode: string | undefined, employmentId: string | undefined) {
  return useQuery({
    queryKey: ['employment-contract-schema', countryCode],
    queryFn: () => fetchContractDetailsSchema(countryCode!),
    select: (data) => data.data,
    enabled: !!countryCode && !!employmentId,
  });
}

export function useCreateEmployment(options?: { onSuccess?: (data: unknown) => void }) {
  return useMutation({
    mutationFn: createEmployment,
    ...options,
  });
}

export function useUpdateEmployment(employmentId: string, options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (payload: UpdateEmploymentPayload) => updateEmployment(employmentId, payload),
    ...options,
  });
}

export function useEmploymentInvite(employmentId: string, options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: () => sendEmploymentInvite(employmentId),
    ...options,
  });
}

