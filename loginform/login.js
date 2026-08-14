loginForm.onsubmit = function(event) {
    event.preventDefault(); 
    const idValue = userId.value.trim();
    const passValue = passwordInput.value.trim();

    const resetStyles = () => {
        userId.style.borderColor = "";
        userId.style.boxShadow = "";
        passwordInput.style.borderColor = "";
        passwordInput.style.boxShadow = "";
    };

    const applyErrorStyle = (element) => {
        element.style.borderColor = "red";
        element.style.boxShadow = "0 0 5px red";
    };

    resetStyles();
   
    if (idValue === "" || passValue === "") {
        if (idValue === "") applyErrorStyle(userId);
        if (passValue === "") applyErrorStyle(passwordInput);
        alert("يرجى تعبئة الحقول الفارغة");
        return; 
    }

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: idValue, password: passValue })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                applyErrorStyle(userId);
                applyErrorStyle(passwordInput);
                throw new Error(err.message || "البيانات المدخلة غير صحيحة");
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // 1. أهم خطوة: تصفير الـ LocalStorage عشان ما يختلط القديم بالجديد
            localStorage.clear();

            // 2. التخزين الذكي بناءً على الـ Role اللي بعته السيرفر
            if (data.role === 'doctor') {
                localStorage.setItem("instructorId", data.id);
                localStorage.setItem("instructorName", data.name);
                localStorage.setItem("userRole", "doctor");
            } else {
                localStorage.setItem("userId", data.id); // للطالب
                localStorage.setItem("userName", data.name);
                localStorage.setItem("userRole", "student");
            }

            // 3. التوجه للمسار التلقائي
            window.location.href = data.redirect; 
        }
    })
    .catch(err => {
        console.error("خطأ:", err);
        alert(err.message);
    });
};