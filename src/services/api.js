import axios from "axios";

// NEW DOMAIN - Always use this in production
const NEW_DOMAIN = 'https://servecheckpos.store/api';

// Determine the API base URL based on environment
const getApiBaseURL = () => {
  
  // If explicitly set via environment variable, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL.trim();

    // CRITICAL FIX: Auto-convert HTTP to HTTPS in production
    // If server has SSL installed, we should use HTTPS
    if (process.env.NODE_ENV === "production" && apiUrl.startsWith("http://")) {
      // Convert HTTP to HTTPS automatically
      apiUrl = apiUrl.replace("http://", "https://");
      // Only warn at runtime (client-side), not during build
      if (typeof window !== "undefined") {
        console.warn(
          "⚠️ Auto-converted HTTP to HTTPS for production!\n" +
            `Original: ${process.env.NEXT_PUBLIC_API_URL}\n` +
            `Using: ${apiUrl}\n` +
            "If your server has SSL installed, this should work.\n" +
            "If not, set NEXT_PUBLIC_API_URL to HTTPS URL in AWS Amplify."
        );
      }
    }

    // Log the API URL being used (for debugging) - only at runtime
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== "undefined"
    ) {
      console.log("🔗 API Base URL:", apiUrl);
    }

    return apiUrl;
  }

  // In production (AWS Amplify), use fallback URL during build, warn at runtime
  if (process.env.NODE_ENV === "production") {
    // During build time (server-side), use fallback to allow build to complete
    if (typeof window === "undefined") {
      // Build time: use fallback URL (will be overridden by env var in Amplify)
      return NEW_DOMAIN;
    }

    // Runtime (client-side): warn but don't throw - use fallback
    const warningMsg =
      "⚠️ WARNING: NEXT_PUBLIC_API_URL environment variable is not set!\n\n" +
      `Using fallback URL: ${NEW_DOMAIN}\n\n` +
      "To fix this:\n" +
      "1. Go to AWS Amplify Console\n" +
      "2. Select your app → App settings → Environment variables\n" +
      `3. Add: NEXT_PUBLIC_API_URL = ${NEW_DOMAIN}\n` +
      "4. Rebuild your Amplify app";

    console.warn(warningMsg);
    return NEW_DOMAIN;
  }

  // In development, use the local API server
  // Next.js will proxy /api to localhost:8000/api in development
  const devUrl = "/api";
  
  // Log in development for debugging
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    console.log("🔧 Development Mode - API Base URL:", devUrl);
    console.log("📝 Make sure Laravel server is running on http://127.0.0.1:8000");
    console.log("📝 Next.js will proxy /api/* to http://127.0.0.1:8000/api/*");
  }
  
  return devUrl;
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token and handle FormData
api.interceptors.request.use(
  (config) => {
    // Log the full URL being called (for debugging)
    if (typeof window !== "undefined") {
      const fullUrl = config.baseURL + (config.url || '');
      if (process.env.NODE_ENV === "production") {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
      } else {
        // In development, show the proxied URL
        console.log(`🔧 Dev API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
        console.log(`   → Proxied to: http://127.0.0.1:8000${config.url || ''}`);
      }
    }

    // Client-side only - check localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // If data is FormData, remove Content-Type header to let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
