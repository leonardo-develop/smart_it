
const db = require("../config/db");

// POST /api/maintenancerequest
exports.createMaintenanceRequest = (req, res) => {
    const { instructor_id, phone, location, issue_type, description } = req.body;

    const checkSql = "SELECT * FROM maintenance WHERE location = ? AND issue_type = ? AND status = 'pending'";
    db.query(checkSql, [location, issue_type], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "خطأ في قاعدة البيانات" });

        if (results.length > 0) {
            return res.json({ success: false, message: "هذا العطل تم التبليغ عنه مسبقاً وهو قيد المعالجة." });
        }

        const sql = "INSERT INTO maintenance (instructor_id, phone, location, issue_type, description, status) VALUES (?, ?, ?, ?, ?, 'pending')";
        db.query(sql, [instructor_id, phone, location, issue_type, description], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: "فشل في حفظ الطلب" });
            res.json({ success: true });
        });
    });
};

// GET /api/mymaintenance/:id
exports.getMyMaintenance = (req, res) => {
    const sql = "SELECT request_id, location, status, issue_type FROM maintenance WHERE instructor_id = ? ORDER BY request_id DESC";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
};
