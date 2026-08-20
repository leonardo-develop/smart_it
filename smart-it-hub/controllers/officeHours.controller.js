const db = require("../config/db");
const { calculateGaps } = require("../utils/officeHoursHelper");
const { isValidTime } = require("../utils/validation");

function validOfficeInterval(start, end) {
    if (!isValidTime(start) || !isValidTime(end)) {
        return false;
    }

    const startMinutes = start.split(":").map(Number);
    const endMinutes = end.split(":").map(Number);
    const startValue = startMinutes[0] * 60 + startMinutes[1];
    const endValue = endMinutes[0] * 60 + endMinutes[1];
    return endValue > startValue && endValue - startValue <= 60;
}

exports.getOfficeHours = (req, res) => {
    const instructorId = req.user.id;
    const sql = "SELECT * FROM office_hours WHERE instructor_id = ?";

    db.query(sql, [instructorId], (err, results) => {
        if (err) {
            console.error("Office hours lookup error:", err);
            return res.status(500).json({ success: false, message: "تعذر جلب الساعات المكتبية" });
        }
        res.json(results);
    });
};

exports.suggestOfficeHours = (req, res) => {
    const instructorId = req.user.id;

    const sql = `SELECT days, start_time, end_time FROM sections 
                 WHERE instructor_id = ? 
                 ORDER BY days, start_time`;

    db.query(sql, [instructorId], (err, results) => {
        if (err) {
            console.error("Office hours suggestion error:", err);
            return res.status(500).json({ success: false, message: "تعذر جلب المقترحات" });
        }

        let suggestions = calculateGaps(results);
        res.json(suggestions);
    });
};
exports.addOfficeHour = (req, res) => {
    const { day, start_time, end_time, location } = req.body;

    if (!day || !validOfficeInterval(start_time, end_time) ||
        !location || String(location).length > 255) {
        return res.status(400).send("الرجاء إكمال جميع الحقول المطلوبة");
    }

    const sql = "INSERT INTO office_hours (instructor_id, day, start_time, end_time, location) VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [req.user.id, day, start_time, end_time, location], (err, result) => {
        if (err) {
            console.error("خطأ في الداتابيز:", err);
            return res.status(500).send("فشل في حفظ البيانات");
        }
        res.status(200).send("✅ تم الحفظ بنجاح");
    });
};

exports.saveOfficeHour = (req, res) => {
    const { day, start, end, location } = req.body;

    if (!day || !validOfficeInterval(start, end) || !location ||
        String(location).length > 255) {
        return res.status(400).send("جميع الحقول مطلوبة.");
    }

    const sql = `INSERT INTO office_hours (instructor_id, day, start_time, end_time, location) 
                 VALUES (?, ?, ?, ?, ?)`;

    const values = [req.user.id, day, start, end, location];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("خطأ أثناء الحفظ:", err);
            return res.status(500).send("حدث خطأ في السيرفر.");
        }
        res.status(200).send("تم حفظ الموعد بنجاح!");
    });
};

// DELETE /api/delete-office-hour/:id
exports.deleteOfficeHour = (req, res) => {
    const hourId = req.params.id;
    if (!/^\d+$/.test(hourId)) {
        return res.status(400).send("معرف الساعة غير صالح");
    }

    const sql = "DELETE FROM office_hours WHERE id = ? AND instructor_id = ?";

    db.query(sql, [hourId, req.user.id], (err, result) => {
        if (err) {
            console.error("خطأ أثناء الحذف:", err);
            return res.status(500).send("فشل الحذف من قاعدة البيانات");
        }
        if (result.affectedRows === 0) {
            return res.status(403).send("لا يمكنك حذف هذه الساعة");
        }

        res.send("تم الحذف بنجاح");
    });
};
