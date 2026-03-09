# WCMS API Documentation

## REST API Reference Guide
Version 1.0

---

## Base URL

```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

---

## Authentication

All API endpoints (except login) require JWT authentication.

### Headers Required

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "username": "admin",
      "full_name": "System Administrator",
      "email": "admin@mescom.in",
      "role": "ADMIN",
      "committee_id": 1,
      "committee_name": "Central Executive Committee",
      "committee_type": "CEC"
    }
  }
}
```

---

## API Endpoints

### Authentication Endpoints

#### Login
- **POST** `/auth/login`
- **Body**: `{ username, password }`
- **Response**: JWT token and user details

#### Logout
- **POST** `/auth/logout`
- **Auth**: Required
- **Response**: Success message

#### Change Password
- **POST** `/auth/change-password`
- **Auth**: Required
- **Body**: `{ currentPassword, newPassword }`

#### Get Profile
- **GET** `/auth/profile`
- **Auth**: Required
- **Response**: Current user details

---

### Member Endpoints

#### Get All Members
```http
GET /members
```

**Query Parameters:**
- `committee_id` (optional): Filter by committee
- `status` (optional): Active, Transferred, Retired, Inactive
- `search` (optional): Search by name, member code, or employee ID

**Response:**
```json
{
  "success": true,
  "count": 150,
  "data": [
    {
      "member_id": 1,
      "member_code": "MEM-001",
      "full_name": "Rajesh Kumar",
      "employee_id": "EMP001",
      "committee_id": 9,
      "committee_name": "Division 1A1 Executive Committee",
      "committee_type": "DEC",
      "contact_email": "rajesh@mescom.in",
      "contact_phone": "9988776655",
      "status": "Active",
      "total_contributions": 36000.00,
      "total_withdrawals": 0.00,
      "current_balance": 36000.00,
      "date_of_joining": "2015-01-15"
    }
  ]
}
```

#### Get Member by ID
```http
GET /members/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "member_id": 1,
    "member_code": "MEM-001",
    "full_name": "Rajesh Kumar",
    "current_balance": 36000.00,
    "recent_deductions": [
      {
        "deduction_month": "2026-01-01",
        "deduction_amount": 500.00,
        "status": "Approved"
      }
    ]
  }
}
```

#### Create Member
```http
POST /members
```

**Auth**: ZEC_USER or higher

**Body:**
```json
{
  "member_code": "MEM-150",
  "full_name": "New Member Name",
  "employee_id": "EMP150",
  "committee_id": 9,
  "contact_email": "member@mescom.in",
  "contact_phone": "9876543210",
  "date_of_joining": "2026-02-01"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Member created successfully",
  "data": {
    "id": 150,
    "member_code": "MEM-150"
  }
}
```

#### Update Member
```http
PUT /members/:id
```

**Body:**
```json
{
  "full_name": "Updated Name",
  "contact_email": "newemail@mescom.in",
  "contact_phone": "9999999999",
  "status": "Active"
}
```

#### Bulk Import Members
```http
POST /members/bulk-import
```

**Auth**: CEC or ADMIN

**Content-Type**: `multipart/form-data`

**Form Data:**
- `file`: Excel file (.xlsx)

**Response:**
```json
{
  "success": true,
  "message": "Imported 50 members",
  "data": {
    "inserted": 50,
    "errors": 2,
    "errorDetails": [
      {
        "row": { "member_code": "MEM-XXX" },
        "error": "Member code already exists"
      }
    ]
  }
}
```

---

### Deduction Endpoints

#### Get All Deductions
```http
GET /deductions
```

**Query Parameters:**
- `month`: Filter by month (YYYY-MM-DD)
- `status`: Entered, Verified, Forwarded, Approved, Rejected
- `committee_id`: Filter by committee

**Response:**
```json
{
  "success": true,
  "count": 200,
  "data": [
    {
      "deduction_id": 1,
      "member_code": "MEM-001",
      "full_name": "Rajesh Kumar",
      "committee_name": "Division 1A1 Executive Committee",
      "deduction_month": "2026-01-01",
      "deduction_amount": 500.00,
      "status": "Entered",
      "entry_type": "Manual",
      "entered_by_name": "DEC User",
      "entry_date": "2026-01-05T10:30:00Z"
    }
  ]
}
```

#### Create Deduction
```http
POST /deductions
```

**Auth**: DEC_USER, REC_USER, ZEC_USER

**Body:**
```json
{
  "member_id": 1,
  "deduction_month": "2026-02-01",
  "deduction_amount": 500.00,
  "remarks": "Regular monthly deduction"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Deduction entry created successfully",
  "data": {
    "deduction_id": 500
  }
}
```

#### Verify Deductions (ZEC)
```http
POST /deductions/verify
```

**Auth**: ZEC_VERIFIER, ZEC_USER

**Body:**
```json
{
  "deduction_ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 deductions verified successfully",
  "data": {
    "verified_count": 5
  }
}
```

#### Forward to CEC (ZEC)
```http
POST /deductions/forward
```

**Auth**: ZEC_VERIFIER, ZEC_USER

**Body:**
```json
{
  "deduction_month": "2026-01-01",
  "committee_id": 9
}
```

#### Approve Deductions (CEC)
```http
POST /deductions/approve
```

**Auth**: CEC_PRESIDENT, CEC_GS, CEC_SECRETARY, CEC_FINANCE

**Body:**
```json
{
  "deduction_month": "2026-01-01",
  "committee_id": 9,
  "actual_collection": 25000.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deductions approved successfully",
  "data": {
    "total_members": 50,
    "total_deductions": 25000.00,
    "actual_collection": 25000.00,
    "variance": 0.00
  }
}
```

#### Bulk Import Deductions
```http
POST /deductions/bulk-import
```

**Content-Type**: `multipart/form-data`

**Form Data:**
- `file`: Excel file (.xlsx)

#### Get Monthly Summary
```http
GET /deductions/summary?month=2026-01-01
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "committee_name": "Division 1A1 Executive Committee",
      "committee_type": "DEC",
      "total_members": 50,
      "total_amount": 25000.00,
      "status": "Verified",
      "deduction_count": 50
    }
  ]
}
```

---

### Withdrawal Endpoints

#### Get All Withdrawals
```http
GET /withdrawals
```

**Query Parameters:**
- `status`: Pending, Approved, Rejected, Disbursed

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "withdrawal_id": 1,
      "member_code": "MEM-001",
      "full_name": "Rajesh Kumar",
      "current_balance": 36000.00,
      "withdrawal_type": "Partial",
      "requested_amount": 10000.00,
      "approved_amount": null,
      "request_date": "2026-01-15",
      "zec_status": "Pending",
      "cec_status": "Pending",
      "final_status": "Pending"
    }
  ]
}
```

#### Create Withdrawal Request
```http
POST /withdrawals
```

**Auth**: DEC_USER, REC_USER

**Body:**
```json
{
  "member_id": 1,
  "withdrawal_type": "Partial",
  "requested_amount": 10000.00,
  "reason": "Medical emergency"
}
```

#### ZEC Approval
```http
POST /withdrawals/:id/zec-approve
```

**Auth**: ZEC_USER, ZEC_VERIFIER

**Body:**
```json
{
  "status": "Approved",
  "remarks": "Verified and approved"
}
```

#### CEC Approval
```http
POST /withdrawals/:id/cec-approve
```

**Auth**: CEC_PRESIDENT, CEC_GS, CEC_SECRETARY, CEC_FINANCE

**Body:**
```json
{
  "status": "Approved",
  "approved_amount": 10000.00,
  "remarks": "Final approval granted"
}
```

---

### Committee Endpoints

#### Get All Committees
```http
GET /committees
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "committee_id": 1,
      "committee_code": "CEC-001",
      "committee_name": "Central Executive Committee",
      "committee_type": "CEC",
      "parent_committee_id": null,
      "parent_name": null,
      "status": "Active"
    }
  ]
}
```

---

### Report Endpoints

#### Member Balance Report
```http
GET /reports/member-balances
```

**Query Parameters:**
- `committee_id` (optional)
- `status` (optional)

#### Pending Verifications Report
```http
GET /reports/pending-verifications
```

**Auth**: ZEC or higher

#### Pending CEC Approvals
```http
GET /reports/pending-cec-approvals
```

**Auth**: CEC or ADMIN

#### Withdrawal Requests Report
```http
GET /reports/withdrawal-requests?final_status=Pending
```

#### Suspense Fund Balance
```http
GET /reports/suspense-balance
```

**Auth**: CEC or ADMIN

#### Committee Summary
```http
GET /reports/committee-summary?year=2026
```

#### Dashboard Statistics
```http
GET /reports/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_active_members": 1500,
    "total_fund_balance": 5400000.00,
    "pending_verifications": 25,
    "pending_cec_approvals": 10,
    "pending_withdrawals": 5,
    "current_month": {
      "contributing_members": 1480,
      "total_amount": 740000.00
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error description"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response when exceeded**: HTTP 429 Too Many Requests

---

## Pagination

For endpoints returning large datasets:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response includes:**
```json
{
  "success": true,
  "count": 1500,
  "page": 1,
  "totalPages": 30,
  "data": [...]
}
```

---

## Webhooks (Future)

Planned webhook support for:
- Member creation
- Deduction approval
- Withdrawal approval
- Monthly closing

---

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login
const login = async () => {
  const response = await api.post('/auth/login', {
    username: 'admin',
    password: 'Admin@123'
  });
  
  const token = response.data.data.token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return token;
};

// Get members
const getMembers = async () => {
  const response = await api.get('/members');
  return response.data.data;
};

// Create deduction
const createDeduction = async (memberData) => {
  const response = await api.post('/deductions', memberData);
  return response.data;
};
```

### Python

```python
import requests

class WCMSClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.token = None
        self.login(username, password)
    
    def login(self, username, password):
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"username": username, "password": password}
        )
        self.token = response.json()['data']['token']
    
    def get_headers(self):
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def get_members(self):
        response = requests.get(
            f"{self.base_url}/members",
            headers=self.get_headers()
        )
        return response.json()['data']

# Usage
client = WCMSClient('http://localhost:5000/api/v1', 'admin', 'Admin@123')
members = client.get_members()
```

---

## Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Get members (replace TOKEN)
curl -X GET http://localhost:5000/api/v1/members \
  -H "Authorization: Bearer TOKEN"

# Create deduction
curl -X POST http://localhost:5000/api/v1/deductions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": 1,
    "deduction_month": "2026-02-01",
    "deduction_amount": 500.00
  }'
```

### Using Postman

1. Import API collection (if provided)
2. Set environment variable `baseUrl` to `http://localhost:5000/api/v1`
3. Use {{baseUrl}} in requests
4. Set token in Authorization header after login

---

## Changelog

### v1.0.0 (2026-02-08)
- Initial API release
- Authentication endpoints
- Member management
- Deduction workflow
- Withdrawal processing
- Reporting endpoints

---

**API Version**: 1.0  
**Last Updated**: February 2026
