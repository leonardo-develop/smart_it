document.addEventListener("DOMContentLoaded", () => {
    const studentId = localStorage.getItem("userId");
    if (!studentId) {
        window.location.href = "/loginform/login2.html"; 
        return;
    }
    fetch(`/api/student/${studentId}`)
        .then(res => {
            if (!res.ok) throw new Error("الطالب غير موجود في قاعدة البيانات");
            return res.json();
        })
        .then(data => {
            updateProfileUI(data);
        })
        .catch(err => {
            console.error("خطأ في جلب بيانات الطالب:", err);
            document.getElementById('studentName').textContent = "خطأ في التحميل";
        });
    fetch(`/api/student-courses/${studentId}`) 
        .then(res => {
            if (!res.ok) throw new Error("فشل في جلب قائمة المواد");
            return res.json();
        })
        .then(courses => {
            renderCourses(courses);
        })
        .catch(err => {
            console.error("Error fetching courses:", err);
            const container = document.getElementById('coursesContainer');
            if(container) container.innerHTML = "<p style='text-align:center; color:red;'>حدث خطأ أثناء تحميل المواد</p>";
        });
});
function renderCourses(courses) {
    const container = document.getElementById('coursesContainer');
    const totalHoursLabel = document.getElementById('currentTotalHours');
    const currentSemHoursStat = document.getElementById('currentSemesterHours');
    
    if (!container) return;
    container.innerHTML = ""; 
    let totalCurrentSem = 0;

    if (courses.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>لا يوجد مواد مسجلة لهذا الفصل</p>";
        return;
    }

    courses.forEach(course => {
        totalCurrentSem += course.credit_hours;
        container.innerHTML += `
            <div class="course-item clickable-course" onclick="goToDashboard('${course.course_code}')">
                <div class="course-info">
                    <span class="course-name">${course.course_name}</span>
                    <span class="course-code">${course.course_code}</span>
                </div>
                <span class="course-hours">${course.credit_hours} ساعات</span>
            </div>`;
    });

    if(totalHoursLabel) totalHoursLabel.textContent = totalCurrentSem + " ساعة معتمدة";
    if(currentSemHoursStat) currentSemHoursStat.textContent = totalCurrentSem;
}
function goToDashboard(courseCode) {
    window.location.href = `/syllabus_dash/sylabus.html?course_code=${courseCode}`;
}

function updateProfileUI(data) {
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    safeSetText('studentName', data.full_name);
    safeSetText('studentIdDisplay', data.student_id);
    safeSetText('studentMajor', data.major);
    
    const gpa = data.gpa || 0;
    safeSetText('gpaValue', gpa + "%");
    safeSetText('gpaBadge', gpa + "%");
    safeSetText('gpaGradeText', getGradeText(gpa));

    const totalPlan = data.total_hours || 132; 
    const completed = data.completed_hours || 0;
    const remaining = totalPlan - completed;
    const progressPercent = Math.round((completed / totalPlan) * 100);

    safeSetText('statTotalHours', totalPlan);
    safeSetText('totalHoursText', totalPlan);
    safeSetText('statCompletedHours', completed);
    safeSetText('completedHoursText', completed);
    safeSetText('remainingHours', remaining);

    const progressBar = document.getElementById('studentProgressBar');
    const progressText = document.getElementById('progressPercentage');
    if (progressBar) progressBar.value = progressPercent;
    if (progressText) progressText.textContent = progressPercent + "% مكتمل";
}

function getGradeText(gpa) {
    if (gpa >= 84) return "امتياز";
    if (gpa >= 76) return "جيد جداً";
    if (gpa >= 68) return "جيد";
    if (gpa >= 60) return "مقبول";
    return "ضعيف";
}