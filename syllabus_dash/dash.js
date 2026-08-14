async function fetchDashboardData() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const courseCode = urlParams.get('courseCode') || urlParams.get('course_code'); 
    const studentId = localStorage.getItem('userId'); 

    if (!courseCode || !studentId) {
        document.querySelector('.page-title').textContent = "خطأ: معلومات المساق غير مكتملة";
        return;
    }

    try {
        const response = await fetch(`/api/course-dashboard/${courseCode}/${studentId}`);
        if (!response.ok) throw new Error("فشل في جلب البيانات من السيرفر");
        
        const data = await response.json();

     
        document.querySelector('.page-title').textContent = `${data.course_name} (${courseCode})`;
        
       
        const roomEl = document.querySelector('.room-highlight');
        if(roomEl) roomEl.textContent = data.Room_Location || 'قاعة غير محددة';

        const timeItems = document.querySelectorAll('.time-item');
        if (timeItems.length >= 2) {
         
            timeItems[0].innerHTML = `<strong>أيام المحاضرة:</strong> ${data.days || 'غير محدد'}`;
            
            const startTime = data.start_time || '--:--';
            const endTime = data.end_time || '--:--';
            timeItems[1].innerHTML = `<strong>الوقت:</strong> ${startTime} - ${endTime}`;
        }
        
        updateGradesUI(data);
     
        updateAnnouncementsUI(data.announcements);
       
        updateMaterialsUI(data.materials);

    } catch (error) {
        console.error("Dashboard Error:", error);
        document.querySelector('.page-title').textContent = "فشل تحميل بيانات المساق";
    }
}


function updateMaterialsUI(materials) {
    const container = document.getElementById('materialsContainer');
    if(!container) return;

    if (!materials || materials.length === 0) {
        container.innerHTML = '<h3>المحاضرات والملفات الدراسية</h3><p style="color:#777; text-align:center;">لا توجد ملفات مرفوعة حالياً.</p>';
        return;
    }

    let htmlContent = '<h3>المحاضرات والملفات الدراسية</h3><div class="materials-list">';
    htmlContent += materials.map(file => `
        <div class="material-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; background: #fff; margin-bottom: 8px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="text-align: right;">
                <strong style="color: #2c3e50; font-size: 1rem;">${file.file_name}</strong>
                <br><small style="color: #7f8c8d;">نوع الملف: ${file.file_type}</small>
            </div>
            <a href="${file.file_url}" class="download-btn" target="_blank" style="background: #8B4513; color: white; padding: 8px 18px; border-radius: 5px; text-decoration: none; font-size: 0.85em; transition: 0.3s;">تحميل</a>
        </div>
    `).join('');
    htmlContent += '</div>';
    
    container.innerHTML = htmlContent;
}

function updateGradesUI(data) {
    const tableBody = document.getElementById('gradesTableBody');
    if(tableBody) {
        tableBody.innerHTML = `
            <tr><td>المشاركة والوظائف</td><td>20</td><td>${data.participation_grade ?? 0}</td></tr>
            <tr><td>امتحان المنتصف (Midterm)</td><td>30</td><td>${data.midterm_grade ?? 0}</td></tr>
            <tr><td>الامتحان النهائي (Final)</td><td>50</td><td>${data.final_grade ?? '--'}</td></tr>
        `;
    }

    const alertBox = document.querySelector('.alert-box');
    if(alertBox) {
        const totalHours = (data.credit_hours || 3) * 15;
        const absences = data.absences || 0;
        const absPercentage = (absences / totalHours) * 100;
        
        alertBox.textContent = `مجموع غياباتك: ${absences} محاضرات. نسبة الغياب الحالية: ${absPercentage.toFixed(1)}%.`;
        alertBox.className = absPercentage > 15 ? "alert-box warning" : "alert-box success";
    }
}

function updateAnnouncementsUI(announcements) {
    const container = document.getElementById('announcementsContainer');
    if (!container) return;

    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">لا توجد إعلانات جديدة من مدرس المساق.</p>';
        return;
    }

    container.innerHTML = announcements.map(ann => `
        <div class="news-item" style="border-right: 4px solid #8B4513; padding: 10px 15px; margin-bottom: 10px; background: #fdfdfd; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div class="news-body">
                <strong style="display:block; margin-bottom:5px; color: #8B4513;">${ann.title}</strong>
                <p style="font-size:0.95em; color:#555; line-height: 1.4;">${ann.content}</p>
                <small style="color:#888;">نُشر في: ${new Date(ann.created_at).toLocaleDateString('ar-JO')}</small>
            </div>
        </div>
    `).join('');
}

fetchDashboardData();