import axios, { AxiosRequestConfig } from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: "http://192.168.0.204:5000", // replace with your backend IP/port
  timeout: 10000, // 10s timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (e.g., add JWT token if needed)
api.interceptors.request.use(
  (config) => {
    // Example: attach token
    // const token = "YOUR_JWT_TOKEN";
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response, // keep full response, request() will return res.data
  (error) => {
    console.error("API Error:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Generic request function
export const request = async <T = any>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: any
): Promise<T> => {
  try {
    const config: AxiosRequestConfig = { url, method, data: body };
    const res = await api(config);
    return res.data; // return only data
  } catch (err: any) {
    console.error(`API ${method} ${url} failed:`, err);
    throw err;
  }
};

export default api;
