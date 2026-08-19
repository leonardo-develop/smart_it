const db = require("../config/db");
const { calculateGaps } = require("../utils/officeHoursHelper");
exports.getOfficeHours = (req, res) => {
    const instructorId = req.query.id;
    const sql = "SELECT * FROM office_hours WHERE instructor_id = ?";

    db.query(sql, [instructorId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

exports.suggestOfficeHours = (req, res) => {
    const instructorId = req.query.id;

    if (!instructorId) {
        return res.status(400).send("ID الدكتور مطلوب");
    }

    const sql = `SELECT days, start_time, end_time FROM sections 
                 WHERE instructor_id = ? 
                 ORDER BY days, start_time`;

    db.query(sql, [instructorId], (err, results) => {
        if (err) return res.status(500).json(err);

        let suggestions = calculateGaps(results);
        res.json(suggestions);
    });
};
exports.addOfficeHour = (req, res) => {
    const { instructor_id, day, start_time, end_time, location } = req.body;

    if (!instructor_id || !day || !start_time || !end_time) {
        return res.status(400).send("الرجاء إكمال جميع الحقول المطلوبة");
    }

    const sql = "INSERT INTO office_hours (instructor_id, day, start_time, end_time, location) VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [instructor_id, day, start_time, end_time, location], (err, result) => {
        if (err) {
            console.error("خطأ في الداتابيز:", err);
            return res.status(500).send("فشل في حفظ البيانات");
        }
        res.status(200).send("✅ تم الحفظ بنجاح");
    });
};

exports.saveOfficeHour = (req, res) => {
    const { instructor_id, day, start, end, location } = req.body;
    console.log("البيانات المستلمة:", req.body);

    if (!instructor_id || !day || !start || !end || !location) {
        return res.status(400).send("جميع الحقول مطلوبة.");
    }

    const sql = `INSERT INTO office_hours (instructor_id, day, start_time, end_time, location) 
                 VALUES (?, ?, ?, ?, ?)`;

    const values = [instructor_id, day, start, end, location];

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
    const sql = "DELETE FROM office_hours WHERE id = ?";

    db.query(sql, [hourId], (err, result) => {
        if (err) {
            console.error("خطأ أثناء الحذف:", err);
            return res.status(500).send("فشل الحذف من قاعدة البيانات");
        }
        res.send("تم الحذف بنجاح");
    });
};
