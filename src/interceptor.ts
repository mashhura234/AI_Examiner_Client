import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { AppConstants } from "./AppConstants";
import { navigateTo } from "./Services/navigatorService";
import { CommonService } from "./Services/commonServices";

// Extend Axios config to include optional isAuthorize
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  isAuthorize?: boolean;
}

const axiosInstance = axios.create({
  baseURL: AppConstants.APIBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // cast to our custom type to access isAuthorize
    const customConfig = config as InternalAxiosRequestConfig & CustomAxiosRequestConfig;

    const isAuthorize = customConfig.isAuthorize ?? true;

    if (isAuthorize) {
      const token = CommonService.GetUserToken();
      if (token) {
        customConfig.headers = customConfig.headers || {};
        customConfig.headers.Authorization = `Bearer ${token}`;
      }
    }

    return customConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          console.error("Bad Request:", data?.message || data);
          break;
        case 401:
          console.warn("Unauthorized - redirecting to login");
          CommonService.ClearSession();
          navigateTo("/login");
          break;
        case 403:
          console.warn("Forbidden - insufficient permissions");
          break;
        case 404:
          console.error("Not Found:", data?.message || data);
          break;
        case 500:
          console.error("Server Error:", data?.message || data);
          break;
        default:
          console.error("Unhandled error:", data?.message || data);
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;