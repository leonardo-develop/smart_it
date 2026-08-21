
const bcrypt = require("bcryptjs");
const db = require("../config/db");

function isBcryptHash(value) {
    return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

function verifyPassword(storedPassword, suppliedPassword, callback) {
    if (isBcryptHash(storedPassword)) {
        return bcrypt.compare(suppliedPassword, storedPassword, callback);
    }

    if (storedPassword !== suppliedPassword) {
        return callback(null, false);
    }

    bcrypt.hash(suppliedPassword, 12, (err, hashedPassword) => {
        if (err) {
            return callback(err);
        }

        callback(null, true, hashedPassword);
    });
}

function establishSession(req, user, res) {
    req.session.user = user;
    req.session.save((err) => {
        if (err) {
            console.error("Session error:", err);
            return res.status(500).json({ success: false, message: "تعذر إنشاء جلسة الدخول" });
        }

        res.json({
            success: true,
            role: user.role,
            id: user.id,
            name: user.name,
            redirect: user.role === "doctor" ? "/doctorp" : "/displayp"
        });
    });
}

function authenticateFromTable(table, userId, password, callback) {
    const idColumn = table === "students" ? "student_id" : "instructor_id";
    const role = table === "students" ? "student" : "doctor";

    db.query(`SELECT * FROM ${table} WHERE ${idColumn} = ?`, [userId], (err, results) => {
        if (err) {
            return callback(err);
        }

        if (results.length === 0) {
            return callback(null, null);
        }

        const row = results[0];
        verifyPassword(row.password, password, (verifyErr, valid, migratedHash) => {
            if (verifyErr || !valid) {
                return callback(verifyErr || null, null);
            }

            if (migratedHash) {
                db.query(
                    `UPDATE ${table} SET password = ? WHERE ${idColumn} = ?`,
                    [migratedHash, row[idColumn]],
                    (updateErr) => {
                        if (updateErr) {
                            console.error("Password migration error:", updateErr);
                        }
                    }
                );
            }

            callback(null, {
                id: row[idColumn],
                role,
                name: row.full_name
            });
        });
    });
}

exports.login = (req, res) => {
    const { userId, password } = req.body;

    if (typeof userId !== "string" || !userId.trim() || typeof password !== "string" || !password) {
        return res.status(400).json({ success: false, message: "يرجى تعبئة الحقول المطلوبة" });
    }

    authenticateFromTable("students", userId.trim(), password, (studentErr, student) => {
        if (studentErr) {
            console.error("Student login error:", studentErr);
            return res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
        }

        if (student) {
            return establishSession(req, student, res);
        }

        authenticateFromTable("instructors", userId.trim(), password, (doctorErr, doctor) => {
            if (doctorErr) {
                console.error("Instructor login error:", doctorErr);
                return res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
            }

            if (!doctor) {
                return res.status(401).json({ success: false, message: "خطأ في البيانات" });
            }

            establishSession(req, doctor, res);
        });
    });
};

exports.me = (req, res) => {
    res.json({ user: req.user });
};

exports.logout = (req, res) => {
    if (!req.session) {
        return res.json({ success: true });
    }

    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ success: false, message: "تعذر تسجيل الخروج" });
        }

        res.clearCookie("connect.sid");
        res.json({ success: true });
    });
};
