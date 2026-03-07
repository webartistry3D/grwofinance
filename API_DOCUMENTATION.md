# Grwo Finance API Documentation

## Overview

The Grwo Finance API provides a comprehensive RESTful interface for managing personal finances, including expenses, income, categories, user authentication, and dashboard statistics. This API is built with Express.js and uses PostgreSQL for data persistence.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The API uses session-based authentication. Users must be logged in to access protected endpoints.

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully"
}
```

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
}
```

#### Logout User
```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### Get Current User
```http
GET /api/auth/user
```

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
}
```

## Expense Management

### Create Expense
```http
POST /api/expenses
```

**Request Body:**
```json
{
  "merchant": "Shoprite",
  "amount": 1500.50,
  "category": "Groceries",
  "date": "2024-01-15",
  "notes": "Weekly grocery shopping"
}
```

**Response (201):**
```json
{
  "id": "expense_id",
  "merchant": "Shoprite",
  "amount": 1500.50,
  "category": "Groceries",
  "date": "2024-01-15",
  "notes": "Weekly grocery shopping",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

### Get All Expenses
```http
GET /api/expenses
```

**Response (200):**
```json
[
  {
    "id": "expense_id",
    "merchant": "Shoprite",
    "amount": 1500.50,
    "category": "Groceries",
    "date": "2024-01-15",
    "notes": "Weekly grocery shopping",
    "userId": "user_id",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
]
```

### Get Expense by ID
```http
GET /api/expenses/{id}
```

**Response (200):**
```json
{
  "id": "expense_id",
  "merchant": "Shoprite",
  "amount": 1500.50,
  "category": "Groceries",
  "date": "2024-01-15",
  "notes": "Weekly grocery shopping",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

### Update Expense
```http
PUT /api/expenses/{id}
```

**Request Body:**
```json
{
  "merchant": "Shoprite",
  "amount": 1800.75,
  "category": "Groceries",
  "date": "2024-01-15",
  "notes": "Updated grocery shopping"
}
```

**Response (200):**
```json
{
  "id": "expense_id",
  "merchant": "Shoprite",
  "amount": 1800.75,
  "category": "Groceries",
  "date": "2024-01-15",
  "notes": "Updated grocery shopping",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

### Delete Expense
```http
DELETE /api/expenses/{id}
```

**Response (200):**
```json
{
  "message": "Expense deleted successfully"
}
```

## Income Management

### Create Income Entry
```http
POST /api/income
```

**Request Body:**
```json
{
  "description": "Monthly Salary",
  "amount": 5000.00,
  "category": "Salary",
  "date": "2024-01-15",
  "client": "ABC Company",
  "reference": "SAL-001",
  "notes": "Regular monthly salary payment"
}
```

**Response (201):**
```json
{
  "id": "income_id",
  "description": "Monthly Salary",
  "amount": 5000.00,
  "category": "Salary",
  "date": "2024-01-15",
  "client": "ABC Company",
  "reference": "SAL-001",
  "notes": "Regular monthly salary payment",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

### Get All Income Entries
```http
GET /api/income
```

**Response (200):**
```json
[
  {
    "id": "income_id",
    "description": "Monthly Salary",
    "amount": 5000.00,
    "category": "Salary",
    "date": "2024-01-15",
    "client": "ABC Company",
    "reference": "SAL-001",
    "notes": "Regular monthly salary payment",
    "userId": "user_id",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
]
```

### Update Income Entry
```http
PUT /api/income/{id}
```

**Request Body:**
```json
{
  "description": "Updated Salary",
  "amount": 5500.00,
  "category": "Salary",
  "date": "2024-01-15",
  "client": "ABC Company",
  "reference": "SAL-002",
  "notes": "Updated salary payment"
}
```

**Response (200):**
```json
{
  "id": "income_id",
  "description": "Updated Salary",
  "amount": 5500.00,
  "category": "Salary",
  "date": "2024-01-15",
  "client": "ABC Company",
  "reference": "SAL-002",
  "notes": "Updated salary payment",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

### Delete Income Entry
```http
DELETE /api/income/{id}
```

**Response (200):**
```json
{
  "message": "Income entry deleted successfully"
}
```

## Category Management

### Create Category
```http
POST /api/categories
```

**Request Body:**
```json
{
  "name": "Entertainment",
  "type": "expense"
}
```

**Response (201):**
```json
{
  "id": "category_id",
  "name": "Entertainment",
  "type": "expense",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

### Get All Categories
```http
GET /api/categories
```

**Response (200):**
```json
[
  {
    "id": "category_id",
    "name": "Entertainment",
    "type": "expense",
    "userId": "user_id",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
]
```

### Update Category
```http
PUT /api/categories/{id}
```

**Request Body:**
```json
{
  "name": "Movies & Entertainment",
  "type": "expense"
}
```

**Response (200):**
```json
{
  "id": "category_id",
  "name": "Movies & Entertainment",
  "type": "expense",
  "userId": "user_id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

### Delete Category
```http
DELETE /api/categories/{id}
```

**Response (200):**
```json
{
  "message": "Category deleted successfully"
}
```

## Dashboard Statistics

### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

**Response (200):**
```json
{
  "totalExpenses": 15000.50,
  "totalIncome": 25000.00,
  "monthlyTotal": 8000.25,
  "weeklyTotal": 2000.10
}
```

### Get Income Statistics
```http
GET /api/income/stats
```

**Response (200):**
```json
{
  "totalIncome": 25000.00,
  "monthlyTotal": 8000.25,
  "weeklyTotal": 2000.10,
  "invoicesCreated": 5
}
```

## File Upload

### Upload Receipt Image
```http
POST /api/upload-receipt
```

**Request:** `multipart/form-data` with file field named `receipt`

**Response (200):**
```json
{
  "url": "https://storage.example.com/receipts/image.jpg",
  "filename": "image.jpg",
  "size": 1024000,
  "mimeType": "image/jpeg"
}
```

## System Health

### Database Connection Test
```http
GET /api/test-db
```

**Response (200):**
```json
{
  "message": "Database connection successful"
}
```

## Error Handling

### Standard Error Response Format

**400 Bad Request:**
```json
{
  "message": "Validation error details"
}
```

**401 Unauthorized:**
```json
{
  "message": "Invalid email or password"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Internal server error"
}
```

## Data Validation

### Expense Validation Rules
- `merchant`: Required, string, max 255 characters
- `amount`: Required, number, must be positive
- `category`: Required, string, must be a valid category
- `date`: Required, string, must be a valid date format
- `notes`: Optional, string, max 1000 characters

### Income Validation Rules
- `description`: Required, string, max 255 characters
- `amount`: Required, number, must be positive
- `category`: Required, string, must be a valid income category
- `date`: Required, string, must be a valid date format
- `client`: Optional, string, max 255 characters
- `reference`: Optional, string, max 100 characters
- `notes`: Optional, string, max 1000 characters

### Category Validation Rules
- `name`: Required, string, max 255 characters
- `type`: Required, string, must be either "expense" or "income"

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse. Standard limits apply:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

## Security

- All protected endpoints require authentication
- Session-based authentication with secure cookies
- Input validation and sanitization
- SQL injection protection
- CORS enabled for cross-origin requests

## Testing

The API includes comprehensive test coverage:
- Unit tests for individual functions
- Integration tests for API endpoints
- E2E tests for complete user workflows

## Examples

### Complete Expense Management Workflow

1. **Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Create Expense:**
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"merchant":"Shoprite","amount":1500.50,"category":"Groceries","date":"2024-01-15","notes":"Weekly shopping"}'
```

3. **Get All Expenses:**
```bash
curl -X GET http://localhost:5000/api/expenses \
  -H "Cookie: session_id=your_session_id"
```

4. **Update Expense:**
```bash
curl -X PUT http://localhost:5000/api/expenses/expense_id \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=your_session_id" \
  -d '{"amount":1800.75,"notes":"Updated shopping"}'
```

5. **Delete Expense:**
```bash
curl -X DELETE http://localhost:5000/api/expenses/expense_id \
  -H "Cookie: session_id=your_session_id"
```

## Support

For API support and questions:
- Check the application logs for detailed error information
- Ensure your client is properly handling session cookies
- Verify all required fields are included in requests
- Contact the development team for additional assistance

## Version History

- **v1.0.0**: Initial API release with core functionality
- **v1.1.0**: Added income management and dashboard statistics
- **v1.2.0**: Enhanced error handling and validation
- **v1.3.0**: Added file upload capabilities and category management
