const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { isValidIdentifier, numberInRange } = require("../utils/validation");

const ALLOWED_FILE_COLUMNS = ["syllabus_path", "slides_path", "books_path"];

function verifyInstructorCourse(courseCode, instructorId, callback) {
    if (!isValidIdentifier(courseCode)) {
        return callback(null, false);
    }

    const sql = "SELECT course_code FROM courses WHERE course_code = ? AND instructor_id = ?";
    db.query(sql, [courseCode, instructorId], (err, results) => {
        callback(err, results && results.length > 0);
    });
}

function removeUploadedFiles(files) {
    Object.values(files || {}).flat().forEach((file) => {
        fs.unlink(path.join(__dirname, "..", "uploads", file.filename), () => {});
    });
}

function validateGradeItem(item, includeFinal) {
    return item &&
        isValidIdentifier(String(item.id)) &&
        numberInRange(item.participation, 0, 20) &&
        numberInRange(item.midterm, 0, 30) &&
        (!includeFinal || numberInRange(item.final, 0, 50));
}

exports.uploadCourseFiles = (req, res) => {
    const courseCode = req.body.course_id;
    const files = req.files || {};

    if (!isValidIdentifier(courseCode)) {
        removeUploadedFiles(files);
        return res.status(400).json({ success: false, message: "كود المادة غير صالح" });
    }

    verifyInstructorCourse(courseCode, req.user.id, (verifyErr, ownsCourse) => {
        if (verifyErr) {
            console.error("Course ownership lookup error:", verifyErr);
            removeUploadedFiles(files);
            return res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
        }

        if (!ownsCourse) {
            removeUploadedFiles(files);
            return res.status(403).json({ success: false, message: "لا يمكنك تعديل هذا المساق" });
        }

        const syllabus = files.syllabus_file ? files.syllabus_file[0].filename : null;
        const slides = files.slides_files ? JSON.stringify(files.slides_files.map((file) => file.filename)) : null;
        const books = files.books_files ? JSON.stringify(files.books_files.map((file) => file.filename)) : null;
        const sql = `
            UPDATE courses
            SET syllabus_path = COALESCE(?, syllabus_path),
                slides_path = COALESCE(?, slides_path),
                books_path = COALESCE(?, books_path)
            WHERE course_code = ? AND instructor_id = ?`;

        db.query(sql, [syllabus, slides, books, courseCode, req.user.id], (err, result) => {
            if (err) {
                console.error("Course file update error:", err);
                removeUploadedFiles(files);
                return res.status(500).json({ success: false, message: "خطأ في تحديث قاعدة البيانات" });
            }

            res.json({ success: true, message: "تم تحديث ملفات المادة بنجاح", affectedRows: result.affectedRows });
        });
    });
};

exports.getCourseDetails = (req, res) => {
    const code = req.params.code;

    if (!isValidIdentifier(code)) {
        return res.status(400).json({ success: false, message: "كود المادة غير صالح" });
    }

    const sql = req.user.role === "doctor"
        ? "SELECT * FROM courses WHERE course_code = ? AND instructor_id = ?"
        : "SELECT * FROM courses WHERE course_code = ?";
    const values = req.user.role === "doctor" ? [code, req.user.id] : [code];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Course details lookup error:", err);
            return res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "المساق غير موجود" });
        }

        res.json(result[0]);
    });
};

exports.getCourseStudents = (req, res) => {
    const courseCode = req.params.courseCode;

    if (!isValidIdentifier(courseCode)) {
        return res.status(400).json({ success: false, message: "كود المادة غير صالح" });
    }

    const sql = `
        SELECT s.student_id, s.full_name AS student_name,
            COALESCE(sr.midterm_grade, 0) AS midterm_grade,
            COALESCE(sr.participation_grade, 0) AS participation_grade,
            COALESCE(sr.absences, 0) AS absences,
            COALESCE(sr.final_grade, 0) AS final_grade,
            ROUND(COALESCE((sr.absences / 30 * 100), 0), 1) AS absence_percentage
        FROM students s
        INNER JOIN enrollments e ON s.student_id = e.student_id
        INNER JOIN courses c ON c.course_code = e.course_code AND c.instructor_id = ?
        LEFT JOIN student_records sr ON s.student_id = sr.student_id AND sr.course_code = e.course_code
        WHERE e.course_code = ?`;

    db.query(sql, [req.user.id, courseCode], (err, results) => {
        if (err) {
            console.error("Course students lookup error:", err);
            return res.status(500).json({ success: false, message: "حدث خطأ في جلب البيانات" });
        }

        res.json(results);
    });
};

function saveCourseRecords(courseCode, studentData, callback) {
    const queries = studentData.map((item) => new Promise((resolve, reject) => {
        const saveGradesSql = `
            INSERT INTO student_records
                (student_id, course_code, midterm_grade, participation_grade, final_grade, absences)
            VALUES (?, ?, ?, ?, ?, 0)
            ON DUPLICATE KEY UPDATE
                midterm_grade = VALUES(midterm_grade),
                participation_grade = VALUES(participation_grade),
                final_grade = VALUES(final_grade)`;

        db.query(saveGradesSql, [
            item.id,
            courseCode,
            Number(item.midterm),
            Number(item.participation),
            Number(item.final)
        ], (err) => {
            if (err) {
                return reject(err);
            }

            db.query(
                "INSERT INTO attendance (student_id, course_code, attendance_date, status) VALUES (?, ?, CURDATE(), ?)",
                [item.id, courseCode, item.status],
                (attendanceErr) => {
                    if (attendanceErr) {
                        return reject(attendanceErr);
                    }

                    if (item.status !== "Absent") {
                        return resolve();
                    }

                    db.query(
                        "UPDATE student_records SET absences = absences + 1 WHERE student_id = ? AND course_code = ?",
                        [item.id, courseCode],
                        (absenceErr) => absenceErr ? reject(absenceErr) : resolve()
                    );
                }
            );
        });
    }));

    Promise.all(queries).then(() => callback(null)).catch(callback);
}

exports.saveCourseData = (req, res) => {
    const { courseCode, studentData } = req.body;

    if (!isValidIdentifier(courseCode) || !Array.isArray(studentData) || studentData.length === 0 ||
        studentData.length > 500 || studentData.some((item) => !validateGradeItem(item, true) ||
            !["Present", "Absent"].includes(item.status))) {
        return res.status(400).json({ success: false, message: "بيانات العلامات غير صالحة" });
    }

    verifyInstructorCourse(courseCode, req.user.id, (verifyErr, ownsCourse) => {
        if (verifyErr) {
            console.error("Course ownership lookup error:", verifyErr);
            return res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
        }

        if (!ownsCourse) {
            return res.status(403).json({ success: false, message: "لا يمكنك تعديل هذا المساق" });
        }

        saveCourseRecords(courseCode, studentData, (err) => {
            if (err) {
                console.error("Course data save error:", err);
                return res.status(500).json({ success: false, message: "تعذر حفظ العلامات" });
            }

            res.json({ success: true, message: "تم حفظ العلامات وتحديث سجل الغياب بنجاح" });
        });
    });
};

exports.saveGrades = (req, res) => {
    const courseCode = req.body.courseCode || req.body.course_code;
    const grades = req.body.studentData || req.body.gradesData;

    if (!isValidIdentifier(courseCode) || !Array.isArray(grades) || grades.length === 0 ||
        grades.length > 500 || grades.some((item) => {
            const normalized = {
                id: item.id,
                participation: item.participation !== undefined ? item.participation : item.part,
                midterm: item.midterm !== undefined ? item.midterm : item.mid,
                final: item.final !== undefined ? item.final : item.fin
            };
            return !validateGradeItem(normalized, true) ||
                (item.abs !== undefined && !numberInRange(item.abs, 0, 1000));
        })) {
        return res.status(400).json({ success: false, message: "بيانات العلامات غير صالحة" });
    }

    verifyInstructorCourse(courseCode, req.user.id, (verifyErr, ownsCourse) => {
        if (verifyErr) {
            console.error("Course ownership lookup error:", verifyErr);
            return res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
        }

        if (!ownsCourse) {
            return res.status(403).json({ success: false, message: "لا يمكنك تعديل هذا المساق" });
        }

        const queries = grades.map((item) => new Promise((resolve, reject) => {
            const finalGrade = item.final !== undefined ? item.final : item.fin;
            const absences = item.abs !== undefined ? item.abs : 0;
            const sql = `
                INSERT INTO student_records
                    (student_id, course_code, participation_grade, midterm_grade, final_grade, absences)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    participation_grade = VALUES(participation_grade),
                    midterm_grade = VALUES(midterm_grade),
                    final_grade = VALUES(final_grade),
                    absences = VALUES(absences)`;

            db.query(sql, [
                item.id,
                courseCode,
                Number(item.participation !== undefined ? item.participation : item.part),
                Number(item.midterm !== undefined ? item.midterm : item.mid),
                Number(finalGrade),
                Number(absences)
            ], (err, result) => err ? reject(err) : resolve(result));
        }));

        Promise.all(queries)
            .then(() => res.json({ success: true, message: "تم تحديث بيانات الجميع بنجاح" }))
            .catch((err) => {
                console.error("Grades save error:", err);
                res.status(500).json({ success: false, message: "تعذر حفظ العلامات" });
            });
    });
};

exports.getDoctorCourses = (req, res) => {
    const sql = `
        SELECT c.*,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_code = c.course_code) AS student_count
        FROM courses c
        WHERE c.instructor_id = ?`;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("Instructor courses lookup error:", err);
            return res.status(500).json({ success: false, message: "تعذر جلب المساقات" });
        }

        res.json(results);
    });
};

exports.deleteCourseFile = (req, res) => {
    const { courseCode, fileType } = req.body;

    if (!isValidIdentifier(courseCode) || !ALLOWED_FILE_COLUMNS.includes(fileType)) {
        return res.status(400).json({ success: false, message: "بيانات الملف غير صالحة" });
    }

    const sql = `UPDATE courses SET ${fileType} = NULL WHERE course_code = ? AND instructor_id = ?`;
    db.query(sql, [courseCode, req.user.id], (err, result) => {
        if (err) {
            console.error("Course file deletion error:", err);
            return res.status(500).json({ success: false, message: "تعذر إزالة الملف" });
        }

        if (result.affectedRows === 0) {
            return res.status(403).json({ success: false, message: "لا يمكنك تعديل هذا المساق" });
        }

        res.json({ success: true, message: "تم إزالة الملف من المساق" });
    });
};
