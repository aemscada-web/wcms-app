# WCMS User Manual

## Welfare Contribution Management System
### User Guide and Operational Manual

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Dashboard Overview](#dashboard-overview)
5. [Member Management](#member-management)
6. [Deduction Management](#deduction-management)
7. [Withdrawal Requests](#withdrawal-requests)
8. [Reports](#reports)
9. [Common Workflows](#common-workflows)
10. [FAQs](#faqs)

---

## Introduction

The Welfare Contribution Management System (WCMS) is designed to manage member welfare contributions across MESCOM's committee hierarchy (DEC/REC/ZEC/CEC).

### Key Features
- ✅ Hierarchical committee structure management
- ✅ Member registration and tracking
- ✅ Monthly deduction entry and verification
- ✅ Multi-level approval workflow
- ✅ Fund withdrawal processing
- ✅ Suspense fund management
- ✅ Comprehensive reporting
- ✅ Historical data storage (2000-2006)
- ✅ Excel import/export capabilities

---

## Getting Started

### Logging In

1. Open your web browser and navigate to the WCMS URL
2. Enter your username and password
3. Click "Login"

**First-time users**: Your administrator will provide your credentials. You must change your password on first login.

### Changing Password

1. Click on your profile icon (top right)
2. Select "Change Password"
3. Enter current password
4. Enter new password (minimum 8 characters)
5. Confirm new password
6. Click "Update Password"

### Password Requirements
- Minimum 8 characters
- Mix of letters and numbers recommended
- Change password every 90 days (recommended)

---

## User Roles and Permissions

### DEC/REC User
**Permissions:**
- View members in their committee
- Enter monthly deductions
- Upload deductions via Excel
- Request member withdrawals
- View their committee reports

**Cannot:**
- Verify deductions
- Approve deductions
- Transfer members to other ZECs

### ZEC User
**Permissions:**
- All DEC/REC permissions, plus:
- View all DEC/REC committees under their zone
- Enter deductions directly
- Assign new members to DEC/REC
- Transfer members within zone

**Cannot:**
- Verify deductions (requires ZEC Verifier role)
- Approve final deductions

### ZEC Verifier
**Permissions:**
- All ZEC User permissions, plus:
- Verify deductions from DEC/REC
- Forward deductions to CEC
- Approve ZEC-level withdrawal requests
- Allocate suspense funds

### CEC Users (President/GS/Secretary/Finance)
**Permissions:**
- View all committees and members
- Consolidate monthly deductions
- Match collections with deductions
- Approve deductions
- Final approval of withdrawals
- Manage suspense funds
- Access all reports

### Admin
**Permissions:**
- All system permissions
- User management
- System configuration
- Bulk data import
- Database maintenance

---

## Dashboard Overview

Upon login, you'll see the dashboard with key metrics:

### Metrics Displayed
1. **Total Active Members**: Current active members count
2. **Total Fund Balance**: Sum of all member balances
3. **Pending Verifications**: Deductions awaiting ZEC verification
4. **Pending Approvals**: Deductions awaiting CEC approval
5. **Pending Withdrawals**: Withdrawal requests awaiting approval
6. **Current Month Contributions**: This month's collection summary

### Quick Actions
- **Add New Member**: Create member record
- **Enter Deduction**: Record monthly deduction
- **Upload Deductions**: Import from Excel
- **View Pending**: See items requiring your action

---

## Member Management

### Adding a New Member (ZEC and above)

1. Navigate to **Members** → **Add New Member**
2. Fill in required information:
   - Member Code (unique)
   - Full Name
   - Employee ID
   - Committee Assignment
   - Contact Email
   - Contact Phone
   - Date of Joining
3. Click **Create Member**

### Viewing Member Details

1. Navigate to **Members**
2. Use search or filters to find member
3. Click on member row to view details
4. View member's:
   - Personal information
   - Current balance
   - Contribution history
   - Withdrawal history

### Updating Member Information

1. Find and open member record
2. Click **Edit**
3. Update allowed fields:
   - Contact email
   - Contact phone
   - Status (Active/Inactive)
4. Click **Save Changes**

**Note**: Member code and committee cannot be changed directly. Use transfer function for committee changes.

### Importing Members (Bulk)

1. Navigate to **Members** → **Import**
2. Download Excel template
3. Fill template with member data:
   - member_code
   - full_name
   - employee_id
   - committee_id
   - contact_email
   - contact_phone
   - date_of_joining
4. Upload completed file
5. Review import summary
6. Fix any errors and re-upload if needed

**Excel Format Requirements:**
- First row must be headers
- All required columns must be present
- Dates in YYYY-MM-DD format
- Member codes must be unique

---

## Deduction Management

### Entering Monthly Deductions (Manual)

#### For DEC/REC/ZEC Users:

1. Navigate to **Deductions** → **Enter Deduction**
2. Select month and year
3. Select member from dropdown
4. Enter deduction amount
5. Add remarks (optional)
6. Click **Submit**

**Important Notes:**
- One deduction per member per month
- Cannot modify after verification
- System validates member's active status

### Uploading Deductions (Excel)

1. Navigate to **Deductions** → **Import**
2. Download Excel template
3. Fill template:
   ```
   member_code | deduction_month | deduction_amount
   MEM-001     | 2026-01-01      | 500.00
   MEM-002     | 2026-01-01      | 500.00
   ```
4. Upload file
5. Review import results
6. Fix errors if any

### Verifying Deductions (ZEC Verifier)

**Workflow**: DEC/REC enters → ZEC verifies → Forwards to CEC

1. Navigate to **Deductions** → **Pending Verification**
2. Review list of unverified deductions
3. Select deductions to verify:
   - Use checkboxes to select multiple
   - Or use "Select All" for monthly batch
4. Click **Verify Selected**
5. Confirm verification

**Verification Checklist:**
- ✅ Member code is correct
- ✅ Amount is reasonable
- ✅ Month is current
- ✅ No duplicate entries

### Forwarding to CEC (ZEC)

1. Navigate to **Deductions** → **Forward to CEC**
2. Select month
3. Select committee (or all)
4. Review summary:
   - Total members
   - Total amount
   - Verification status
5. Click **Forward to CEC**

**Best Practice**: Forward complete months at once

### Approving Deductions (CEC)

**Workflow**: ZEC forwards → CEC consolidates → CEC approves

1. Navigate to **Deductions** → **Pending Approval**
2. Select month for approval
3. Select committee
4. Review consolidated summary
5. Enter actual collection amount (if different)
6. System calculates variance
7. Click **Approve**

**System Actions on Approval:**
- Updates deduction status to "Approved"
- Posts to member balances
- Creates approval record
- Records variance (if any)

### Viewing Deduction History

1. Navigate to **Deductions** → **History**
2. Apply filters:
   - Month/Year range
   - Committee
   - Status
   - Member
3. Export to Excel if needed

---

## Withdrawal Requests

### Requesting Withdrawal (DEC/REC)

1. Navigate to **Withdrawals** → **New Request**
2. Fill form:
   - Select member
   - Withdrawal type:
     - **Partial**: Partial amount withdrawal
     - **Full Retirement**: Complete balance
   - Requested amount
   - Reason for withdrawal
3. Click **Submit Request**

**System Validations:**
- Member must be active
- Amount ≤ current balance
- No pending withdrawal for member

### ZEC Approval Process

1. Navigate to **Withdrawals** → **Pending ZEC Approval**
2. Review withdrawal request:
   - Member details
   - Current balance
   - Requested amount
   - Reason
3. Click **Approve** or **Reject**
4. Add remarks
5. Confirm action

**Approval Criteria:**
- Verify member identity
- Check balance availability
- Review reason validity
- Confirm committee approval

### CEC Final Approval

1. Navigate to **Withdrawals** → **Pending CEC Approval**
2. Review request details
3. Verify ZEC approval status
4. Enter approved amount (can be different from requested)
5. Click **Approve** or **Reject**
6. Add remarks
7. Confirm

**System Actions on CEC Approval:**
- Deducts from member balance
- Updates member total withdrawals
- Marks as "Approved"
- Generates disbursement record

### Tracking Withdrawal Status

**Status Flow:**
1. **Pending** → Newly created
2. **ZEC Approved** → ZEC has approved
3. **CEC Approved** → Final approval
4. **Rejected** → Rejected at any level
5. **Disbursed** → Payment completed

View status: **Withdrawals** → **View All** → Filter by status

---

## Reports

### Available Reports

#### 1. Member Balance Report
**Access**: Reports → Member Balances

**Filters:**
- Committee
- Member status
- Date range

**Columns:**
- Member code
- Name
- Committee
- Total contributions
- Total withdrawals
- Current balance

**Export**: Excel, PDF

#### 2. Monthly Contribution Summary
**Access**: Reports → Monthly Summary

**Shows:**
- Committee-wise breakdown
- Member participation rate
- Total collections
- Comparison with previous month

#### 3. Pending Verifications
**Access**: Reports → Pending Verifications (ZEC only)

**Shows:**
- Deductions awaiting verification
- Grouped by source committee
- Age of pending items

#### 4. Withdrawal Requests Report
**Access**: Reports → Withdrawal Requests

**Shows:**
- All withdrawal requests
- Status tracking
- Approval timeline
- Pending amounts

#### 5. Committee Performance
**Access**: Reports → Committee Summary

**Shows:**
- Member count by committee
- Collection efficiency
- Active vs inactive members
- Year-over-year comparison

#### 6. Suspense Fund Report (CEC only)
**Access**: Reports → Suspense Fund

**Shows:**
- Current suspense balance
- Transactions history
- Allocations made
- Pending allocations

### Exporting Reports

1. Generate desired report
2. Click **Export** button
3. Select format:
   - Excel (.xlsx)
   - PDF
   - CSV
4. File downloads automatically

### Printing Reports

1. Generate report
2. Click **Print** button
3. Use print preview
4. Select printer or Save as PDF
5. Print

---

## Common Workflows

### Workflow 1: Monthly Deduction Cycle

**Timeline**: 1st-5th of each month

**DEC/REC (Day 1-3):**
1. Receive salary deduction report from accounts
2. Login to WCMS
3. Either:
   - Enter deductions manually, OR
   - Upload Excel file
4. Review entered deductions
5. Notify ZEC

**ZEC (Day 3-4):**
1. Login to WCMS
2. Navigate to Pending Verifications
3. Review DEC/REC deductions
4. Verify accuracy
5. Forward to CEC
6. Enter own committee deductions

**CEC (Day 4-5):**
1. Login to WCMS
2. Review forwarded deductions
3. Consolidate month's data
4. Match with actual collections
5. Approve deductions
6. System posts to member accounts

### Workflow 2: New Member Registration

**ZEC:**
1. Receive new member details from DEC/REC
2. Login to WCMS
3. Add new member
4. Assign to appropriate DEC/REC
5. Verify information
6. Notify member and DEC/REC

**DEC/REC:**
1. Receive new member notification
2. Verify member appears in their list
3. Begin deduction entry from next month

### Workflow 3: Member Transfer

**Scenario**: Member transfers from one committee to another

**Within Same Zone (DEC/REC transfers):**
1. ZEC initiates transfer
2. Selects member
3. Selects new committee
4. Adds transfer reason
5. Effective date
6. System updates member record

**Across Zones:**
1. Source ZEC requests transfer to CEC
2. CEC approves transfer
3. System updates member committee
4. Destination ZEC notified

**Note**: Balance transfers with member automatically

### Workflow 4: Retirement Withdrawal

**Timeline**: 30-45 days

**Day 1-5: Request**
- Member requests withdrawal from DEC/REC
- DEC/REC user creates withdrawal request
- Attaches retirement documents

**Day 5-15: ZEC Review**
- ZEC receives notification
- Reviews request and documents
- Verifies member balance
- Approves/Rejects with remarks

**Day 15-30: CEC Approval**
- CEC receives ZEC-approved requests
- Final review
- Approves disbursement amount
- System updates member balance

**Day 30-45: Disbursement**
- Finance processes payment
- Marks withdrawal as "Disbursed"
- Member receives funds

---

## FAQs

### General Questions

**Q: I forgot my password. What should I do?**  
A: Contact your system administrator. They can reset your password.

**Q: Can I access WCMS from my mobile phone?**  
A: Yes, WCMS is mobile-responsive and works on all devices.

**Q: How often should I login?**  
A: DEC/REC/ZEC users should login monthly during deduction cycle. CEC users may login weekly.

### Member Management

**Q: Can I delete a member?**  
A: No, members cannot be deleted. Set status to "Inactive" instead to maintain historical records.

**Q: How do I correct a wrong member code?**  
A: Contact admin. Member codes cannot be changed by regular users.

**Q: What if I entered wrong committee for a member?**  
A: Use the Transfer Member function to move to correct committee.

### Deduction Management

**Q: Can I modify a deduction after entering?**  
A: Yes, before verification. After verification, contact ZEC/admin.

**Q: What if I forgot to enter a month's deduction?**  
A: You can enter previous months' deductions, but get ZEC approval first.

**Q: The Excel upload failed. What's wrong?**  
A: Common issues:
- Wrong file format (must be .xlsx)
- Missing required columns
- Duplicate member codes
- Invalid dates
- File size too large

**Q: Can I enter future month deductions?**  
A: Generally no. System may allow current + 1 month only.

### Withdrawals

**Q: How long does withdrawal approval take?**  
A: Typically 30-45 days for complete process (DEC → ZEC → CEC → Disbursement)

**Q: Can I withdraw partial amount?**  
A: Yes, select "Partial Withdrawal" and enter amount.

**Q: What happens to my deductions after withdrawal?**  
A: For partial withdrawal, member remains active. For retirement, status changes to "Retired."

**Q: Can a rejected withdrawal be resubmitted?**  
A: Yes, create new request addressing rejection reasons.

### Reports

**Q: Why don't I see all committees in reports?**  
A: You only see committees you have permission to access based on your role.

**Q: Can I schedule automatic report generation?**  
A: Currently no. Contact admin if you need this feature.

**Q: Report shows old data. How to refresh?**  
A: Click refresh icon or reload page. Reports show real-time data.

### Technical Issues

**Q: Page is not loading**  
A: Try:
1. Refresh browser (F5)
2. Clear browser cache
3. Try different browser
4. Check internet connection
5. Contact admin if problem persists

**Q: I got an error message. What should I do?**  
A: 
1. Take screenshot of error
2. Note what you were doing
3. Contact support with details
4. Don't retry repeatedly

**Q: System is very slow**  
A: Try:
1. Close other browser tabs
2. Clear browser cache
3. Check internet speed
4. Report to admin during business hours

---

## Best Practices

### Do's ✅
- Login only from secure networks
- Logout after completing work
- Change password regularly
- Verify data before submitting
- Keep member records up-to-date
- Upload deductions promptly
- Review pending items daily
- Export important reports regularly
- Report errors immediately

### Don'ts ❌
- Share login credentials
- Leave session unattended
- Use public computers
- Enter duplicate data
- Modify historical records without approval
- Approve without verification
- Delete audit trails
- Work from unsecured wifi

---

## Contact Support

### For Technical Issues
- **Email**: support@mescom.in
- **Phone**: +91-XXXX-XXXXXX
- **Hours**: Mon-Fri, 9 AM - 5 PM

### For Training
- **Email**: training@mescom.in
- Request user training sessions
- Access video tutorials

### For Policy Questions
- Contact your committee head
- Refer to MESCOM welfare policy document

---

**System Version**: 1.0  
**Last Updated**: February 2026  
**Document Version**: 1.0

---

*This manual is subject to updates. Check for latest version periodically.*
