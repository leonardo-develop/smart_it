document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem("userId");
    
    const courseSelect = document.getElementById('courseSelect');
    const sectionSelect = document.getElementById('sectionSelect');
    const tableBody = document.getElementById('tableBody'); 
    const saveButton = document.getElementById('saveAllBtn');

    if (!courseSelect || !sectionSelect) return;

    // 1. جلب الكورسات
    if (userId) {
        fetch(`/api/doctor-courses/${userId}`)
            .then(res => res.json())
            .then(courses => {
                courseSelect.innerHTML = '<option value="">-- اختر المساق --</option>';
                courses.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.course_code;
                    opt.textContent = `${c.course_name} - شعبة ${c.Section_Number}`;
                    opt.setAttribute('data-section', c.Section_Number);
                    courseSelect.appendChild(opt);
                });
            });
    }

    // 2. تحديث الشعبة وجلب الطلاب
    courseSelect.addEventListener('change', () => {
        const selectedOption = courseSelect.options[courseSelect.selectedIndex];
        const sectionNo = selectedOption ? selectedOption.getAttribute('data-section') : null;
        
        if (sectionNo && courseSelect.value !== "") {
            sectionSelect.innerHTML = `<option value="${sectionNo}">شعبة ${sectionNo}</option>`;
            fetchStudents(courseSelect.value, sectionNo);
        } else {
            sectionSelect.innerHTML = '<option value="">-- اختر الشعبة --</option>';
            if (tableBody) tableBody.innerHTML = ''; 
        }
    });

    function fetchStudents(course, section) {
        fetch(`/api/students-list?course=${course}&section=${section}`)
            .then(res => res.json())
            .then(data => renderTable(data));
    }
    function updateRowTotal(row) {
        const part = parseFloat(row.querySelector('input[name^="part_"]').value) || 0;
        const mid = parseFloat(row.querySelector('input[name^="mid_"]').value) || 0;
        const fin = parseFloat(row.querySelector('input[name^="fin_"]').value) || 0;
        
        const total = part + mid + fin;
        const totalCell = row.querySelector('.total-cell');
        if (totalCell) {
            totalCell.innerText = total;
            totalCell.style.color = total < 50 ? '#e74c3c' : '#27ae60';
        }
    }

    function renderTable(students) {
        if (!tableBody) return;
        tableBody.innerHTML = ''; 
        students.forEach(std => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${std.student_id}</td>
                <td>${std.full_name}</td>
                <td>
                    <input type="radio" name="att_${std.student_id}" value="present"> ح
                    <input type="radio" name="att_${std.student_id}" value="absent"> غ
                </td>
                <td><input type="number" name="abs_${std.student_id}" value="${std.absences || 0}" style="width:60px;"></td>
                <td><input type="number" name="part_${std.student_id}" value="${std.participation_grade || 0}" class="grade-input" style="width:60px;"></td>
                <td><input type="number" name="mid_${std.student_id}" value="${std.midterm_grade || 0}" class="grade-input" style="width:60px;"></td>
                <td><input type="number" name="fin_${std.student_id}" value="${std.final_grade || 0}" class="grade-input" style="width:60px;"></td>
                <td><strong class="total-cell">0</strong></td>
            `;
            tableBody.appendChild(row);
            
            updateRowTotal(row);

            
            row.querySelectorAll('.grade-input').forEach(input => {
                input.addEventListener('input', () => updateRowTotal(row));
            });
        });
    }
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const rows = document.querySelectorAll('#tableBody tr');
            const gradesData = [];

            rows.forEach(row => {
                const studentId = row.cells[0].innerText;
                gradesData.push({
                    id: studentId,
                    abs: row.querySelector(`input[name="abs_${studentId}"]`).value,
                    part: row.querySelector(`input[name="part_${studentId}"]`).value,
                    mid: row.querySelector(`input[name="mid_${studentId}"]`).value,
                    fin: row.querySelector(`input[name="fin_${studentId}"]`).value
                });
            });

            const payload = {
                course_code: courseSelect.value,
                section_no: sectionSelect.value,
                gradesData: gradesData
            };

            fetch('/api/save-grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(result => {
                if (result.success) alert("✅ " + result.message);
                else alert("❌ فشل: " + result.error);
            });
        });
    }
});