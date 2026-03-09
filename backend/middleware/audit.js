// middleware/audit.js
const { pool } = require('../config/database');

// Log user actions to audit trail
const auditLog = (actionType, tableName = null) => {
    return async (req, res, next) => {
        // Store original json function
        const originalJson = res.json.bind(res);

        // Override res.json to capture response
        res.json = async (data) => {
            try {
                // Only log if operation was successful
                if (data.success && req.user) {
                    const recordId = data.data?.id || 
                                   data.data?.member_id || 
                                   data.data?.deduction_id ||
                                   data.data?.withdrawal_id ||
                                   null;

                    await pool.query(`
                        INSERT INTO audit_logs 
                        (user_id, action_type, table_name, record_id, old_values, new_values, ip_address, user_agent)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        req.user.user_id,
                        actionType,
                        tableName,
                        recordId,
                        req.auditOldValues ? JSON.stringify(req.auditOldValues) : null,
                        JSON.stringify(req.body),
                        req.ip,
                        req.get('user-agent')
                    ]);
                }
            } catch (error) {
                console.error('Audit log error:', error);
                // Don't fail the request if audit logging fails
            }

            // Call original json function
            return originalJson(data);
        };

        next();
    };
};

// Store old values before update/delete
const captureOldValues = (tableName, idField) => {
    return async (req, res, next) => {
        try {
            const id = req.params.id || req.params[idField];
            if (id) {
                const [rows] = await pool.query(
                    `SELECT * FROM ${tableName} WHERE ${idField} = ?`,
                    [id]
                );
                if (rows.length > 0) {
                    req.auditOldValues = rows[0];
                }
            }
        } catch (error) {
            console.error('Error capturing old values:', error);
        }
        next();
    };
};

module.exports = {
    auditLog,
    captureOldValues
};
