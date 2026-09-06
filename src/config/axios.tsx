import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
    // ✅ Apply CSRF settings to THIS instance
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
});
console.log("VITE_API_URL is:", import.meta.env.VITE_API_URL);

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
