
const db = require("../config/db");

exports.bookLab = (req, res) => {
    const { student_id, lab_id, booking_date, start_time, duration, seat_number } = req.body;

    if (!student_id || !lab_id || !booking_date || !start_time || !duration) {
        return res.status(400).json({ message: "يرجى إكمال جميع الحقول الإلزامية" });
    }

    const checkConflictSql = `
        SELECT * FROM lab_schedules 
        WHERE lab_id = ? 
        AND day_of_week = (
            SELECT CASE DAYNAME(?)
                WHEN 'Sunday' THEN 'الأحد'
                WHEN 'Monday' THEN 'الاثنين'
                WHEN 'Tuesday' THEN 'الثلاثاء'
                WHEN 'Wednesday' THEN 'الأربعاء'
                WHEN 'Thursday' THEN 'الخميس'
            END
        )
        AND (
            -- الحالة 1: بداية حجز الطالب تقع أثناء المحاضرة
            (? BETWEEN start_time AND end_time)
            OR 
            -- الحالة 2: نهاية حجز الطالب تقع أثناء المحاضرة 
            (ADDTIME(?, SEC_TO_TIME(? * 3600)) BETWEEN start_time AND end_time)
            OR
            -- الحالة 3: الحجز يغطي وقت المحاضرة بالكامل
            (start_time BETWEEN ? AND ADDTIME(?, SEC_TO_TIME(? * 3600)))
        )
    `;

    const queryParams = [
        lab_id, booking_date,
        start_time,
        start_time, duration,
        start_time, start_time, duration
    ];

    db.query(checkConflictSql, queryParams, (err, conflicts) => {
        if (err) return res.status(500).json({ error: err.message });

        if (conflicts.length > 0) {
            return res.status(400).json({ message: "عذراً، المختبر محجوز لمحاضرة رسمية في هذا الوقت" });
        }

        const insertBookingSql = `
            INSERT INTO lab_bookings (student_id, lab_id, booking_date, start_time, duration, seat_number)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(insertBookingSql, [student_id, lab_id, booking_date, start_time, duration, seat_number], (err, result) => {
            if (err) {
                console.error("SQL Error:", err);
                return res.status(500).json({ message: "فشل تسجيل الحجز في قاعدة البيانات" });
            }

            res.status(200).json({ message: "تم الحجز بنجاح", bookingId: result.insertId });
        });
    });
};

// GET /api/lab-occupancy
exports.getLabOccupancy = (req, res) => {
    const sql = `
        SELECT l.lab_name, s.course_code, s.day_of_week, s.start_time, s.end_time 
        FROM lab_schedules s
        JOIN labs l ON s.lab_id = l.lab_id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// GET /api/labs
exports.getLabs = (req, res) => {
    const sql = "SELECT lab_id, lab_name FROM labs";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("خطأ في جلب المختبرات من الداتا بيز:", err);
            return res.status(500).json({ error: "فشل الاتصال بقاعدة البيانات" });
        }

        res.json(results);
    });
};
