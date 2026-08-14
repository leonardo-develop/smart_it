const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const app = express();
const multer = require('multer');
app.use(express.json());
app.use(express.static(__dirname));   
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",  
    database: "smart_it_hub"
});
db.connect((err) => {
    if (err) {
        console.error("خطأ في الاتصال بالقاعدة:", err);
        return;
    }
    console.log("Smart IT Hub connected successfully");
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landpage', 'home.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'loginform', 'login2.html'));
});

app.get("/displayp", (req, res) => {
    res.sendFile(path.join(__dirname, 'studentinfo', 'studentprof.html'));
});

app.get("/doctorp", (req, res) => {
    res.sendFile(path.join(__dirname, 'docprofile', 'doctor.html'));
});
app.get("/managecourses", (req, res) => {
    res.sendFile(path.join(__dirname, 'managecourse', 'manage.html'));
});
// احتياط خليه 
app.get("/syll.html", (req, res) => {
    res.sendFile(path.join(__dirname, 'syllabus', 'syll.html'));
});
app.use('/managecourse', express.static('managecourse'));
app.post("/api/login", (req, res) => {
    const { userId, password } = req.body;
    // 1. فحص الطلاب
    db.query("SELECT * FROM students WHERE student_id = ? AND password = ?", [userId, password], (err, studentResults) => {
        if (err) return res.status(500).json({ success: false });
        if (studentResults.length > 0) {
            return res.json({ 
                success: true, 
                role: 'student', 
                id: studentResults[0].student_id, 
                name: studentResults[0].full_name,
                redirect: "/displayp" 
            });
        }
        // 2. فحص الدكاترة
        db.query("SELECT * FROM instructors WHERE instructor_id = ? AND password = ?", [userId, password], (err, doctorResults) => {
            if (err) return res.status(500).json({ success: false });
            if (doctorResults.length > 0) {
                return res.json({ 
                    success: true, 
                    role: 'doctor', 
                    id: doctorResults[0].instructor_id, 
                    name: doctorResults[0].full_name,
                    redirect: "/doctorp" 
                });
            }
             else {
                res.status(401).json({ success: false, message: "خطأ في البيانات" });
            }
        });
    });
});
const storage = multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });
app.post("/api/upload-course-files", upload.fields([
    { name: 'syllabus_file', maxCount: 1 },
    { name: 'slides_files', maxCount: 10 },
    { name: 'books_files', maxCount: 10 }
]), (req, res) => {
    const courseCode = req.body.course_id; 
    const files = req.files;

    if (!courseCode) {
        return res.status(400).send("كود المادة مفقود!");
    }
    const syllabus = files['syllabus_file'] ? files['syllabus_file'][0].filename : null;
    const slides = files['slides_files'] ? JSON.stringify(files['slides_files'].map(f => f.filename)) : null;
    const books = files['books_files'] ? JSON.stringify(files['books_files'].map(f => f.filename)) : null;
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
});
app.get("/api/course-details/:code", (req, res) => {
    const code = req.params.code;
    const sql = "SELECT * FROM courses WHERE course_code = ?";
    db.query(sql, [code], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result[0]);
    });
});
app.get("/api/doctor/:id", (req, res) => {
    const docId = req.params.id;
    const sql = "SELECT * FROM instructors WHERE instructor_id = ?";
    db.query(sql, [docId], (err, result) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        if (result.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(result[0]);
    });
});
app.get("/api/doctor-achievements/:id", (req, res) => {
    const docId = req.params.id;
    const sql = "SELECT title FROM achievements WHERE instructor_id = ?";
    db.query(sql, [docId], (err, results) => {
        if (err) return res.status(500).json({ error: "خطأ في القاعدة" });
        res.json(results);
    });
});
app.get("/api/course-students/:courseCode", (req, res) => {
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
});
app.post("/api/save-course-data", (req, res) => {
    const { courseCode, studentData } = req.body;

    if (!studentData || studentData.length === 0) {
        return res.status(400).json({ success: false, message: "لا توجد بيانات لإرسالها" });
    }

    const queries = studentData.map(item => {
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

                    // 3. إذا كان غائب، نزيد عداد الغيابات في جدول السجلات
                    if (item.status === 'Absent') {
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
        .catch(err => {
            console.error("Database Error:", err);
            res.status(500).json({ success: false, error: err.message });
        });
});

app.post("/api/maintenancerequest", (req, res) => {
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
});
app.get("/api/mymaintenance/:id", (req, res) => {
    const sql = "SELECT request_id, location, status, issue_type FROM maintenance WHERE instructor_id = ? ORDER BY request_id DESC";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});
app.get("/api/all-faculty", (req, res) => {
    const sqlinstructors = "SELECT instructor_id, full_name, department, specialization, office_room, email FROM instructors";
    
    db.query(sqlinstructors, (err, doctors) => {
        if (err) return res.status(500).json({ error: "خطأ في القاعدة" });
        
        
        const sqlHours = "SELECT instructor_id, day, start_time, end_time FROM office_hours";
        
        db.query(sqlHours, (err, hours) => {
            if (err) return res.status(500).json({ error: "خطأ في القاعدة" });
            
            const facultyWithHours = doctors.map(doc => {
                return {
                    ...doc,
               
                    office_hours: hours.filter(h => h.instructor_id === doc.instructor_id)
                };
            });
            res.json(facultyWithHours);
        });
    });
});
app.post("/api/save-grades", (req, res) => {
 
    const { courseCode, studentData } = req.body; 

    if (!studentData || studentData.length === 0) {
        return res.status(400).json({ success: false, message: "لا توجد بيانات للإرسال" });
    }

    const queries = studentData.map(std => {
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
        .catch(err => {
            console.error("Database Error:", err);
            res.status(500).json({ success: false, error: err.message });
        });
});
app.get("/api/course-students/:courseCode", (req, res) => {
    const courseCode = req.params.courseCode;
    const sql = `
        SELECT s.student_id, s.full_name 
        FROM students s
        JOIN enrollments e ON s.student_id = e.student_id
        WHERE e.course_code = ?`;
    
    db.query(sql, [courseCode], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get("/api/student/:studentId", (req, res) => {
    const studentId = req.params.studentId;

    const sql = "SELECT student_id, full_name, major, gpa,completed_hours FROM students WHERE student_id = ?";

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
});

app.get("/api/student-courses/:studentId", (req, res) => {
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
});

app.get("/api/student/:id", (req, res) => {
    const studentId = req.params.id;
    const sql = "SELECT student_id, full_name, major, gpa FROM students WHERE student_id = ?";
    db.query(sql, [studentId], (err, result) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        res.json(result[0]);
    });
});
app.get("/api/leaderboard", (req, res) => {
    const sql = `
        SELECT h.rank AS id, s.full_name AS name, s.major AS department, s.gpa AS score,s.completed_hours as hours 
        FROM honor_board h
        JOIN students s ON h.student_id = s.student_id
        ORDER BY h.Rank ASC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        res.json(results);
    });
});
app.get("/api/instructors", (req, res) => {
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
});
app.get("/api/doctor-courses", (req, res) => {
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
});
app.post('/api/book-lab', (req, res) => {
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
});
app.get('/api/lab-occupancy', (req, res) => {
    const sql = `
        SELECT l.lab_name, s.course_code, s.day_of_week, s.start_time, s.end_time 
        FROM lab_schedules s
        JOIN labs l ON s.lab_id = l.lab_id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
app.get('/api/labs', (req, res) => {
    const sql = "SELECT lab_id, lab_name FROM labs";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("خطأ في جلب المختبرات من الداتا بيز:", err);
            return res.status(500).json({ error: "فشل الاتصال بقاعدة البيانات" });
        }
        
        res.json(results);
    });
});
    app.delete("/api/delete-course-file", (req, res) => {
        const { courseCode, fileType } = req.body; 
        
        const sql = `UPDATE courses SET ${fileType} = NULL WHERE course_code = ?`;
    
        db.query(sql, [courseCode], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "تم إزالة الملف من المساق" });
        });
    });
    app.get("/api/suggest-office-hours", (req, res) => {
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
    });

app.get("/api/get-office-hours", (req, res) => {
    const instructorId = req.query.id;
    const sql = "SELECT * FROM office_hours WHERE instructor_id = ?";
    
    db.query(sql, [instructorId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
function calculateGaps(results) {
    let suggestions = [];
    if (!results || results.length === 0) return suggestions;

    for (let i = 0; i < results.length - 1; i++) {
        const current = results[i];
        const next = results[i + 1];

        if (current.days === next.days && current.end_time && next.start_time) {
            const endInMin = timeToMinutes(current.end_time);
            const startInMin = timeToMinutes(next.start_time);
            
           
            if ((startInMin - endInMin) >= 60) {
                suggestions.push({
                    day: current.days,
                    start: current.end_time.substring(0, 5),
                    end: addOneHour(current.end_time), 
                    type: 'فجوة بين محاضرات'
                });
            }
        }
    }

    const OFFICIAL_END_TIME = 960; //هان قصدي الساعة 4 اللي هو وقت انتهاء الدوام 

    const lastClasses = getLastClassPerDayGroup(results);

    lastClasses.forEach(lastClass => {
        const classEndInMin = timeToMinutes(lastClass.end_time);
        
        // إذا الدكتور خلص قبل الساعة 4 بفرق ساعة أو أكثر
        if (OFFICIAL_END_TIME - classEndInMin >= 60) {
            suggestions.push({
                day: lastClass.days,
                start: lastClass.end_time.substring(0, 5),
                end: addOneHour(lastClass.end_time), 
                type: 'بعد انتهاء محاضراتك'
            });
        }
    });

    return suggestions;
}
function addOneHour(timeStr) {
    if(!timeStr) return "";
    let [h, m] = timeStr.split(':').map(Number);
    h = h + 1; 
    
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToMinutes(timeStr) {
    if(!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}
function getLastClassPerDayGroup(results) {
    const lastOnes = {};
    results.forEach(row => {
        lastOnes[row.days] = row; 
    });
    return Object.values(lastOnes);
}

function timeToMinutes(timeStr) {
    if(!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

app.post("/api/add-office-hour", (req, res) => {
   
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
});
app.post('/api/save-office-hour', (req, res) => { 
   
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
    
});

app.delete('/api/delete-office-hour/:id', (req, res) => {
    const hourId = req.params.id;
    const sql = "DELETE FROM office_hours WHERE id = ?"; 

    db.query(sql, [hourId], (err, result) => {
        if (err) {
            console.error("خطأ أثناء الحذف:", err);
            return res.status(500).send("فشل الحذف من قاعدة البيانات");
        }
        res.send("تم الحذف بنجاح");
    });
});
app.get("/api/course-dashboard/:courseCode/:studentId", (req, res) => {
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
                Room_Location: data.Room_Location, 
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
});
app.listen(3000, () => {
    console.log('Server started working at port 3000');
});   