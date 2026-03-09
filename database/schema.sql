-- ============================================
-- Welfare Contribution Management System (WCMS)
-- Database Schema
-- Version 1.0
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS suspense_fund_allocations;
DROP TABLE IF EXISTS suspense_fund;
DROP TABLE IF EXISTS fund_withdrawals;
DROP TABLE IF EXISTS deduction_approvals;
DROP TABLE IF EXISTS monthly_deductions;
DROP TABLE IF EXISTS member_transfers;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS committees;

-- ============================================
-- TABLE: committees
-- Stores DEC/REC/ZEC/CEC committee information
-- ============================================
CREATE TABLE committees (
    committee_id INT AUTO_INCREMENT PRIMARY KEY,
    committee_code VARCHAR(20) NOT NULL UNIQUE,
    committee_name VARCHAR(100) NOT NULL,
    committee_type ENUM('DEC', 'REC', 'ZEC', 'CEC') NOT NULL,
    parent_committee_id INT NULL,
    contact_person VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(15),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_committee_id) REFERENCES committees(committee_id),
    INDEX idx_committee_type (committee_type),
    INDEX idx_parent_committee (parent_committee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: users
-- Stores system users (committee executives)
-- ============================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    committee_id INT NOT NULL,
    role ENUM('DEC_USER', 'REC_USER', 'ZEC_USER', 'ZEC_VERIFIER', 'CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'CEC_FINANCE', 'ADMIN') NOT NULL,
    status ENUM('Active', 'Inactive', 'Locked') DEFAULT 'Active',
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (committee_id) REFERENCES committees(committee_id),
    INDEX idx_username (username),
    INDEX idx_committee_role (committee_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: members
-- Stores welfare member information
-- ============================================
CREATE TABLE members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    member_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(20) UNIQUE,
    committee_id INT NOT NULL,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(15),
    date_of_joining DATE NOT NULL,
    date_of_retirement DATE NULL,
    status ENUM('Active', 'Transferred', 'Retired', 'Inactive') DEFAULT 'Active',
    total_contributions DECIMAL(12, 2) DEFAULT 0.00,
    total_withdrawals DECIMAL(12, 2) DEFAULT 0.00,
    current_balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (committee_id) REFERENCES committees(committee_id),
    INDEX idx_member_code (member_code),
    INDEX idx_committee (committee_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: member_transfers
-- Tracks member transfers between committees
-- ============================================
CREATE TABLE member_transfers (
    transfer_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    from_committee_id INT NOT NULL,
    to_committee_id INT NOT NULL,
    transfer_date DATE NOT NULL,
    reason TEXT,
    initiated_by INT NOT NULL,
    approved_by INT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (from_committee_id) REFERENCES committees(committee_id),
    FOREIGN KEY (to_committee_id) REFERENCES committees(committee_id),
    FOREIGN KEY (initiated_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),
    INDEX idx_member (member_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: monthly_deductions
-- Stores monthly welfare deductions
-- ============================================
CREATE TABLE monthly_deductions (
    deduction_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    committee_id INT NOT NULL,
    deduction_month DATE NOT NULL,
    deduction_amount DECIMAL(10, 2) NOT NULL,
    entry_type ENUM('Manual', 'Excel_Upload') DEFAULT 'Manual',
    entered_by INT NOT NULL,
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by INT NULL,
    verification_date TIMESTAMP NULL,
    forwarded_to_cec BOOLEAN DEFAULT FALSE,
    forwarded_date TIMESTAMP NULL,
    status ENUM('Entered', 'Verified', 'Forwarded', 'Approved', 'Rejected') DEFAULT 'Entered',
    remarks TEXT,
    is_historical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (committee_id) REFERENCES committees(committee_id),
    FOREIGN KEY (entered_by) REFERENCES users(user_id),
    FOREIGN KEY (verified_by) REFERENCES users(user_id),
    INDEX idx_member_month (member_id, deduction_month),
    INDEX idx_committee_month (committee_id, deduction_month),
    INDEX idx_status (status),
    UNIQUE KEY unique_member_month (member_id, deduction_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: deduction_approvals
-- Tracks CEC approval/consolidation process
-- ============================================
CREATE TABLE deduction_approvals (
    approval_id INT AUTO_INCREMENT PRIMARY KEY,
    deduction_month DATE NOT NULL,
    committee_id INT NOT NULL,
    total_deductions DECIMAL(12, 2) NOT NULL,
    total_members INT NOT NULL,
    actual_collection DECIMAL(12, 2),
    variance DECIMAL(12, 2),
    approved_by INT NULL,
    approval_date TIMESTAMP NULL,
    status ENUM('Pending', 'Matched', 'Variance_Noted', 'Approved', 'Rejected') DEFAULT 'Pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (committee_id) REFERENCES committees(committee_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),
    INDEX idx_month_committee (deduction_month, committee_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: fund_withdrawals
-- Tracks member fund withdrawals
-- ============================================
CREATE TABLE fund_withdrawals (
    withdrawal_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    withdrawal_type ENUM('Partial', 'Full_Retirement') NOT NULL,
    requested_amount DECIMAL(12, 2) NOT NULL,
    approved_amount DECIMAL(12, 2),
    request_date DATE NOT NULL,
    reason TEXT,
    requested_by_committee_id INT NOT NULL,
    zec_approved_by INT NULL,
    zec_approval_date TIMESTAMP NULL,
    zec_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    zec_remarks TEXT,
    cec_approved_by INT NULL,
    cec_approval_date TIMESTAMP NULL,
    cec_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    cec_remarks TEXT,
    final_status ENUM('Pending', 'Approved', 'Rejected', 'Disbursed') DEFAULT 'Pending',
    disbursement_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (requested_by_committee_id) REFERENCES committees(committee_id),
    FOREIGN KEY (zec_approved_by) REFERENCES users(user_id),
    FOREIGN KEY (cec_approved_by) REFERENCES users(user_id),
    INDEX idx_member (member_id),
    INDEX idx_status (final_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: suspense_fund
-- Manages suspense fund pool
-- ============================================
CREATE TABLE suspense_fund (
    suspense_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_type ENUM('Credit', 'Debit') NOT NULL,
    source VARCHAR(100),
    entered_by INT NOT NULL,
    status ENUM('Pending', 'Approved') DEFAULT 'Pending',
    approved_by INT NULL,
    approval_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entered_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),
    INDEX idx_transaction_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: suspense_fund_allocations
-- Tracks suspense fund allocations to members
-- ============================================
CREATE TABLE suspense_fund_allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    suspense_id INT NOT NULL,
    member_id INT NOT NULL,
    allocation_amount DECIMAL(10, 2) NOT NULL,
    allocation_date DATE NOT NULL,
    reason TEXT,
    allocated_by INT NOT NULL,
    approved_by INT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (suspense_id) REFERENCES suspense_fund(suspense_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id),
    FOREIGN KEY (allocated_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),
    INDEX idx_member (member_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TABLE: audit_logs
-- Comprehensive audit trail
-- ============================================
CREATE TABLE audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user_action (user_id, action_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_table_record (table_name, record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View: Member Balance Summary
CREATE VIEW view_member_balance AS
SELECT 
    m.member_id,
    m.member_code,
    m.full_name,
    m.employee_id,
    c.committee_name,
    c.committee_type,
    m.status,
    m.total_contributions,
    m.total_withdrawals,
    m.current_balance,
    m.date_of_joining,
    m.date_of_retirement
FROM members m
JOIN committees c ON m.committee_id = c.committee_id;

-- View: Pending Verifications (for ZEC)
CREATE VIEW view_pending_verifications AS
SELECT 
    md.deduction_id,
    m.member_code,
    m.full_name,
    md.deduction_month,
    md.deduction_amount,
    c.committee_name AS source_committee,
    u.full_name AS entered_by_name,
    md.entry_date,
    md.remarks
FROM monthly_deductions md
JOIN members m ON md.member_id = m.member_id
JOIN committees c ON md.committee_id = c.committee_id
JOIN users u ON md.entered_by = u.user_id
WHERE md.status = 'Entered' 
AND c.committee_type IN ('DEC', 'REC');

-- View: Pending CEC Approvals
CREATE VIEW view_pending_cec_approvals AS
SELECT 
    md.deduction_id,
    m.member_code,
    m.full_name,
    md.deduction_month,
    md.deduction_amount,
    c.committee_name,
    c.committee_type,
    md.status,
    md.forwarded_date
FROM monthly_deductions md
JOIN members m ON md.member_id = m.member_id
JOIN committees c ON md.committee_id = c.committee_id
WHERE md.status IN ('Verified', 'Forwarded');

-- View: Withdrawal Requests Status
CREATE VIEW view_withdrawal_requests AS
SELECT 
    fw.withdrawal_id,
    m.member_code,
    m.full_name,
    fw.withdrawal_type,
    fw.requested_amount,
    fw.request_date,
    c.committee_name AS requesting_committee,
    fw.zec_status,
    fw.cec_status,
    fw.final_status
FROM fund_withdrawals fw
JOIN members m ON fw.member_id = m.member_id
JOIN committees c ON fw.requested_by_committee_id = c.committee_id;

-- View: Suspense Fund Balance
CREATE VIEW view_suspense_balance AS
SELECT 
    SUM(CASE WHEN transaction_type = 'Credit' AND status = 'Approved' THEN amount ELSE 0 END) -
    SUM(CASE WHEN transaction_type = 'Debit' AND status = 'Approved' THEN amount ELSE 0 END) AS current_balance,
    COUNT(*) AS total_transactions,
    MAX(transaction_date) AS last_transaction_date
FROM suspense_fund;

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

-- Procedure: Approve Deductions and Update Member Balance
CREATE PROCEDURE sp_approve_deductions(
    IN p_deduction_month DATE,
    IN p_committee_id INT,
    IN p_approved_by INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error approving deductions';
    END;
    
    START TRANSACTION;
    
    -- Update deduction status
    UPDATE monthly_deductions
    SET status = 'Approved'
    WHERE deduction_month = p_deduction_month
    AND committee_id = p_committee_id
    AND status = 'Forwarded';
    
    -- Update member balances
    UPDATE members m
    SET 
        total_contributions = total_contributions + (
            SELECT IFNULL(SUM(deduction_amount), 0)
            FROM monthly_deductions
            WHERE member_id = m.member_id
            AND deduction_month = p_deduction_month
            AND status = 'Approved'
        ),
        current_balance = total_contributions - total_withdrawals;
    
    -- Insert approval record
    INSERT INTO deduction_approvals (
        deduction_month, committee_id, total_deductions, total_members, approved_by, approval_date, status
    )
    SELECT 
        p_deduction_month,
        p_committee_id,
        SUM(deduction_amount),
        COUNT(DISTINCT member_id),
        p_approved_by,
        NOW(),
        'Approved'
    FROM monthly_deductions
    WHERE deduction_month = p_deduction_month
    AND committee_id = p_committee_id
    AND status = 'Approved';
    
    COMMIT;
END //

-- Procedure: Process Fund Withdrawal
CREATE PROCEDURE sp_process_withdrawal(
    IN p_withdrawal_id INT,
    IN p_approved_by INT,
    IN p_approved_amount DECIMAL(12,2)
)
BEGIN
    DECLARE v_member_id INT;
    DECLARE v_current_balance DECIMAL(12,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error processing withdrawal';
    END;
    
    START TRANSACTION;
    
    -- Get member info
    SELECT member_id INTO v_member_id
    FROM fund_withdrawals
    WHERE withdrawal_id = p_withdrawal_id;
    
    SELECT current_balance INTO v_current_balance
    FROM members
    WHERE member_id = v_member_id;
    
    -- Check sufficient balance
    IF v_current_balance < p_approved_amount THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
    
    -- Update withdrawal record
    UPDATE fund_withdrawals
    SET 
        approved_amount = p_approved_amount,
        cec_approved_by = p_approved_by,
        cec_approval_date = NOW(),
        cec_status = 'Approved',
        final_status = 'Approved'
    WHERE withdrawal_id = p_withdrawal_id;
    
    -- Update member balance
    UPDATE members
    SET 
        total_withdrawals = total_withdrawals + p_approved_amount,
        current_balance = current_balance - p_approved_amount
    WHERE member_id = v_member_id;
    
    COMMIT;
END //

DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_deduction_status_month ON monthly_deductions(status, deduction_month);
CREATE INDEX idx_member_status ON members(status, committee_id);
CREATE INDEX idx_withdrawal_final_status ON fund_withdrawals(final_status, request_date);

-- ============================================
-- END OF SCHEMA
-- ============================================
