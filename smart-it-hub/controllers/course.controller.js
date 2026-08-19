// controllers/course.controller.js
const db = require("../config/db");

// POST /api/upload-course-files
exports.uploadCourseFiles = (req, res) => {
    const courseCode = req.body.course_id;
    const files = req.files;

    if (!courseCode) {
        return res.status(400).send("كود المادة مفقود!");
    }

    const syllabus = files["syllabus_file"] ? files["syllabus_file"][0].filename : null;
    const slides = files["slides_files"] ? JSON.stringify(files["slides_files"].map((f) => f.filename)) : null;
    const books = files["books_files"] ? JSON.stringify(files["books_files"].map((f) => f.filename)) : null;

    const sql = `
        UPDATE courses 
        SET 
            syllabus_path = COALESCE(?, syllabus_path),
            slides_path = COALESCE(?, slides_path),
            books_path = COALESCE(?, books_path)
        WHERE course_code = ?`;

    db.query(sql, [syllabus, slides, books, courseCode], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send("خطأ في تحديث قاعدة البيانات");
        }
        res.send(`
            <script>
                alert('تم تحديث ملفات المادة ${courseCode} بنجاح!'); 
            </script>
        `);
    });
};

// GET /api/course-details/:code
exports.getCourseDetails = (req, res) => {
    const code = req.params.code;
    const sql = "SELECT * FROM courses WHERE course_code = ?";
    db.query(sql, [code], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result[0]);
    });
};
exports.getCourseStudents = (req, res) => {
    const courseCode = req.params.courseCode;
    const sql = `
        SELECT 
            s.student_id, 
            s.full_name AS student_name, 
            COALESCE(sr.midterm_grade, 0) AS midterm_grade, 
            COALESCE(sr.participation_grade, 0) AS participation_grade, 
            COALESCE(sr.absences, 0) AS absences,
            COALESCE(sr.final_grade, 0) AS final_grade,
            ROUND(COALESCE((sr.absences / 30 * 100), 0), 1) AS absence_percentage
        FROM students s
        INNER JOIN enrollments e ON s.student_id = e.student_id
        LEFT JOIN student_records sr ON (s.student_id = sr.student_id AND sr.course_code = e.course_code)
        WHERE e.course_code = ?`;

    db.query(sql, [courseCode], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "حدث خطأ في جلب البيانات" });
        }
        res.json(results);
    });
};

// POST /api/save-course-data (علامات + حضور/غياب)
exports.saveCourseData = (req, res) => {
    const { courseCode, studentData } = req.body;

    if (!studentData || studentData.length === 0) {
        return res.status(400).json({ success: false, message: "لا توجد بيانات لإرسالها" });
    }

    const queries = studentData.map((item) => {
        return new Promise((resolve, reject) => {
            const saveGradesSql = `
                INSERT INTO student_records (student_id, course_code, midterm_grade, participation_grade, final_grade, absences)
                VALUES (?, ?, ?, ?, ?, 0)
                ON DUPLICATE KEY UPDATE 
                midterm_grade = VALUES(midterm_grade), 
                participation_grade = VALUES(participation_grade),
                final_grade = VALUES(final_grade)`;

            db.query(saveGradesSql, [item.id, courseCode, item.midterm, item.participation, item.final || 0], (err) => {
                if (err) return reject(err);

                const insertAttendance = `
                    INSERT INTO attendance (student_id, course_code, attendance_date, status) 
                    VALUES (?, ?, CURDATE(), ?)`;

                db.query(insertAttendance, [item.id, courseCode, item.status], (err) => {
                    if (err) return reject(err);

                    // إذا كان غائب، نزيد عداد الغيابات في جدول السجلات
                    if (item.status === "Absent") {
                        const updateAbsenceCount = `
                            UPDATE student_records 
                            SET absences = absences + 1 
                            WHERE student_id = ? AND course_code = ?`;

                        db.query(updateAbsenceCount, [item.id, courseCode], (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            });
        });
    });

    Promise.all(queries)
        .then(() => {
            res.json({ success: true, message: "تم حفظ العلامات بما فيها الفاينل وتحديث سجل الغياب بنجاح!" });
        })
        .catch((err) => {
            console.error("Database Error:", err);
            res.status(500).json({ success: false, error: err.message });
        });
};

// POST /api/save-grades
exports.saveGrades = (req, res) => {
    const { courseCode, studentData } = req.body;

    if (!studentData || studentData.length === 0) {
        return res.status(400).json({ success: false, message: "لا توجد بيانات للإرسال" });
    }

    const queries = studentData.map((std) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO student_records 
                (student_id, course_code, participation_grade, midterm_grade) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                participation_grade = VALUES(participation_grade), 
                midterm_grade = VALUES(midterm_grade)`;
            db.query(sql, [std.id, courseCode, std.participation, std.midterm], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    });

    Promise.all(queries)
        .then(() => res.json({ success: true, message: "تم تحديث بيانات الجميع بنجاح" }))
        .catch((err) => {
            console.error("Database Error:", err);
            res.status(500).json({ success: false, error: err.message });
        });
};

// GET /api/doctor-courses?id=
exports.getDoctorCourses = (req, res) => {
    const instructorId = req.query.id;

    if (!instructorId) {
        return res.status(400).json({ error: "معرف الدكتور مفقود" });
    }

    const sql = `
        SELECT c.*, 
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_code = c.course_code) AS student_count
        FROM courses c 
        WHERE c.instructor_id = ?`;

    db.query(sql, [instructorId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// DELETE /api/delete-course-file
// ملاحظة أمان: fileType كان يُدرج مباشرة داخل جملة SQL (خطر SQL Injection).
// تمت إضافة قائمة بيضاء (whitelist) للأعمدة المسموح حذفها فقط.
const ALLOWED_FILE_COLUMNS = ["syllabus_path", "slides_path", "books_path"];

exports.deleteCourseFile = (req, res) => {
    const { courseCode, fileType } = req.body;

    if (!ALLOWED_FILE_COLUMNS.includes(fileType)) {
        return res.status(400).json({ error: "نوع الملف غير صالح" });
    }

    const sql = `UPDATE courses SET ${fileType} = NULL WHERE course_code = ?`;

    db.query(sql, [courseCode], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "تم إزالة الملف من المساق" });
    });
};
