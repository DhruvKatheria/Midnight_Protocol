import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000'
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the server is unreachable 
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        // Only show offline banner if it's the actual backend failing, not a PeraWallet abort
        if (!error.config.url.includes("algorand")) {
           const banner = document.getElementById('offline-banner');
           if (banner) banner.classList.remove('hidden');
           toast.error("Backend Server is unreachable.");
        }
        return Promise.reject(error);
    }
    
    const errMessage = error.response?.data?.error || error.response?.data?.message || error.message || "An unexpected error occurred.";
    toast.error(`Error: ${errMessage}`);
    return Promise.reject(error);
  }
);

export default api;
