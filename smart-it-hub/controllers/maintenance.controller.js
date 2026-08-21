
const db = require("../config/db");

// POST /api/maintenancerequest
exports.createMaintenanceRequest = (req, res) => {
    const { phone, location, issue_type, description } = req.body;

    if (!phone || !location || !issue_type || !description ||
        String(phone).length > 32 || String(location).length > 255 ||
        String(issue_type).length > 100 || String(description).length > 2000) {
        return res.status(400).json({ success: false, message: "يرجى إكمال الحقول المطلوبة" });
    }

    const checkSql = "SELECT * FROM maintenance WHERE location = ? AND issue_type = ? AND status = 'pending'";
    db.query(checkSql, [location, issue_type], (err, results) => {
        if (err) {
            console.error("Maintenance duplicate check error:", err);
            return res.status(500).json({ success: false, message: "تعذر حفظ الطلب" });
        }

        if (results.length > 0) {
            return res.json({ success: false, message: "هذا العطل تم التبليغ عنه مسبقاً وهو قيد المعالجة." });
        }

        const sql = "INSERT INTO maintenance (instructor_id, phone, location, issue_type, description, status) VALUES (?, ?, ?, ?, ?, 'pending')";
        db.query(sql, [req.user.id, phone, location, issue_type, description], (err, result) => {
            if (err) {
                console.error("Maintenance request save error:", err);
                return res.status(500).json({ success: false, message: "فشل في حفظ الطلب" });
            }
            res.json({ success: true });
        });
    });
};

// GET /api/mymaintenance/:id
exports.getMyMaintenance = (req, res) => {
    const sql = "SELECT request_id, location, status, issue_type FROM maintenance WHERE instructor_id = ? ORDER BY request_id DESC";
    if (String(req.params.id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "لا يمكنك الوصول إلى هذه الطلبات" });
    }

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("Maintenance history lookup error:", err);
            return res.status(500).json([]);
        }
        res.json(results);
    });
};
