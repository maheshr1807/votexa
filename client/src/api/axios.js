import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    import('react-hot-toast').then(({ default: toast }) => {
      // Don't show toast for background /auth/me checks
      if (!error.config?.url?.includes('/auth/me')) {
        toast.error(`${message}`);
      }
    });

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (status === 403) {
      // Stale token with wrong role — clear and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
