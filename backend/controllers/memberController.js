// controllers/memberController.js
const { pool } = require('../config/database');
const XLSX = require('xlsx');

// Get all members with filters
exports.getMembers = async (req, res) => {
    try {
        const { committee_id, status, search } = req.query;
        
        let query = `
            SELECT m.*, c.committee_name, c.committee_type, c.committee_code
            FROM members m
            JOIN committees c ON m.committee_id = c.committee_id
            WHERE 1=1
        `;
        const params = [];

        // Apply filters based on user role
        if (!['ADMIN', 'CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'CEC_FINANCE'].includes(req.user.role)) {
            query += ' AND m.committee_id = ?';
            params.push(req.user.committee_id);
        }

        if (committee_id) {
            query += ' AND m.committee_id = ?';
            params.push(committee_id);
        }

        if (status) {
            query += ' AND m.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (m.full_name LIKE ? OR m.member_code LIKE ? OR m.employee_id LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY m.member_code ASC';

        const [members] = await pool.query(query, params);

        res.json({
            success: true,
            count: members.length,
            data: members
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve members'
        });
    }
};

// Get member by ID
exports.getMemberById = async (req, res) => {
    try {
        const [members] = await pool.query(`
            SELECT m.*, c.committee_name, c.committee_type, c.committee_code
            FROM members m
            JOIN committees c ON m.committee_id = c.committee_id
            WHERE m.member_id = ?
        `, [req.params.id]);

        if (members.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Get member's deduction history
        const [deductions] = await pool.query(`
            SELECT deduction_month, deduction_amount, status
            FROM monthly_deductions
            WHERE member_id = ?
            ORDER BY deduction_month DESC
            LIMIT 12
        `, [req.params.id]);

        res.json({
            success: true,
            data: {
                ...members[0],
                recent_deductions: deductions
            }
        });
    } catch (error) {
        console.error('Get member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve member'
        });
    }
};

// Create new member
exports.createMember = async (req, res) => {
    try {
        const {
            member_code,
            full_name,
            employee_id,
            committee_id,
            contact_email,
            contact_phone,
            date_of_joining
        } = req.body;

        // Validate required fields
        if (!member_code || !full_name || !committee_id || !date_of_joining) {
            return res.status(400).json({
                success: false,
                message: 'Member code, name, committee, and joining date are required'
            });
        }

        // Check if member code already exists
        const [existing] = await pool.query(
            'SELECT member_id FROM members WHERE member_code = ?',
            [member_code]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Member code already exists'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO members 
            (member_code, full_name, employee_id, committee_id, contact_email, contact_phone, date_of_joining)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [member_code, full_name, employee_id, committee_id, contact_email, contact_phone, date_of_joining]);

        res.status(201).json({
            success: true,
            message: 'Member created successfully',
            data: {
                id: result.insertId,
                member_code
            }
        });
    } catch (error) {
        console.error('Create member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create member'
        });
    }
};

// Update member
exports.updateMember = async (req, res) => {
    try {
        const {
            full_name,
            contact_email,
            contact_phone,
            status
        } = req.body;

        const updates = [];
        const params = [];

        if (full_name) {
            updates.push('full_name = ?');
            params.push(full_name);
        }
        if (contact_email !== undefined) {
            updates.push('contact_email = ?');
            params.push(contact_email);
        }
        if (contact_phone !== undefined) {
            updates.push('contact_phone = ?');
            params.push(contact_phone);
        }
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(req.params.id);

        await pool.query(
            `UPDATE members SET ${updates.join(', ')} WHERE member_id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Member updated successfully'
        });
    } catch (error) {
        console.error('Update member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update member'
        });
    }
};

// Get member balance and transaction summary
exports.getMemberBalance = async (req, res) => {
    try {
        const [members] = await pool.query(`
            SELECT member_id, member_code, full_name, 
                   total_contributions, total_withdrawals, current_balance
            FROM members
            WHERE member_id = ?
        `, [req.params.id]);

        if (members.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        res.json({
            success: true,
            data: members[0]
        });
    } catch (error) {
        console.error('Get member balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve member balance'
        });
    }
};

// Bulk import members from Excel
exports.bulkImportMembers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const inserted = [];
        const errors = [];

        for (const row of data) {
            try {
                // Validate required fields
                if (!row.member_code || !row.full_name || !row.committee_id || !row.date_of_joining) {
                    errors.push({
                        row: row,
                        error: 'Missing required fields'
                    });
                    continue;
                }

                // Check if member already exists
                const [existing] = await pool.query(
                    'SELECT member_id FROM members WHERE member_code = ?',
                    [row.member_code]
                );

                if (existing.length > 0) {
                    errors.push({
                        row: row,
                        error: 'Member code already exists'
                    });
                    continue;
                }

                await pool.query(`
                    INSERT INTO members 
                    (member_code, full_name, employee_id, committee_id, contact_email, contact_phone, date_of_joining)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    row.member_code,
                    row.full_name,
                    row.employee_id || null,
                    row.committee_id,
                    row.contact_email || null,
                    row.contact_phone || null,
                    row.date_of_joining
                ]);

                inserted.push(row.member_code);
            } catch (error) {
                errors.push({
                    row: row,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Imported ${inserted.length} members`,
            data: {
                inserted: inserted.length,
                errors: errors.length,
                errorDetails: errors
            }
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to import members'
        });
    }
};
