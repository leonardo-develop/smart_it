document.addEventListener('DOMContentLoaded', () => {
    const instructorId = localStorage.getItem('instructorId');
    const instructorName = localStorage.getItem('instructorName');

    if (!instructorId) {
        window.location.href = '/login';
        return;
    }

    const nameEl = document.getElementById('dr_name_display');
    if (nameEl) nameEl.textContent = instructorName || "الأستاذ الدكتور";

    loadAllCourses(instructorId);
});
function getCleanName(fileName) {
    if (!fileName) return "";
    
    
    let clean = fileName.replace(/^(slides_files|books_files|syllabus_file)-\d+-/, '');
    
    clean = clean.replace(/-(\d+)\.([^.]+)$/, '.$2');

    return clean;
}

async function loadAllCourses(instructorId) {
    try {
        const response = await fetch(`/api/doctor-courses?id=${instructorId}`);
        const courses = await response.json();
        
        const container = document.getElementById('courses_container');
        const template = document.getElementById('course_template');

        if (!container || !template) return;
        if (courses.length === 0) {
            container.innerHTML = '<div class="no-data-msg">لا يوجد مساقات مسجلة حالياً في عهدتك.</div>';
            return;
        }

        container.innerHTML = ''; 

        courses.forEach(course => {
            const clone = template.content.cloneNode(true);

            clone.querySelectorAll('.course_title_ui').forEach(el => el.textContent = course.course_name);
            clone.querySelector('.course_title_ui_sub').textContent = course.course_name;
            clone.querySelector('.course_code_ui').textContent = course.course_code;
            clone.querySelector('.section_num_ui').textContent = course.Section_Number || "--";
            clone.querySelector('.student_count_ui').textContent = course.student_count || 0;
            clone.querySelector('.course_id_hidden').value = course.course_code;

        
            const syllContainer = clone.querySelector('.syllabus-container');
            if (course.syllabus_path) {
                syllContainer.innerHTML = `
                    <div class="file-item">
                        <span class="file-icon">📄</span>
                        <a href="/uploads/${course.syllabus_path}" target="_blank">
                           ${getCleanName(course.syllabus_path)}
                        </a>
                    </div>`;
            } else {
                syllContainer.innerHTML = '<span class="no-file">لا يوجد ملف مرفوع</span>';
            }

            const slidesContainer = clone.querySelector('.slides-container');
            if (course.slides_path) {
                try {
                    const slides = JSON.parse(course.slides_path);
                    slidesContainer.innerHTML = slides.map(file => `
                        <div class="file-item">
                            <span class="file-icon">📊</span>
                            <a href="/uploads/${file}" target="_blank" title="${file}">
                                ${getCleanName(file)}
                            </a>
                        </div>
                    `).join('');
                } catch (e) {
                    slidesContainer.innerHTML = `<div class="file-item"><a href="/uploads/${course.slides_path}" target="_blank">${getCleanName(course.slides_path)}</a></div>`;
                }
            } else {
                slidesContainer.innerHTML = '<span class="no-file">لا يوجد محاضرات مرفوعة</span>';
            }

            const booksContainer = clone.querySelector('.books-container');
            if (course.books_path) {
                try {
                    const books = JSON.parse(course.books_path);
                    booksContainer.innerHTML = books.map(file => `
                        <div class="file-item">
                            <span class="file-icon">📚</span>
                            <a href="/uploads/${file}" target="_blank" title="${file}">
                                ${getCleanName(file)}
                            </a>
                        </div>
                    `).join('');
                } catch (e) {
                    booksContainer.innerHTML = `<div class="file-item"><a href="/uploads/${course.books_path}" target="_blank">${getCleanName(course.books_path)}</a></div>`;
                }
            } else {
                booksContainer.innerHTML = '<span class="no-file">لا يوجد مراجع مرفوعة</span>';
            }

            const attendanceBtn = clone.querySelector('.attendance-btn');
            attendanceBtn.onclick = () => {
                window.location.href = `/managecourse/manage.html?code=${course.course_code}`;
            };

            const form = clone.querySelector('.upload-form');
            form.addEventListener('submit', handleUpload);

            container.appendChild(clone);
        });
    } catch (error) {
        console.error("Error loading courses:", error);
    }
}

async function handleUpload(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const submitBtn = event.target.querySelector('.update-btn');
    
    submitBtn.textContent = "جاري الحفظ والرفع...";
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/upload-course-files', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            alert("تم حفظ التعديلات بنجاح!");
            const instructorId = localStorage.getItem('instructorId');
            loadAllCourses(instructorId);
        } else {
            alert("فشل في حفظ التعديلات.");
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("خطأ في الاتصال بالسيرفر.");
    } finally {
        submitBtn.textContent = "حفظ جميع التعديلات النهائية للمادة";
        submitBtn.disabled = false;
    }
}