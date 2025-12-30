import axios from 'axios';

// API client for partner-level operations (company creation)
export const partnerApiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token for partner API calls
partnerApiClient.interceptors.request.use(
  async (request) => {
    const response = await fetch('/api/fetch-partner-token');
    const data = await response.json();
    if (data.access_token) {
      request.headers['Authorization'] = `Bearer ${data.access_token}`;
    }
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API client for customer-level operations (employment creation)
export const customerApiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token for customer API calls
customerApiClient.interceptors.request.use(
  async (request) => {
    const response = await fetch('/api/fetch-customer-token');
    const data = await response.json();
    if (data.access_token) {
      request.headers['Authorization'] = `Bearer ${data.access_token}`;
    }
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

