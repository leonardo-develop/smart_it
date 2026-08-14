document.addEventListener("DOMContentLoaded", () => {
    // عرض اسم الدكتور في الـ Navbar (اختياري لو مخزن باللوكال ستورج عند اللوجن)
    const drName = localStorage.getItem('instructorName') || "دكتور";
    if(document.getElementById('navDrName')) {
        document.getElementById('navDrName').textContent = drName;
    }

    fetchInstructors();
});

async function fetchInstructors() {
    const seGrid = document.getElementById('se-faculty-grid');
    const csGrid = document.getElementById('cs-faculty-grid');
    const cachedData = localStorage.getItem('facultyData');
    if (cachedData) {
        console.log("عرض البيانات من الكاش...");
        renderInstructors(JSON.parse(cachedData), seGrid, csGrid);
    }

    try {
        const response = await fetch('/api/instructors');
        if (!response.ok) throw new Error("فشل في الاتصال بالسيرفر");
        
        const instructors = await response.json();

     
        localStorage.setItem('facultyData', JSON.stringify(instructors));

        renderInstructors(instructors, seGrid, csGrid);

    } catch (error) {
        console.error("خطأ في جلب بيانات الدكاترة:", error);
        if (!cachedData) {
            seGrid.innerHTML = '<p class="error-msg">فشل تحميل البيانات، يرجى المحاولة لاحقاً.</p>';
        }
    }
}
function renderInstructors(instructors, seGrid, csGrid) {
    const aiGrid = document.getElementById('ai-faculty-grid');
    
    if (!seGrid || !csGrid || !aiGrid) return;

    seGrid.innerHTML = '';
    csGrid.innerHTML = '';
    aiGrid.innerHTML = '';

    instructors.forEach(doc => {
        const card = createInstructorCard(doc);
        const dept = doc.department ? String(doc.department).trim().toLowerCase() : "";

        
        if (dept.includes('software engineering') || dept === 'se') {
            seGrid.appendChild(card);
        } 
        else if (dept.includes('ai') || dept.includes('artificial intelligence') || dept.includes('data science')) {
            aiGrid.appendChild(card);
        }
       
        else if (dept.includes('computer science') || dept.includes('cybersecurity') || dept === 'cs') {
            csGrid.appendChild(card);
        }
        else {
            //  أي مسمى آخر غير اللي فوق عملته احتياط عشان اذا صار خربطة بالداتا بيز 
            console.warn(`القسم "${dept}" غير مصنف، سيتم وضعه في قسم علم الحاسوب كافتراضي`);
            csGrid.appendChild(card); 
        }
    });
}
function createInstructorCard(doc) {
    const card = document.createElement('div');
    card.className = 'dr-card';

    const rawAchievements = doc.achievements_list || "";
    const achievementsList = rawAchievements
        ? rawAchievements.split('|').map(ach => `<li>${ach}</li>`).join('')
        : '<li>عضو هيئة تدريس متميز في الكلية</li>';

    card.innerHTML = `
        <div class="dr-header">
            <img src="/uploads/images/${doc.profile_img || 'doctorprofileim.jpg'}" class="dr-img" onerror="this.src='/uploads/images/doctorprofileim.jpg'">
            <div class="dr-main-info">
                <h4 class="dr-name">${doc.full_name}</h4>
                <span class="dr-tag">${doc.academic_rank}</span>
            </div>
        </div>
        <div class="dr-details">
            <p><b>التخصص:</b> ${doc.specialization}</p>
            <p><b>المكتب:</b> ${doc.office_room || 'غير محدد'}</p>
            <p><b>الإيميل:</b> <span style="font-size: 0.85em; color: #8B4513;">${doc.email}</span></p>
        </div>
        <div class="achievements-box">
            <h5>🏆 الأبحاث والإنجازات:</h5>
            <ul class="achievement-list">
                ${achievementsList}
            </ul>
        </div>
    `;
    return card;
}