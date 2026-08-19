# Smart IT Hub — Backend (بعد إعادة الهيكلة)

تم تقسيم ملف `lognode.js` الأصلي (741 سطر بملف واحد) إلى بنية منظمة على نمط
**Routes → Controllers → Config/Utils**، بدون تغيير أي سلوك أو منطق عمل موجود
(إلا حالتين تصحيح أخطاء واضحتين موضحتين تحت).

## البنية

```
smart-it-hub/
├── server.js                  # نقطة الدخول: يجمّع الميدل وير والراوترات فقط
├── package.json
├── .env.example                # مثال لمتغيرات البيئة (انسخه إلى .env)
├── config/
│   └── db.js                   # الاتصال بقاعدة البيانات (يقرأ من .env الآن)
├── middlewares/
│   └── upload.js                # إعداد multer لرفع ملفات المساقات
├── routes/
│   ├── index.js                 # يجمع كل راوترات /api في مكان واحد
│   ├── pages.routes.js          # الصفحات الثابتة (/, /login, /displayp ...)
│   ├── auth.routes.js           # /api/login
│   ├── course.routes.js         # كل مسارات المساقات والرفع والعلامات
│   ├── student.routes.js        # مسارات الطالب + الداشبورد + المتصدرين
│   ├── instructor.routes.js     # مسارات الدكاترة/الكادر
│   ├── officeHours.routes.js    # الساعات المكتبية
│   ├── maintenance.routes.js    # طلبات الصيانة
│   └── lab.routes.js            # حجز وإشغال المختبرات
├── controllers/
│   ├── auth.controller.js
│   ├── course.controller.js
│   ├── student.controller.js
│   ├── instructor.controller.js
│   ├── officeHours.controller.js
│   ├── maintenance.controller.js
│   └── lab.controller.js
└── utils/
    └── officeHoursHelper.js     # calculateGaps / timeToMinutes / addOneHour...
```

## طريقة التشغيل

```bash
npm install
cp .env.example .env     # عدّل القيم حسب جهازك
npm run dev               # أو npm start
```

> ملاحظة: لازم تحط مجلدات `landpage/`, `loginform/`, `studentinfo/`, `docprofile/`,
> `managecourse/`, `syllabus/` بجانب `server.js` متل ما كانت بالمشروع الأصلي،
> لأن `pages.routes.js` بيقرأ منها بنفس المسارات القديمة تماماً.

## شو انصلح أثناء إعادة الهيكلة (Bug Fixes بدون تغيير المنطق العام)

1. **مسار مكرر**: كان فيه `app.get("/api/course-students/:courseCode", ...)`
   معرّف مرتين بنفس الملف (نسخة كاملة ونسخة مبسطة). Express كان دايماً يشغّل
   أول نسخة فقط والثانية كانت كود ميت. تم الإبقاء على النسخة الكاملة فقط.
2. **مسار مكرر مشابه**: `/api/student/:studentId` و `/api/student/:id` هما
   نفس النمط بالنسبة لـ Express (باراميتر واحد)، فالنسخة الثانية كانت كود ميت.
   تم الإبقاء على النسخة الكاملة (اللي فيها major/gpa/completed_hours).
3. **دالة مكررة**: `timeToMinutes` كانت معرّفة مرتين بنفس الملف. تم توحيدها
   بملف `utils/officeHoursHelper.js`.
4. **باغ بالداشبورد**: بمسار `course-dashboard` كان الكود يقرأ
   `data.Room_Location` بينما اسم العمود اللي راجع من SQL هو `room_location`
   (بحروف صغيرة)، فكانت القيمة `undefined` دايماً. تم تصحيحها لـ
   `data.room_location`.
5. **ثغرة أمان بسيطة**: بمسار `/api/delete-course-file` كان اسم العمود
   (`fileType`) يُدرج مباشرة جوا جملة SQL بدون أي تحقق (خطر SQL Injection لو
   انفتح المسار مستقبلاً لأي إدخال غير موثوق). تمت إضافة قائمة بيضاء
   (`whitelist`) تسمح فقط بـ `syllabus_path` / `slides_path` / `books_path`.
6. **بيانات الاتصال بقاعدة البيانات**: انتقلت من نص صريح بالكود (`password: "1234"`)
   إلى متغيرات بيئة `.env` (ممارسة أساسية بالأمان، خصوصاً لو الكود رح يترفع
   على Git).

كل باقي الـ Routes نُقلت **حرفياً بنفس الاستعلامات ونفس الرسائل** بدون أي
تعديل بالمنطق، فقط تم فصلها حسب المسؤولية.
