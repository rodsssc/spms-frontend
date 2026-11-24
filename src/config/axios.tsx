import axios from "axios";

const api = axios.create({
    // Keep API and CSRF calls on the frontend origin; Vite proxies them to Laravel.
    baseURL: import.meta.env.VITE_API_URL || window.location.origin,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: "application/json",
      
    },
    // ✅ Apply CSRF settings to THIS instance
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
});
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && window.location.pathname.startsWith("/adviser")) {
            window.location.assign("/login");
        }

        return Promise.reject(error);
    }
);

export default api;
