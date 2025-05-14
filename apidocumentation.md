API Documentation
 API Documentation
 This document provides comprehensive documentation for all API endpoints in the Shopperr backend services.
 Authentication
 Authentication
 All protected endpoints require a JWT token in the Authorization header:
 Authorization: Bearer <your_jwt_token>
 User Service (Port: 8002)
 User Service (Port: 8002)
 Authentication Endpoints
 Authentication Endpoints
 Register User
 Register User
 {
 Method
 Method: POST
 URL
 URL: 
/register
 Description
 Request Body:
 Description: Register a new user
 Request Body
 "email": "user@example.com",
 "password": "securepassword",
 "customer_gender": "M",
 "customer_firstname": "John",
 "customer_lastname": "Doe",
 "customer_telephone": "+1234567890",
 "customer_secret_qu": "What is your favorite color?",
 "customer_secret_answer": "Blue",
 "customer_status": 1,
 "customer_type": 1,
 "customer_country_id": 1,
 "customer_zone_id": 1,
 "customer_company_name": "Example Corp",
 "customer_business_entity": "LLP",
 "customer_company_type": 1,
 "customer_company_address": "123 Business St",
 "customer_product_service": 1,
 "customer_main_product": "Electronics",
 "gstin_code": "GSTIN123456"
 }
 {
 Response
 Response:
 }
 "user": {
 "customer_id": 1,
 "customer_email_address": "user@example.com",
 "customer_firstname": "John",
 "customer_lastname": "Doe",
 // ... other user fields
 },
 "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
 "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
 "message": "Registration successful. Please check your email to verify your account."
 Login
 Login
 Method
 Method: POST
 URL
 URL: 
/login
 Description
 Request Body:
 Description: Authenticate user and get access token
 Request Body
{
 "email": "user@example.com",
 "password": "securepassword"
 }
 {
 Response
 Response:
 "user": {
 "customer_id": 1,
 "customer_email_address": "user@example.com",
 // ... other user fields
 },
 "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
 "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
 }
 Refresh Token
 Refresh Token
 {
 Method
 Method: POST
 URL
 URL: 
/refresh-token
 Description
 Request Body:
 Description: Get new access token using refresh token
 Request Body
 "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
 }
 {
 Response
 Response:
 "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
 }
 Reset Password
 Reset Password
 {
 Method
 Method: POST
 URL
 URL: 
/reset-password
 Description
 Request Body:
 Description: Reset user password
 Request Body
 "email": "user@example.com",
 "new_password": "newsecurepassword"
 }
 {
 Response
 Response:
 "status": "success"
 }
 Verify Email
 Verify Email
 {
 Method
 Method: GET
 URL
 URL: 
/verify-email?token=<verification_token>
 Description
 Description: Verify user email address
 Query Parameters
 Query Parameters:
 Response:
 token : Email verification token
 Response
 "message": "Email verified successfully"
 }
Order Service (Port: 8001)
 Order Service (Port: 8001)
 Order Endpoints
 Order Endpoints
 Upload Orders
 Upload Orders
 {
 Method
 Method: POST
 URL
 URL: 
/orders/upload
 Description
 Headers:
 Description: Upload orders via CSV file
 Headers
 Authorization : Bearer token
 Request Body:
 Content-Type : multipart/form-data
 Request Body
 Response:
 file : CSV file containing order data
 Response
 "message": "Orders uploaded successfully",
 "orders_processed": 10,
 "orders_failed": 0
 }
 Get Order by ID
 Get Order by ID
 {
 Method
 Method: GET
 URL
 URL: 
/orders/{order_id}
 Description
 Headers:
 Description: Get detailed information about a specific order
 Headers
 Authorization : Bearer token
 Path Parameters
 Path Parameters:
 Response:
 order_id : ID of the order
 Response
 "order_id": 1,
 "order_status": "confirmed",
 "date_purchased": "2024-03-20T10:00:00Z",
 "delivery_name": "John Doe",
 "delivery_address": "123 Main St",
 "products": [
 {
 "product_id": 1,
 "quantity": 2,
 "price": 29.99
 }
 ]
 }
 Get Confirmed Orders
 Get Confirmed Orders
 Method
 Method: GET
 URL
 URL: 
/orders/get-confirmed-orders
 Description
 Headers:
 Description: Get list of confirmed orders with filtering options
 Headers
 Authorization : Bearer token
 Query Parameters
 Query Parameters:
 from_date : Filter orders from date (YYYY-MM-DD)
 to_date : Filter orders to date (YYYY-MM-DD)
 order_search_item : Search term
 source_option : Filter by source (default: "ALL")
 store_by : Sort by field (default: "last_modified")
 page : Page number (default: 1)
 Response:
 page_size : Items per page (default: 20)
 Response
{
 "total_count": 100,
 "page": 1,
 "page_size": 20,
 "orders": [
 {
 "order_id": 1,
 "order_status": "confirmed",
 "date_purchased": "2024-03-20T10:00:00Z",
 // ... other order fields
 }
 ]
 }
 Get All Orders
 Get All Orders
 {
 Method
 Method: GET
 URL
 URL: 
/orders/get-all-orders
 Description
 Headers:
 Description: Get all orders with filtering and pagination
 Headers
 Authorization : Bearer token
 Query Parameters
 Query Parameters:
 from_date : Filter orders from date (YYYY-MM-DD)
 to_date : Filter orders to date (YYYY-MM-DD)
 order_search_item : Search term
 source_option : Filter by source (default: "ALL")
 store_by : Sort by field (default: "last_modified")
 page : Page number (default: 1)
 Response:
 page_size : Items per page (default: 20)
 Response
 "total_count": 100,
 "page": 1,
 "page_size": 20,
 "orders": [
 {
 "order_id": 1,
 "order_status": "confirmed",
 "date_purchased": "2024-03-20T10:00:00Z",
 // ... other order fields
 }
 ]
 }
 Error Responses
 Error Responses
 All endpoints may return the following error responses:
 400 Bad Request
 400 Bad Request
 {
 "detail": "Invalid input data"
 }
 401 Unauthorized
 401 Unauthorized
 {
 }
 "detail": "Invalid authentication credentials"
 403 Forbidden
 403 Forbidden
{
 "detail": "Not enough permissions"
 }
 404 Not Found
 404 Not Found
 {
 "detail": "Resource not found"
 }
 500 Internal Server Error
 500 Internal Server Error
 {
 "detail": "Internal server error"
 }
 Rate Limiting
 Rate Limiting
 API endpoints are rate-limited to prevent abuse. The current limits are:
 100 requests per minute for authenticated users
 20 requests per minute for unauthenticated users
 Pagination
 Pagination
 All list endpoints support pagination with the following parameters:
 page : Page number (starts from 1)
 page_size : Number of items per page (default: 20, max: 100)
 Sorting
 Sorting
 List endpoints support sorting using the 
store_by parameter. Available sort fields:
 last_modified : Sort by last modified date
 date_purchased : Sort by purchase date
 order_status : Sort by order status
 Filtering
 Filtering
 List endpoints support filtering using various parameters:
 from_date : Filter by start date
 to_date : Filter by end date
 order_search_item : Search in order details
 source_option : Filter by order source