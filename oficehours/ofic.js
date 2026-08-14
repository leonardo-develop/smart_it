document.addEventListener('DOMContentLoaded', () => {
    const instructorId = localStorage.getItem('instructorId');
    const instructorName = localStorage.getItem('instructorName');

    if (!instructorId) {
        window.location.href = '/loginform/login2.html';
        return;
    }

    if (document.getElementById('navDrName')) {
        document.getElementById('navDrName').textContent = instructorName;
    }

    loadSmartSuggestions(instructorId);
    loadSavedOfficeHours(instructorId);

    const form = document.getElementById('officeHoursForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});
function autoFill(day, start, end) {
    if(document.getElementById('day_select')) document.getElementById('day_select').value = day;
    if(document.getElementById('time_from')) document.getElementById('time_from').value = start;
    if(document.getElementById('time_to')) document.getElementById('time_to').value = end;
    document.getElementById('office_loc').focus();
}

async function loadSmartSuggestions(id) {
    try {
        const response = await fetch(`/api/suggest-office-hours?id=${id}`);
        const suggestions = await response.json();
        const box = document.getElementById('smartSuggestions');
        const list = document.getElementById('suggestionsList');

        if (suggestions && suggestions.length > 0) {
            box.style.display = 'block';
            list.innerHTML = suggestions.map(s => `
                <button type="button" class="sugg-btn" onclick="autoFill('${s.day}', '${s.start}', '${s.end}')">
                    ${translateDay(s.day)}: ${s.start} - ${s.end} 
                    <small>(${s.type})</small>
                </button>
            `).join('');
        }
    } catch (err) { console.error("خطأ في جلب المقترحات:", err); }
}
async function handleFormSubmit(event) {
    event.preventDefault();

    const startTime = document.getElementById('time_from').value;
    const endTime = document.getElementById('time_to').value;

    const getMinutes = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const duration = getMinutes(endTime) - getMinutes(startTime);

   
    if (duration > 60) {
        alert("⚠️ خطأ: لا يمكن أن تتجاوز مدة الساعة المكتبية الواحدة 60 دقيقة.");
        return; 
    }
    
    if (duration <= 0) {
        alert("⚠️ خطأ: وقت النهاية يجب أن يكون بعد وقت البداية.");
        return;
    }
    const data = {
        instructor_id: localStorage.getItem('instructorId'),
        day: document.getElementById('day_select').value,
        start: startTime,
        end: endTime,
        location: document.getElementById('office_loc').value
    };

    const response = await fetch('/api/save-office-hour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        alert("✅ تم تثبيت الساعة المكتبية بنجاح!");
        location.reload();
    }
}
async function loadSavedOfficeHours(id) {
    try {
        const response = await fetch(`/api/get-office-hours?id=${id}`);
        const data = await response.json();
        const tbody = document.getElementById('officeHoursTableBody');
        if(!tbody) return;

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${translateDay(item.day)}</td>
                <td>${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}</td>
                <td>${item.location || "غير محدد"}</td>
                <td>
                    <button onclick="deleteHour(${item.id})" class="delete-btn">حذف</button>
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error("خطأ في التحميل:", err); }
}

async function deleteHour(id) {
    if (!confirm("هل أنت متأكد؟")) return;
    const response = await fetch(`/api/delete-office-hour/${id}`, { method: 'DELETE' });
    if (response.ok) location.reload();
}

function translateDay(day) {
    const daysMap = { 'Sunday': 'الأحد', 'Monday': 'الاثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء', 'Thursday': 'الخميس' };
    return daysMap[day] || day;
}