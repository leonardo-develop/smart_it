document.addEventListener("DOMContentLoaded", () => {
 
    const studentId = localStorage.getItem("userId"); 
    if (studentId) {
        fetch(`/api/student/${studentId}`)
            .then(res => res.json())
            .then(data => {
               
                const nameElement = document.getElementById("navSTname");
                if(nameElement) {
                    nameElement.textContent = data.full_name || data.userName || "طالب ذكي";
                }
            })
            .catch(err => console.error("خطأ في جلب بيانات الطالب:", err));
    }

    loadFacultyMembers();
});

async function loadFacultyMembers() {
    try {
        const response = await fetch('/api/all-faculty');
        const facultyData = await response.json();

        const mainArea = document.querySelector(".content-area");
        
        mainArea.innerHTML = `
            <header class="main-header">
                <h1 class="page-title">أعضاء الهيئة التدريسية</h1>
                <p class="page-subtitle">تعرف على مدرسي الكلية ومواعيد ساعاتهم المكتبية للتواصل</p>
            </header>
        `;

        
        const departments = [...new Set(facultyData.map(doc => doc.department))];

        departments.forEach(dept => {
            const deptSection = document.createElement("section");
            deptSection.className = "dept-section";
            deptSection.innerHTML = `
                <h3 class="dept-title" style="margin-top:40px; color:#2c3e50; border-bottom:2px solid #3498db; display:inline-block; padding-bottom:5px;">
                    قسم ${dept}
                </h3>
                <div class="faculty-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top:20px;"></div>
            `;
            
            const grid = deptSection.querySelector(".faculty-grid");
            const deptDoctors = facultyData.filter(doc => doc.department === dept);
            
            deptDoctors.forEach(doc => {
                let hoursHTML = '';
                if (doc.office_hours && doc.office_hours.length > 0) {
                    doc.office_hours.forEach(hour => {
                        const dayName = translateDay(hour.day);
                        const start = hour.start_time.substring(0, 5);
                        const end = hour.end_time.substring(0, 5);
                        
                        hoursHTML += `
                            <div class="hour-item" style="display:flex; justify-content:space-between; background:#f8f9fa; padding:5px 10px; border-radius:4px; margin-bottom:5px; font-size:0.9em;">
                                <span class="day" style="font-weight:600;">${dayName}</span>
                                <span class="time" style="color:#3498db;">${start} - ${end}</span>
                            </div>`;
                    });
                } else {
                    hoursHTML = '<p style="font-size: 0.85em; color: #999; text-align: center; font-style: italic;">لا توجد ساعات مدرجة حالياً</p>';
                }

                grid.innerHTML += `
                    <div class="st-dr-card" style="background:#fff; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1); padding:20px; transition: transform 0.3s ease;">
                        <div style="text-align:center; margin-bottom:15px;">
                            <img src="/uploads/images/doctorprofileim.jpg" class="dr-img" alt="Doctor Profile" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid #3498db;">
                        </div>
                        <h4 class="dr-name-text" style="text-align:center; color:#2c3e50; margin-bottom:15px;">${doc.full_name}</h4>
                        <div class="academic-info-box" style="font-size:0.9em; line-height:1.6; color:#555; margin-bottom:15px; padding:10px; background:#fcfcfc; border-radius:8px;">
                            <p><b>🎓 التخصص:</b> ${doc.specialization || 'غير محدد'}</p>
                            <p><b>📍 المكتب:</b> ${doc.office_room || 'غير محدد'}</p>
                            <p><b>📧 البريد:</b> <span style="font-size:0.85em;">${doc.email || 'غير محدد'}</span></p>   
                        </div>
                        <div class="office-hours-box">
                            <h5 style="margin-bottom:10px; font-size:1em; color:#2c3e50;">📅 الساعات المكتبية:</h5>
                            <div class="hours-list">
                                ${hoursHTML}
                            </div>
                        </div>
                    </div>
                `;
            });

            mainArea.appendChild(deptSection);
        });

    } catch (err) {
        console.error("خطأ في تحميل أعضاء هيئة التدريس:", err);
    }
}
//عملت هالفنكشن عشان يدعم ترجمة الايام 
function translateDay(day) {
    const daysMap = {
        'Sunday': 'الأحد',
        'Monday': 'الاثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
        'Saturday': 'السبت'
    };
    return daysMap[day] || day;
}