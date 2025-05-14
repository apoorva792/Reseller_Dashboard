# Deploying to Vercel

This guide will walk you through deploying your frontend application to Vercel.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account
2. Your project pushed to a repository
3. A Vercel account (you can sign up at [vercel.com](https://vercel.com))

## Steps to Deploy

### 1. Configure Environment Variables

Before deploying, you need to set up your environment variables in Vercel:

1. Create a `.env.production` file locally with your AWS API endpoints:
   ```
   # AWS Backend URLs
   VITE_USER_SERVICE_URL=https://your-aws-api-gateway.execute-api.region.amazonaws.com/user-service
   VITE_ORDER_SERVICE_URL=https://your-aws-api-gateway.execute-api.region.amazonaws.com/order-service
   VITE_BILL_SERVICE_URL=https://your-aws-api-gateway.execute-api.region.amazonaws.com/bill-service
   
   # Other configuration
   VITE_API_TIMEOUT=30000
   ```

2. Push your code to your repository (do NOT commit the `.env.production` file)

### 2. Connect Your Repository to Vercel

1. Log in to your Vercel account
2. Click "Add New..." and select "Project"
3. Import your repository from GitHub, GitLab, or Bitbucket
4. Select the repository containing your frontend project

### 3. Configure Project Settings

1. Keep the defaults for most settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. Add Environment Variables:
   - Click on "Environment Variables"
   - Add each variable from your `.env.production` file:
     - `VITE_USER_SERVICE_URL`=`https://your-aws-api-gateway.execute-api.region.amazonaws.com/user-service`
     - `VITE_ORDER_SERVICE_URL`=`https://your-aws-api-gateway.execute-api.region.amazonaws.com/order-service`
     - `VITE_BILL_SERVICE_URL`=`https://your-aws-api-gateway.execute-api.region.amazonaws.com/bill-service`
     - `VITE_API_TIMEOUT`=`30000`

3. Click "Deploy"

### 4. Set Up Custom Domain (Optional)

1. After deployment, go to the "Domains" tab in your project settings
2. Add your custom domain and follow the instructions
3. Vercel will guide you through the process of setting up DNS records

### 5. Configure CORS on Your AWS Backend

Ensure your AWS backend allows requests from your Vercel domain:

1. For API Gateway, add your Vercel domain to the allowed origins:
   - In the API Gateway console, select your API, go to CORS configuration
   - Add your Vercel domain (e.g., `https://your-app.vercel.app`) to "Access-Control-Allow-Origin"
   - Ensure "Access-Control-Allow-Credentials" is set to "true"
   - Include all necessary headers and methods

2. Redeploy your API Gateway stage after making these changes

### 6. Continuous Deployment

Vercel automatically sets up continuous deployment:

1. Every push to your main branch will trigger a new deployment
2. Preview deployments are created for pull requests

### 7. Monitoring

1. Vercel provides analytics and monitoring tools in the dashboard
2. Check logs and performance metrics after deployment

## Troubleshooting

1. **Build Failures**: Check the build logs in Vercel for specific errors
2. **API Connection Issues**: Verify environment variables and CORS configuration
3. **Routing Problems**: Ensure the `vercel.json` configuration is correct

If you encounter persistent issues, consult the [Vercel documentation](https://vercel.com/docs) or contact their support. 