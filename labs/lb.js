document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId'); 
    if (!userId) {
        window.location.href = '/loginform/login2.html';
        return;
    }

    fetchLabSchedule(); 
    fetchLabsList();    
});
async function fetchLabSchedule() {
    try {
        const response = await fetch('/api/lab-occupancy');
        const data = await response.json();
        const tableBody = document.getElementById('labScheduleBody');
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا يوجد محاضرات رسمية مسجلة حالياً</td></tr>';
            return;
        }

        tableBody.innerHTML = ''; 
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="day-cell">${row.lab_name}</td>
                <td class="occupied-cell">${row.course_code}</td>
                <td>${row.day_of_week}</td>
                <td>${row.start_time.substring(0,5)}</td>
                <td>${row.end_time.substring(0,5)}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error fetching schedule:", err);
    }
}
async function fetchLabsList() {
    try {
        const res = await fetch('/api/labs');
        const labs = await res.json();
        const select = document.getElementById('labSelect');
        
        select.innerHTML = '<option value="" disabled selected>اختر مختبر...</option>';
        labs.forEach(lab => {
            const option = document.createElement('option');
            option.value = lab.lab_id;
            option.textContent = lab.lab_name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Error fetching labs:", err);
    }
}
document.getElementById('labBookingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const timeVal = document.getElementById('timeSelect').value;

    const bookingData = {
        student_id: localStorage.getItem('userId'),
        lab_id: document.getElementById('labSelect').value,
        booking_date: document.getElementById('dateInput').value,
      
        start_time: timeVal.length === 5 ? timeVal + ":00" : timeVal, 
        duration: document.getElementById('durationInput').value,
        seat_number: document.getElementById('seatInput').value || "Default"
    };

    console.log("البيانات المرسلة:", bookingData); 

    try {
        const res = await fetch('/api/book-lab', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        const result = await res.json();

        if (res.ok) {
            alert("✅ " + result.message);
            window.location.reload(); 
        } else {
          
            alert("⚠️ " + result.message);
        }
    } catch (err) {
        alert("  حدث خطأ في الاتصال بالسيرفر");
    }
});