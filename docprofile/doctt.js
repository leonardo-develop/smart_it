document.addEventListener("DOMContentLoaded", () => {
  
    const docId = localStorage.getItem("instructorId");
    
    const finalId = docId || localStorage.getItem("userId");

    if (!finalId) {
        console.log("لم يتم العثور على هوية، جاري التحويل للوجن...");
        window.location.href = "/loginform/login2.html";
        return;
    }
    fetch(`/api/doctor/${finalId}`)
        .then(res => {
            if (!res.ok) {
                throw new Error("غير مصرح لك بالوصول أو البيانات غير موجودة");
            }
            return res.json();
        })
        .then(data => {
     
            if(document.getElementById('navDrName')) document.getElementById('navDrName').textContent = "د. " + data.full_name;
            if(document.getElementById('drName')) document.getElementById('drName').textContent = "د. " + data.full_name;
            if(document.getElementById('drTitle')) document.getElementById('drTitle').textContent = "قسم " + data.department;
            if(document.getElementById('drEmail')) document.getElementById('drEmail').textContent = data.email;
            if(document.getElementById('drOffice')) document.getElementById('drOffice').textContent = data.office_room;
            if(document.getElementById('drRank')) document.getElementById('drRank').textContent = data.academic_rank;
            if(document.getElementById('drMajor')) document.getElementById('drMajor').textContent = data.specialization;
            if(document.getElementById('drJoinYear')) document.getElementById('drJoinYear').textContent = data.hire_date;
            if(document.getElementById('drBio')) document.getElementById('drBio').textContent = data.bio || "لا يوجد نبذة شخصية حالياً";

   
            if (data.profile_img) {
                const fullImagePath = "/uploads/images/" + data.profile_img;
                if(document.getElementById('navDrImg')) document.getElementById('navDrImg').src = fullImagePath;
                if(document.getElementById('mainImg')) document.getElementById('mainImg').src = fullImagePath;
            }
            
            loadAchievements(finalId);
        })
        .catch(err => {
            console.error("Error:", err);
          
        });
});

function loadAchievements(id) {
    fetch(`/api/doctor-achievements/${id}`)
        .then(res => res.json())
        .then(list => {
            const resList = document.getElementById('resList');
            if (resList && list && list.length > 0) {
                resList.innerHTML = "";
                list.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item.title;
                    resList.appendChild(li);
                });
            }
        }).catch(e => console.log("لا يوجد أبحاث حالياً"));
}