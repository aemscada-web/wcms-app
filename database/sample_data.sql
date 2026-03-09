-- ============================================
-- Sample Data for WCMS
-- ============================================

-- Insert CEC (Central Executive Committee)
INSERT INTO committees (committee_code, committee_name, committee_type, parent_committee_id) VALUES
('CEC-001', 'Central Executive Committee', 'CEC', NULL);

-- Insert ZECs (Zonal Executive Committees)
INSERT INTO committees (committee_code, committee_name, committee_type, parent_committee_id) VALUES
('ZEC-001', 'Zone 1 Executive Committee', 'ZEC', 1),
('ZEC-002', 'Zone 2 Executive Committee', 'ZEC', 1),
('ZEC-003', 'Zone 3 Executive Committee', 'ZEC', 1);

-- Insert RECs (Regional Executive Committees)
INSERT INTO committees (committee_code, committee_name, committee_type, parent_committee_id) VALUES
('REC-001', 'Region 1A Executive Committee', 'REC', 2),
('REC-002', 'Region 1B Executive Committee', 'REC', 2),
('REC-003', 'Region 2A Executive Committee', 'REC', 3),
('REC-004', 'Region 2B Executive Committee', 'REC', 3);

-- Insert DECs (Divisional Executive Committees)
INSERT INTO committees (committee_code, committee_name, committee_type, parent_committee_id) VALUES
('DEC-001', 'Division 1A1 Executive Committee', 'DEC', 5),
('DEC-002', 'Division 1A2 Executive Committee', 'DEC', 5),
('DEC-003', 'Division 1B1 Executive Committee', 'DEC', 6),
('DEC-004', 'Division 2A1 Executive Committee', 'DEC', 7);

-- Insert CEC Users
-- All passwords are initially set to "Welcome@123"
INSERT INTO users (username, password_hash, full_name, email, phone, committee_id, role) VALUES
('cec_president', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'CEC President', 'president@mescom.in', '9876543210', 1, 'CEC_PRESIDENT'),
('cec_gs', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'General Secretary', 'gs@mescom.in', '9876543211', 1, 'CEC_GS'),
('cec_secretary', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'CEC Secretary', 'secretary@mescom.in', '9876543212', 1, 'CEC_SECRETARY'),
('cec_finance', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'Finance Secretary', 'finance@mescom.in', '9876543213', 1, 'CEC_FINANCE');

-- Insert ZEC Users
INSERT INTO users (username, password_hash, full_name, email, phone, committee_id, role) VALUES
('zec1_user', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'ZEC 1 User', 'zec1@mescom.in', '9876543220', 2, 'ZEC_USER'),
('zec1_verifier', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'ZEC 1 Verifier', 'zec1verify@mescom.in', '9876543221', 2, 'ZEC_VERIFIER'),
('zec2_user', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'ZEC 2 User', 'zec2@mescom.in', '9876543222', 3, 'ZEC_USER'),
('zec2_verifier', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'ZEC 2 Verifier', 'zec2verify@mescom.in', '9876543223', 3, 'ZEC_VERIFIER');

-- Insert REC Users
INSERT INTO users (username, password_hash, full_name, email, phone, committee_id, role) VALUES
('rec1_user', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'REC 1A User', 'rec1a@mescom.in', '9876543230', 5, 'REC_USER'),
('rec2_user', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'REC 1B User', 'rec1b@mescom.in', '9876543231', 6, 'REC_USER');

-- Insert DEC Users
INSERT INTO users (username, password_hash, full_name, email, phone, committee_id, role) VALUES
('dec1_user', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'DEC 1A1 User', 'dec1a1@mescom.in', '9876543240', 9, 'DEC_USER'),
('dec2_user', '$2a$10$2pcHxyoCFyUOeG/IhW6XO./m3m2PO.M7lHyfj/Cq0n0H.gaL1A.lu', 'DEC 1A2 User', 'dec1a2@mescom.in', '9876543241', 10, 'DEC_USER');

-- Insert Admin User
-- Username: admin | Password: Admin@123
INSERT INTO users (username, password_hash, full_name, email, phone, committee_id, role) VALUES
('admin', '$2a$10$PTdaMXk97uzb/TLWRvjHfOnLuJgp8O5eLGpuZjAM8QSAY2M5e6dOW', 'System Administrator', 'admin@mescom.in', '9876543200', 1, 'ADMIN');

-- Insert Sample Members
INSERT INTO members (member_code, full_name, employee_id, committee_id, contact_email, contact_phone, date_of_joining, status) VALUES
('MEM-001', 'Rajesh Kumar', 'EMP001', 9, 'rajesh@mescom.in', '9988776655', '2015-01-15', 'Active'),
('MEM-002', 'Sunita Sharma', 'EMP002', 9, 'sunita@mescom.in', '9988776656', '2016-03-20', 'Active'),
('MEM-003', 'Amit Patel', 'EMP003', 10, 'amit@mescom.in', '9988776657', '2014-07-10', 'Active'),
('MEM-004', 'Priya Reddy', 'EMP004', 10, 'priya@mescom.in', '9988776658', '2017-11-05', 'Active'),
('MEM-005', 'Suresh Naik', 'EMP005', 11, 'suresh@mescom.in', '9988776659', '2013-02-28', 'Active'),
('MEM-006', 'Lakshmi Bhat', 'EMP006', 12, 'lakshmi@mescom.in', '9988776660', '2018-09-12', 'Active'),
('MEM-007', 'Vijay Singh', 'EMP007', 9, 'vijay@mescom.in', '9988776661', '2010-04-01', 'Active'),
('MEM-008', 'Anita Desai', 'EMP008', 10, 'anita@mescom.in', '9988776662', '2012-06-15', 'Active');

-- Insert Sample Monthly Deductions (Current Year)
INSERT INTO monthly_deductions (member_id, committee_id, deduction_month, deduction_amount, entry_type, entered_by, status) VALUES
-- January 2026
(1, 9, '2026-01-01', 500.00, 'Manual', 12, 'Entered'),
(2, 9, '2026-01-01', 500.00, 'Manual', 12, 'Entered'),
(3, 10, '2026-01-01', 500.00, 'Manual', 13, 'Entered'),
(4, 10, '2026-01-01', 500.00, 'Manual', 13, 'Entered'),
(5, 11, '2026-01-01', 500.00, 'Manual', 10, 'Verified'),
(6, 12, '2026-01-01', 500.00, 'Manual', 8, 'Verified'),
-- December 2025
(1, 9, '2025-12-01', 500.00, 'Manual', 12, 'Verified'),
(2, 9, '2025-12-01', 500.00, 'Manual', 12, 'Verified'),
(3, 10, '2025-12-01', 500.00, 'Manual', 13, 'Verified'),
(4, 10, '2025-12-01', 500.00, 'Manual', 13, 'Verified'),
(5, 11, '2025-12-01', 500.00, 'Manual', 10, 'Forwarded'),
(6, 12, '2025-12-01', 500.00, 'Manual', 8, 'Forwarded');

-- Insert Sample Historical Deductions (2000-2006)
INSERT INTO monthly_deductions (member_id, committee_id, deduction_month, deduction_amount, entry_type, entered_by, status, is_historical) VALUES
-- Sample historical data for member 1
(1, 9, '2005-01-01', 300.00, 'Excel_Upload', 14, 'Approved', TRUE),
(1, 9, '2005-02-01', 300.00, 'Excel_Upload', 14, 'Approved', TRUE),
(1, 9, '2005-03-01', 300.00, 'Excel_Upload', 14, 'Approved', TRUE),
-- Sample historical data for member 2
(2, 9, '2005-01-01', 300.00, 'Excel_Upload', 14, 'Approved', TRUE),
(2, 9, '2005-02-01', 300.00, 'Excel_Upload', 14, 'Approved', TRUE);

-- Update member balances based on historical data
UPDATE members m
SET 
    total_contributions = (
        SELECT IFNULL(SUM(deduction_amount), 0)
        FROM monthly_deductions
        WHERE member_id = m.member_id AND status = 'Approved'
    ),
    current_balance = total_contributions - total_withdrawals;

-- Insert Sample Suspense Fund Transactions
INSERT INTO suspense_fund (transaction_date, description, amount, transaction_type, source, entered_by, status, approved_by, approval_date) VALUES
('2025-12-01', 'Unallocated deduction variance', 1500.00, 'Credit', 'Monthly Reconciliation', 4, 'Approved', 1, '2025-12-02'),
('2025-11-01', 'Interest earned on fund', 500.00, 'Credit', 'Bank Interest', 4, 'Approved', 1, '2025-11-05');

-- Insert Sample Audit Logs
INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values, ip_address) VALUES
(14, 'LOGIN', NULL, NULL, NULL, NULL, '192.168.1.100'),
(12, 'INSERT', 'monthly_deductions', 1, NULL, '{"member_id":1,"amount":500}', '192.168.1.101'),
(1, 'UPDATE', 'monthly_deductions', 1, '{"status":"Entered"}', '{"status":"Verified"}', '192.168.1.102');

-- Note: Bcrypt password hashes are used for security
-- All users except admin: Password is "Welcome@123"
-- Admin user: Password is "Admin@123"
