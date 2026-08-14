document.addEventListener("DOMContentLoaded", () => {
  
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get('code'); 
    
    if (!courseCode) {
        alert("يرجى اختيار مساق أولاً");
        window.location.href = "/syllabus/syll.html"; 
        return;
    }

  
    if(document.getElementById("displayCourseCode")) {
        document.getElementById("displayCourseCode").textContent = courseCode;
    }
    if(document.getElementById("courseTitle")) {
        document.getElementById("courseTitle").textContent = `إدارة مساق: ${courseCode}`;
    }
    
    loadStudents(courseCode);
});

async function loadStudents(courseCode) {
    try {
        const response = await fetch(`/api/course-students/${courseCode}`);
        const students = await response.json();
        
        const tbody = document.getElementById("studentsBody");
        if (!tbody) return;
        
        tbody.innerHTML = ""; 

        students.forEach(student => {
            const absPercent = student.absence_percentage ? Number(student.absence_percentage) : 0;
            const warningClass = absPercent > 15 ? 'warning-text' : '';
            
           
            const midterm = Number(student.midterm_grade) || 0;
            const participation = Number(student.participation_grade) || 0;
            const finalGrade = Number(student.final_grade) || 0; 
            
            const total = midterm + participation + finalGrade;

            const row = `
                <tr>
                    <td>${student.student_name}</td>
                    <td>${student.student_id}</td>
                    <td><input type="number" class="midterm-input" value="${midterm}" data-id="${student.student_id}" oninput="calculateRowTotal(this)" min="0" max="30"></td>
                    <td><input type="number" class="participation-input" value="${participation}" data-id="${student.student_id}" oninput="calculateRowTotal(this)" min="0" max="20"></td>
                    <td><input type="number" class="final-input" value="${finalGrade}" data-id="${student.student_id}" oninput="calculateRowTotal(this)" min="0" max="50"></td>
                    <td class="absences-count">${student.absences || 0}</td>
                    <td class="${warningClass}">${absPercent.toFixed(1)}%</td>
                    <td class="total-grade-cell" style="font-weight: bold;">${total}</td>
                    <td>
                        <select class="status-select" data-id="${student.student_id}">
                            <option value="Present">حاضر</option>
                            <option value="Absent">غائب</option>
                        </select>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (err) {
        console.error("خطأ في تحميل الطلاب:", err);
    }
}

function calculateRowTotal(inputElement) {
    const row = inputElement.closest("tr");
    if (!row) return;

    const midterm = Number(row.querySelector(".midterm-input").value) || 0;
    const participation = Number(row.querySelector(".participation-input").value) || 0;
    const finalGrade = Number(row.querySelector(".final-input").value) || 0; 

 
    const totalCell = row.querySelector(".total-grade-cell");
    if (totalCell) {
        totalCell.textContent = midterm + participation + finalGrade;
    }
}

async function saveAllData() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get('code'); 
    
    const rows = document.querySelectorAll("#studentsBody tr");
    const studentData = [];

    if (rows.length === 0) {
        alert("لا توجد بيانات لحفظها");
        return;
    }

    rows.forEach(row => {
        const midInput = row.querySelector(".midterm-input");
        const partInput = row.querySelector(".participation-input");
        const finalInput = row.querySelector(".final-input"); 
        const statusSel = row.querySelector(".status-select");

        if (midInput && partInput && finalInput && statusSel) {
            const sId = midInput.getAttribute("data-id");
            studentData.push({ 
                id: sId, 
                midterm: midInput.value, 
                participation: partInput.value, 
                final: finalInput.value, 
                status: statusSel.value 
            });
        }
    });

    try {
        const response = await fetch('/api/save-course-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseCode, studentData })
        });

        if (response.ok) {
            alert("تم حفظ العلامات وتحديث سجل الغياب بنجاح بما فيها الفاينل!");
            location.reload(); 
        } else {
            const errorData = await response.text();
            alert("فشل الحفظ: " + errorData);
        }
    } catch (err) {
        console.error("Error saving data:", err);
        alert("حدث خطأ أثناء الاتصال بالسيرفر");
    }
}