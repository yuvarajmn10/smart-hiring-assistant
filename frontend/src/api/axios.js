import axios from 'axios';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    // All requests automatically go to http://localhost:5000/api
});
// Request interceptor — runs before every API call
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Automatically adds token to every request — no manual header needed
    }
    return config;
});
// Response interceptor — runs after every API response
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — log user out automatically
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
export default api;