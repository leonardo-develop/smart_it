const db = require("../config/db");
exports.getStudent = (req, res) => {
    const studentId = req.params.studentId;

    const sql = "SELECT student_id, full_name, major, gpa, completed_hours FROM students WHERE student_id = ?";

    db.query(sql, [studentId], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "الطالب غير موجود" });
        }

        res.json(result[0]);
    });
};
exports.getStudentCourses = (req, res) => {
    const studentId = req.params.studentId;

    const sql = `
        SELECT 
            c.course_code, 
            c.course_name, 
            c.credit_hours,
            sr.absences,
            sr.midterm_grade,
            sr.participation_grade,
            sr.final_grade
        FROM enrollments e
        JOIN courses c ON e.course_code = c.course_code
        LEFT JOIN student_records sr ON (e.student_id = sr.student_id AND e.course_code = sr.course_code)
        WHERE e.student_id = ?`;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "خطأ في قاعدة البيانات" });
        }
        res.json(results);
    });
};


exports.getLeaderboard = (req, res) => {
    const sql = `
        SELECT h.rank AS id, s.full_name AS name, s.major AS department, s.gpa AS score, s.completed_hours AS hours 
        FROM honor_board h
        JOIN students s ON h.student_id = s.student_id
        ORDER BY h.Rank ASC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        res.json(results);
    });
};

exports.getCourseDashboard = (req, res) => {
    const { courseCode, studentId } = req.params;

    const sqlMain = `
        SELECT 
            s.full_name AS student_name,
            c.course_name,
            c.credit_hours,
            c.syllabus_path,
            c.slides_path,
            sec.room_location, 
            sec.days,
            sec.start_time,
            sec.end_time,
            COALESCE(sr.midterm_grade, 0) AS midterm_grade,
            COALESCE(sr.participation_grade, 0) AS participation_grade,
            COALESCE(sr.final_grade, 0) AS final_grade,
            COALESCE(sr.absences, 0) AS absences
        FROM students s
        INNER JOIN enrollments e ON s.student_id = e.student_id
        INNER JOIN courses c ON e.course_code = c.course_code
        -- الربط مع جدول السكاشن باستخدام كود المادة
        LEFT JOIN sections sec ON c.course_code = sec.course_code 
        -- الربط مع العلامات (LEFT JOIN ضروري جداً هنا)
        LEFT JOIN student_records sr ON (s.student_id = sr.student_id AND c.course_code = sr.course_code)
        WHERE s.student_id = ? AND c.course_code = ?
    `;

    db.query(sqlMain, [studentId, courseCode], (err, results) => {
        if (err) {
            console.error("SQL Error:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "لم يتم العثور على المساق المسجل" });
        }

        const data = results[0];

        const sqlAnn = "SELECT title, content, created_at FROM announcements WHERE course_code = ? ORDER BY created_at DESC";
        db.query(sqlAnn, [courseCode], (err, annResults) => {
            if (err) return res.status(500).json({ error: err.message });

            const materials = [];
            if (data.syllabus_path) materials.push({ file_name: "خطة المساق", file_type: "PDF", file_url: "/uploads/" + data.syllabus_path });
            if (data.slides_path) materials.push({ file_name: "السلايدات", file_type: "PPTX", file_url: "/uploads/" + data.slides_path });
            if (data.book_path) materials.push({ file_name: "الكتاب", file_type: "PDF", file_url: "/uploads/" + data.book_path });

            res.json({
                student_name: data.student_name,
                course_name: data.course_name,
                credit_hours: data.credit_hours,
                Room_Location: data.room_location,
                days: data.days,
                start_time: data.start_time,
                end_time: data.end_time,
                midterm_grade: data.midterm_grade,
                participation_grade: data.participation_grade,
                final_grade: data.final_grade,
                absences: data.absences,
                announcements: annResults,
                materials: materials
            });
        });
    });
};
