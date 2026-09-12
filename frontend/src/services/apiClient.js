import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000, // 25s timeout to gracefully accommodate backend cold starts (Render/serverless)
});

// Request interceptor: Attach Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('veloop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to determine if an error is transient and eligible for retry
const isTransientError = (error) => {
  if (!error.response) {
    // Network drop, connection refused, or client timeout
    return true;
  }
  const status = error.response.status;
  // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout, 500 Internal Server Error
  return status >= 500 && status <= 504;
};

// Response interceptor: Extract data, handle retries, and normalize error structures
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns standardized wrapper { success: true, data: ... }, extract data
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const config = error.config;

    // Retry transient failures for GET requests or explicitly marked retryable requests
    const isGet = config?.method?.toLowerCase() === 'get';
    const isRetryable = config?.retryable === true || isGet;
    const maxRetries = config?.maxRetries ?? (isRetryable ? 3 : 0);

    if (config && isTransientError(error)) {
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < maxRetries) {
        config._retryCount += 1;
        // Progressive backoff delay: 1.5s, 3s, 4.5s
        const backoffDelay = config._retryCount * 1500;
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return apiClient(config);
      }
    }

    let message = 'Something went wrong. Please try again.';

    if (!error.response) {
      // Network drop, timeout, or server unavailable
      message = "We couldn't connect to VELOOP right now. Please check your connection and try again.";
    } else if (error.response.status === 404) {
      message = error.response.data?.message || 'The requested giveaway or resource was not found.';
    } else if (error.response.status >= 500) {
      message = 'Something went wrong on our end. Please try again later.';
    } else if (error.response.data?.message) {
      const raw = String(error.response.data.message);
      // Sanitize any technical backend exceptions
      if (
        raw.includes('Mongo') ||
        raw.includes('CastError') ||
        raw.includes('ECONN') ||
        raw.includes('500') ||
        raw.includes('Internal Server') ||
        raw.includes('undefined')
      ) {
        message = 'Something went wrong. Please try again.';
      } else {
        message = raw;
      }
    } else if (error.message && !error.message.includes('Axios') && !error.message.includes('Network Error')) {
      message = error.message;
    }

    const customError = {
      message,
      code: error.response?.data?.code || (error.response ? `HTTP_${error.response.status}` : 'NETWORK_ERROR'),
      status: error.response?.status || (error.response ? 500 : 0),
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
