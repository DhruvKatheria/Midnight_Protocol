import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000'
});

// Track last error time to prevent toast spam
let lastNetworkErrorTime = 0;

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Skip errors from PeraWallet or cancelled requests
    if (error.config?.url?.includes("algorand") || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    // Actual network failure (server unreachable)
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      const now = Date.now();
      // Only show one "unreachable" toast per 5 seconds to avoid spam
      if (now - lastNetworkErrorTime > 5000) {
        lastNetworkErrorTime = now;
        toast.error("Backend Server is unreachable.", { id: 'network-error' });
      }
      return Promise.reject(error);
    }

    // 404s — silently reject (don't toast for missing endpoints)
    if (error.response?.status === 404) {
      return Promise.reject(error);
    }
    
    // Other API errors — show specific message (deduplicated)
    const errMessage = error.response?.data?.error || error.response?.data?.message || error.message || "An unexpected error occurred.";
    toast.error(errMessage, { id: `api-err-${error.response?.status || 'unknown'}` });
    return Promise.reject(error);
  }
);

export default api;
