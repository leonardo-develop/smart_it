document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("instructorId");

    if (!userId) {
        window.location.href = "/loginform/login2.html";
        return;
    }

    // 1. جلب بيانات المدرس وتثبيت الرقم الأكاديمي كـ Read Only
    fetch(`/api/doctor/${userId}`)
        .then(res => res.json())
        .then(data => {
            const nameInput = document.querySelector('input[readonly]:nth-of-type(1)');
            const idInput = document.querySelector('input[readonly]:nth-of-type(2)');
            const navName = document.getElementById('navDrName');

            if (data.full_name) {
                if (nameInput) nameInput.value = data.full_name;
                if (navName) navName.textContent = data.full_name;
            }
            
            if (idInput) {
                idInput.value = data.instructor_id; // استخدام instructor_id
                idInput.readOnly = true; 
            }
        })
        .catch(err => console.error("Error fetching instructor data:", err));

    const maintenanceForm = document.getElementById('maintenanceForm');
    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const phoneInput = maintenanceForm.querySelector('input[type="text"]:not([readonly])');
            const phone = phoneInput.value.trim();
        
            const phoneRegex = /^07[789]\d{7}$/;

            if (!phoneRegex.test(phone)) {
                alert("يجب أن يكون رقم الهاتف مكوناً من 10 خانات ويبدأ بـ 079 أو 078 أو 077");
                phoneInput.focus();
                return;
            }

            const locationVal = maintenanceForm.querySelectorAll('select')[0].value;
            const typeVal = maintenanceForm.querySelectorAll('select')[1].value; 
            const description = maintenanceForm.querySelector('textarea').value;

            const formData = {
                instructor_id: userId,
                phone: phone,
                location: locationVal,
                issue_type: typeVal, 
                description: description
            };

            fetch('/api/maintenancerequest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    alert("تم إرسال بلاغ الصيانة بنجاح.");
                    location.reload(); 
                } else {
                    alert("تنبيه: " + result.message);
                }
            })
            .catch(err => alert("حدث خطأ أثناء الإرسال."));
        });
    }

    
    fetch(`/api/mymaintenance/${userId}`)
        .then(res => res.json())
        .then(requests => {
            const tableBody = document.querySelector('.data-table tbody');
            if (!tableBody) return;

            tableBody.innerHTML = ""; 

            if (requests.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا يوجد طلبات سابقة.</td></tr>';
                return;
            }

            requests.forEach(req => {
             
                const statusClass = req.status === 'pending' ? 'status-pending' : 'status-completed';
                const statusText = req.status === 'pending' ? 'قيد المعالجة' : 'تم الإصلاح';

                const row = `
                    <tr>
                        <td>#${req.request_id}</td>
                        <td>${req.location}</td>
                        <td><span class="${statusClass}">${statusText}</span></td>
                        <td>${req.issue_type || "غير محدد"}</td> <!-- التعديل هنا ليعرض من issue_type -->
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        })
        .catch(err => console.error("Error loading history:", err));
});