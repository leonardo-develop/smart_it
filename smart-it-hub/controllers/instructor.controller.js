// controllers/instructor.controller.js
const db = require("../config/db");

// GET /api/doctor/:id
exports.getDoctor = (req, res) => {
    const docId = req.params.id;
    const sql = "SELECT * FROM instructors WHERE instructor_id = ?";
    db.query(sql, [docId], (err, result) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        if (result.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(result[0]);
    });
};

// GET /api/doctor-achievements/:id
exports.getDoctorAchievements = (req, res) => {
    const docId = req.params.id;
    const sql = "SELECT title FROM achievements WHERE instructor_id = ?";
    db.query(sql, [docId], (err, results) => {
        if (err) return res.status(500).json({ error: "خطأ في القاعدة" });
        res.json(results);
    });
};

exports.getAllFaculty = (req, res) => {
    const sqlInstructors = "SELECT instructor_id, full_name, department, specialization, office_room, email FROM instructors";

    db.query(sqlInstructors, (err, doctors) => {
        if (err) return res.status(500).json({ error: "خطأ في القاعدة" });

        const sqlHours = "SELECT instructor_id, day, start_time, end_time FROM office_hours";

        db.query(sqlHours, (err, hours) => {
            if (err) return res.status(500).json({ error: "خطأ في القاعدة" });

            const facultyWithHours = doctors.map((doc) => {
                return {
                    ...doc,
                    office_hours: hours.filter((h) => h.instructor_id === doc.instructor_id)
                };
            });
            res.json(facultyWithHours);
        });
    });
};
exports.getAllInstructors = (req, res) => {
    const sql = `
        SELECT 
            i.instructor_id, 
            i.full_name, 
            i.academic_rank, 
            i.specialization, 
            i.department, 
            i.email, 
            i.office_room, 
            i.profile_img,
            GROUP_CONCAT(a.title SEPARATOR '|') AS achievements_list
        FROM instructors i
        LEFT JOIN achievements a ON i.instructor_id = a.instructor_id
        GROUP BY i.instructor_id
        ORDER BY i.department ASC, i.full_name ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("خطأ في قاعدة البيانات:", err);
            return res.status(500).json({ error: "فشل في جلب بيانات المدرسين" });
        }

        res.json(results);
    });
};
