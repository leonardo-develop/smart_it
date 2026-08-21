const bcrypt = require("bcryptjs");
const db = require("../config/db");

function isBcryptHash(value) {
    return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

function hashTablePasswords(table, idColumn, callback) {
    db.query(`SELECT ${idColumn}, password FROM ${table}`, (err, rows) => {
        if (err) {
            return callback(err);
        }

        const updates = rows
            .filter((row) => !isBcryptHash(row.password))
            .map((row) => new Promise((resolve, reject) => {
                bcrypt.hash(row.password, 12, (hashErr, hash) => {
                    if (hashErr) {
                        return reject(hashErr);
                    }

                    db.query(
                        `UPDATE ${table} SET password = ? WHERE ${idColumn} = ?`,
                        [hash, row[idColumn]],
                        (updateErr) => updateErr ? reject(updateErr) : resolve()
                    );
                });
            }));

        Promise.all(updates).then(() => {
            console.log(`${table}: hashed ${updates.length} password(s)`);
            callback(null);
        }).catch(callback);
    });
}

hashTablePasswords("students", "student_id", (studentErr) => {
    if (studentErr) {
        console.error("Student password migration failed:", studentErr);
        process.exitCode = 1;
        return;
    }

    hashTablePasswords("instructors", "instructor_id", (instructorErr) => {
        if (instructorErr) {
            console.error("Instructor password migration failed:", instructorErr);
            process.exitCode = 1;
            return;
        }

        db.end();
    });
});
