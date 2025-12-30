import { useMutation, useQuery } from '@tanstack/react-query';
import { partnerApiClient } from '../../lib/api-client';

interface CompanyFormValues {
  name: string;
  company_owner_name: string;
  company_owner_email: string;
  country_code: string;
  desired_currency: string;
  terms_of_service_accepted_at: string;
  address_details?: Record<string, unknown>;
}

async function fetchCompanyJsonSchema(countryCode: string) {
  const response = await partnerApiClient.get(
    `/api/v1/companies/schema?country_code=${countryCode}&form=address_details`
  );
  return response.data;
}

async function createCompany(payload: CompanyFormValues) {
  const response = await partnerApiClient.post('/api/v1/companies', payload);
  return response.data;
}

export function useCompanyJsonSchema(countryCode: string | undefined) {
  return useQuery({
    queryKey: ['company-json-schema', countryCode],
    queryFn: () => fetchCompanyJsonSchema(countryCode!),
    select: (data) => data.data,
    enabled: !!countryCode,
  });
}

export function useCreateCompany() {
  return useMutation({
    mutationFn: createCompany,
  });
}

