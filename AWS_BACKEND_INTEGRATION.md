# AWS Backend Integration Guide

This guide explains how to connect the frontend application to your AWS-hosted FastAPI backends.

## Architecture Overview

The application connects to multiple microservices running on AWS:

1. **User Service**: Authentication, user management, and profile data
2. **Order Service**: Order management and processing
3. **Billing Service**: Wallet, transactions, and billing functions

## Prerequisites

1. FastAPI backends deployed on AWS
2. API Gateway or load balancer configured
3. CORS enabled on your backend services
4. Authentication mechanism in place

## Environment Configuration

The application uses environment variables to configure API endpoints:

```
# AWS Backend URLs
VITE_USER_SERVICE_URL=https://your-aws-api-gateway.execute-api.region.amazonaws.com/user-service
VITE_ORDER_SERVICE_URL=https://your-aws-api-gateway.execute-api.region.amazonaws.com/order-service
VITE_BILL_SERVICE_URL=https://your-aws-api-gateway.execute-api.region.amazonaws.com/bill-service

# Other configuration
VITE_API_TIMEOUT=30000
```

Create the following files:
- `.env.development` - Local development settings
- `.env.production` - Production settings

## API Integration Components

### Core API Client

The `src/lib/api.ts` file contains the base API configuration:

- Axios instances for each microservice
- Authentication token handling
- Error handling and interceptors
- Base API functions for each service

### Custom Hooks

Custom React hooks in `src/hooks/` encapsulate API calls:

- `useApi.ts` - Generic API hook with loading/error states
- `useOrders.ts` - Hooks for order-related API calls
- `useWallet.ts` - Hooks for wallet and billing API calls

## Authentication Flow

1. User logs in via `/login` endpoint
2. Token stored in localStorage
3. Token added to all subsequent API requests
4. Token refresh mechanism handles expiration

## Error Handling

The application handles various error scenarios:

1. Network/CORS errors
2. Authentication failures (401)
3. Validation errors (422)
4. Server errors (5xx)

## Usage Examples

### Authentication

```typescript
import { useAuth } from '@/lib/auth';

function LoginForm() {
  const { login } = useAuth();
  
  const handleSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      // Redirect on success
    } catch (error) {
      // Handle error
    }
  };
}
```

### Fetching Orders

```typescript
import { useOrders } from '@/hooks/useOrders';

function OrdersList() {
  const { 
    orders, 
    isLoading, 
    error, 
    setFilter 
  } = useOrders();
  
  // Pagination or filtering
  const handlePageChange = (page) => {
    setFilter('page', page);
  };
}
```

### Wallet Operations

```typescript
import { useWalletBalance } from '@/hooks/useWallet';

function WalletCard() {
  const { 
    balance, 
    currency, 
    isLoading, 
    addFunds 
  } = useWalletBalance();
  
  const handleAddFunds = async (amount) => {
    try {
      await addFunds(amount, 'credit_card');
      // Show success message
    } catch (error) {
      // Handle error
    }
  };
}
```

## CORS Configuration

Configure the FastAPI backend with proper CORS headers:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Vercel Deployment

See `VERCEL_DEPLOYMENT.md` for instructions on deploying the frontend to Vercel.

## Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. Check that your AWS backend has proper CORS headers configured
2. Verify the frontend is using the correct API URLs
3. Ensure credentials are being sent correctly
4. Check that your API Gateway configuration allows OPTIONS requests

### Authentication Problems

If authentication fails:

1. Verify token format matches what the backend expects
2. Ensure tokens are being stored correctly in localStorage
3. Check that the token refresh mechanism is working

### API Connection Issues

If API calls fail:

1. Verify your AWS endpoints are accessible
2. Check that security groups allow traffic from your frontend
3. Verify API Gateway routes match your frontend expectations
4. Test API endpoints directly using tools like Postman 