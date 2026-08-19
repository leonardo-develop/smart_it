
const db = require("../config/db");


exports.login = (req, res) => {
    const { userId, password } = req.body;

    // 1. فحص الطلاب
    db.query(
        "SELECT * FROM students WHERE student_id = ? AND password = ?",
        [userId, password],
        (err, studentResults) => {
            if (err) return res.status(500).json({ success: false });

            if (studentResults.length > 0) {
                return res.json({
                    success: true,
                    role: "student",
                    id: studentResults[0].student_id,
                    name: studentResults[0].full_name,
                    redirect: "/displayp"
                });
            }

            // 2. فحص الدكاترة
            db.query(
                "SELECT * FROM instructors WHERE instructor_id = ? AND password = ?",
                [userId, password],
                (err, doctorResults) => {
                    if (err) return res.status(500).json({ success: false });

                    if (doctorResults.length > 0) {
                        return res.json({
                            success: true,
                            role: "doctor",
                            id: doctorResults[0].instructor_id,
                            name: doctorResults[0].full_name,
                            redirect: "/doctorp"
                        });
                    } else {
                        res.status(401).json({ success: false, message: "خطأ في البيانات" });
                    }
                }
            );
        }
    );
};
