// src/utils/api.ts

import axios from 'axios';
import { toast } from 'sonner';

// API Base URLs from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jh6x5iq1s9.execute-api.ap-southeast-2.amazonaws.com/dev';
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || `${API_BASE_URL}/user`;
const ORDER_SERVICE_URL = import.meta.env.VITE_ORDER_SERVICE_URL || API_BASE_URL;
const BILL_SERVICE_URL = import.meta.env.VITE_BILL_SERVICE_URL || API_BASE_URL;
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

console.log('API Services configuration:');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`User Service: ${USER_SERVICE_URL}`);
console.log(`Order Service: ${ORDER_SERVICE_URL}`);
console.log(`Bill Service: ${BILL_SERVICE_URL}`);
console.log(`API Timeout: ${API_TIMEOUT}ms`);

// Common axios config
const axiosConfig = {
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Create axios instances for each service
const userApi = axios.create({
  ...axiosConfig,
  baseURL: USER_SERVICE_URL
});

const orderApiClient = axios.create({
  ...axiosConfig,
  baseURL: ORDER_SERVICE_URL
});

// Add request interceptor for bill API
const billApiClient = axios.create({
  ...axiosConfig,
  baseURL: BILL_SERVICE_URL
});

// Add request interceptor to include authentication token for both APIs
const addAuthToken = (config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
};

// Add request interceptor for order API
orderApiClient.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));

// Add request interceptor for user API
userApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));

// Add request interceptor for bill API
billApiClient.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));

// Add request debug interceptor
const requestDebugInterceptor = (config) => {
  // Log request for debugging
  console.log('Request:', {
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers
  });
  return config;
};

userApi.interceptors.request.use(requestDebugInterceptor);
orderApiClient.interceptors.request.use(requestDebugInterceptor);
billApiClient.interceptors.request.use(requestDebugInterceptor);

// Add response interceptor for debugging
const responseSuccessInterceptor = (response) => {
  console.log('Response:', response.data);
  return response;
};

const responseErrorInterceptor = (error) => {
  // Network errors won't have a response
  if (!error.response) {
    console.error('Network Error:', error.message);
    toast.error(`Network error: ${error.message}. Please check your connection.`);
    return Promise.reject(error);
  }

  console.error('Response Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });
  
  // Handle CORS errors
  if (error.message.includes('Network Error') || error.message.includes('CORS')) {
    toast.error('CORS Error: Unable to connect to the backend service. Please check CORS configuration.');
    console.error('This may be a CORS issue. Make sure your AWS backend has proper CORS headers configured.');
  }
  
  // Handle authentication errors (401)
  else if (error.response?.status === 401) {
    // Clear tokens and redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    toast.error('Your session has expired. Please log in again.');
    
    // If not already on the login page, redirect
    if (window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login';
    }
  }
  
  // Handle validation errors (422)
  else if (error.response?.status === 422) {
    const errorDetails = error.response.data?.detail || 'Validation error';
    toast.error(`Validation error: ${errorDetails}`);
  }
  
  // Handle server errors (5xx)
  else if (error.response?.status >= 500) {
    toast.error('Server error. Our team has been notified.');
  }
  
  // Handle other errors
  else {
    const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
    toast.error(`Error: ${errorMsg}`);
  }
  
  return Promise.reject(error);
};

userApi.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);
orderApiClient.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);
billApiClient.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);

// Auth API functions
export const authApi = {
  register: async (userData) => {
    try {
      console.log('Registration request payload:', JSON.stringify(userData, null, 2));
      
      // Check for required fields based on API docs
      const requiredFields = [
        'customer_email_address', 'customer_password', 'customer_gender', 'customer_firstname', 
        'customer_lastname', 'customer_telephone', 'customer_secret_qu', 
        'customer_secret_answer', 'customer_status', 'customer_type',
        'customer_country_id', 'customer_zone_id', 'customer_company_name',
        'customer_business_entity', 'customer_company_type', 'customer_company_address',
        'customer_product_service', 'customer_main_product', 'gstin_code'
      ];
      
      const missingFields = requiredFields.filter(field => userData[field] === undefined || userData[field] === null || userData[field] === '');
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Explicitly set content-type to ensure proper JSON serialization
      const response = await userApi.post('/register', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Registration response:', response.data);
      toast.success('Registration successful! Please check your email to verify your account.');
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error);
      
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: JSON.stringify(error.response.data, null, 2)
        });
        
        if (error.response.status === 422) {
          // Validation error
          const detail = error.response.data?.detail;
          if (Array.isArray(detail)) {
            const errorsText = detail.map(err => 
              typeof err === 'string' ? err : JSON.stringify(err)
            ).join(', ');
            toast.error(`Validation error: ${errorsText}`);
          } else if (typeof detail === 'string') {
            toast.error(`Validation error: ${detail}`);
          } else if (detail) {
            toast.error(`Validation error: ${JSON.stringify(detail)}`);
          } else if (typeof error.response.data === 'object') {
            // Some APIs return field-specific errors without a "detail" key
            const errorMessage = Object.entries(error.response.data)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(', ');
            toast.error(`Validation errors: ${errorMessage}`);
          } else {
            toast.error(`Validation error: ${JSON.stringify(error.response.data || 'Unknown validation error')}`);
          }
        } else {
          toast.error(`Registration failed (${error.response.status}): ${error.response.data?.detail || error.response.statusText || 'Unknown error'}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('No response received from the server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        toast.error(`Request error: ${error.message}`);
      }
      
      throw error;
    }
  },

  login: async ({ email, password }) => {
    try {
      console.log('Attempting login for:', email);
      const response = await userApi.post('/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please check your credentials and try again.');
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    toast.info('You have been logged out.');
  },
  
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await userApi.post('/refresh-token', { refresh_token: refreshToken });
      const { access_token } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      
      return access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, log the user out
      authApi.logout();
      throw error;
    }
  },
  
  resetPassword: async ({ email, new_password }) => {
    try {
      const response = await userApi.post('/reset-password', { 
        email, 
        new_password 
      });
      
      toast.success('Password reset successful. Please login with your new password.');
      return response.data;
    } catch (error) {
      console.error('Password reset failed:', error);
      toast.error('Password reset failed. Please try again.');
      throw error;
    }
  },
  
  verifyEmail: async (token) => {
    try {
      const response = await userApi.get(`/verify-email?token=${token}`);
      toast.success('Email verification successful! You can now log in.');
      return response.data;
    } catch (error) {
      console.error('Email verification failed:', error);
      toast.error('Email verification failed. Please try again or contact support.');
      throw error;
    }
  }
};

// Order API functions
export const orderApi = {
  getAllOrders: async (filters: any = {}) => {
    try {
      // Convert frontend filter names to what backend expects
      const params = {
        page: filters.page || 1,
        page_size: filters.page_size || 20,
        // Only include non-empty filters
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date }),
        ...(filters.order_search_item && { order_search_item: filters.order_search_item }),
        ...(filters.source_option && filters.source_option !== "All" && { source_option: filters.source_option }),
        // Add sort option
        store_by: filters.store_by || "last_modified"
      };
      
      const response = await orderApiClient.get('/orders/get-all-orders', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch all orders:', error);
      if (error.response) {
        console.error('Error details:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  getOrderById: async (orderId: string) => {
    try {
      console.log(`Fetching order details for order ID: ${orderId}`);
      
      // First try to get all orders
      const url = `${API_BASE_URL}/orders`;
      console.log(`Making request to: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT
      });
      
      console.log(`All orders response:`, response.data);
      
      // If we got a list of orders, find the specific order
      if (response.data && Array.isArray(response.data.orders)) {
        const order = response.data.orders.find(order => 
          order.order_id.toString() === orderId.toString() || 
          order.order_serial === orderId.toString());
        
        if (order) {
          console.log(`Found order details:`, order);
          return order;
        } else {
          throw new Error(`Order with ID ${orderId} not found in the list of orders`);
        }
      } else {
        // If the response is not a list, it might be a single order already
        return response.data;
      }
    } catch (error) {
      console.error(`Failed to fetch order details for order ${orderId}:`, error);
      // Show a user-friendly error message with more details
      let errorMessage = 'Could not retrieve order details.';
      if (error.response) {
        errorMessage += ` Server responded with ${error.response.status}: ${error.response.data?.detail || error.response.statusText}`;
        console.error('Error response:', error.response);
      } else if (error.request) {
        errorMessage += ' No response received from server.';
      } else {
        errorMessage += ` ${error.message}`;
      }
      toast.error(errorMessage);
      throw error;
    }
  },
  
  getConfirmedOrders: async (filters: any = {}) => {
    try {
      const params = {
        page: filters.page || 1,
        page_size: filters.page_size || 20,
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date }),
      };
      
      const response = await orderApiClient.get('/orders/get-confirmed-orders', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch confirmed orders:', error);
      throw error;
    }
  },
  
  getUnshippedOrders: async (filters: any = {}) => {
    try {
      const params = {
        page: filters.page || 1,
        page_size: filters.page_size || 20,
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date }),
      };
      
      const response = await orderApiClient.get('/orders/get-unshipped-orders', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch unshipped orders:', error);
      throw error;
    }
  },
  
  getOrderDetails: async (orderId: string) => {
    try {
      console.log(`Fetching order details for order ID: ${orderId}`);
      
      // Try multiple endpoint formats in sequence
      const endpoints = [
        `/orders/get-all-orders`, // Try the documented endpoint first
        `/orders`,                // Try the base endpoint
      ];
      
      let error = null;
      
      // Try each endpoint in sequence
      for (const endpoint of endpoints) {
        try {
          const url = `${API_BASE_URL}${endpoint}`;
          console.log(`Attempting request to: ${url}`);
          
          const response = await axios.get(url, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            },
            timeout: API_TIMEOUT,
            params: {
              // Add query parameters for filtering if this is a list endpoint
              order_id: orderId
            }
          });
          
          console.log(`Response from ${endpoint}:`, response.data);
          
          // If we got a list of orders, find the specific order
          if (response.data && (Array.isArray(response.data.orders) || Array.isArray(response.data))) {
            const orders = Array.isArray(response.data.orders) ? response.data.orders : response.data;
            const order = orders.find(order => 
              order.order_id.toString() === orderId.toString() || 
              order.order_serial === orderId.toString());
            
            if (order) {
              console.log(`Found order details:`, order);
              return order;
            }
          } else if (response.data && response.data.order_id) {
            // If it's a single order
            return response.data;
          }
        } catch (e) {
          console.error(`Error trying endpoint ${endpoint}:`, e);
          error = e;
          // Continue to the next endpoint
        }
      }
      
      // If we get here, all endpoints failed
      throw error || new Error(`Failed to fetch order details after trying all endpoints`);
    } catch (error) {
      console.error(`Failed to fetch order details for order ${orderId}:`, error);
      // Show a user-friendly error message with more details
      let errorMessage = 'Could not retrieve order details.';
      if (error.response) {
        errorMessage += ` Server responded with ${error.response.status}: ${error.response.data?.detail || error.response.statusText}`;
        console.error('Error response:', error.response);
      } else if (error.request) {
        errorMessage += ' No response received from server.';
      } else {
        errorMessage += ` ${error.message}`;
      }
      toast.error(errorMessage);
      throw error;
    }
  },
  
  uploadOrders: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await orderApiClient.post('/orders/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success(`Orders uploaded successfully. Processed: ${response.data.orders_processed}`);
      return response.data;
    } catch (error) {
      console.error('Failed to upload orders:', error);
      toast.error('Failed to upload orders. Please try again.');
      throw error;
    }
  }
};

// Bill API functions
export const billApi = {
  getBillingHistory: async (filters: any = {}) => {
    try {
      const params = {
        page: filters.page || 1,
        page_size: filters.page_size || 20,
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date }),
      };
      
      const response = await billApiClient.get('/billing/history', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
      throw error;
    }
  },
  
  getWalletBalance: async () => {
    try {
      const response = await billApiClient.get('/wallet/balance');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      throw error;
    }
  },
  
  addFunds: async (amount: number, paymentMethod: string) => {
    try {
      const response = await billApiClient.post('/wallet/add-funds', {
        amount,
        payment_method: paymentMethod
      });
      toast.success(`Successfully added ${amount} to your wallet.`);
      return response.data;
    } catch (error) {
      console.error('Failed to add funds to wallet:', error);
      toast.error('Failed to add funds to your wallet. Please try again.');
      throw error;
    }
  },

  // New Bill API functions
  getAllBills: async (orderId?: number) => {
    try {
      console.log('Making API call to get all bills');
      // Log full API URL for debugging
      const url = `${API_BASE_URL}/user/bills/`;
      console.log('API URL:', url);
      
      const token = localStorage.getItem('accessToken');
      console.log('Using token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token found');
      
      const params = orderId ? { order_id: orderId } : {};
      const response = await axios.get(url, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT
      });
      
      console.log('Bills API response:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received from server. CORS issue?');
      }
      toast.error('Failed to load billing information. Please try again.');
      throw error;
    }
  },

  getBillById: async (billId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/bills/${billId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch bill details for bill ${billId}:`, error);
      toast.error('Failed to load bill details. Please try again.');
      throw error;
    }
  },

  createBill: async (billData: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/user/bills/`, billData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT
      });
      toast.success('Bill created successfully.');
      return response.data;
    } catch (error) {
      console.error('Failed to create bill:', error);
      toast.error('Failed to create bill. Please try again.');
      throw error;
    }
  },

  updateBill: async (billId: number, updateData: any) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/user/bills/${billId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT
      });
      toast.success('Bill updated successfully.');
      return response.data;
    } catch (error) {
      console.error(`Failed to update bill ${billId}:`, error);
      toast.error('Failed to update bill. Please try again.');
      throw error;
    }
  }
};
